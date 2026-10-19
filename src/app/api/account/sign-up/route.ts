import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { env, isSupabaseConfigured } from "@/lib/env";
import { describeRequest } from "@/lib/account/request-info";
import { verifyTurnstile } from "@/lib/security/turnstile";
import { rateHit } from "@/lib/security/rate-limit";
import { usernameProblem } from "@/lib/username";

/**
 * Server-side sign-up gateway. The browser form posts here instead of calling
 * Supabase directly, so every sign-up passes a Cloudflare Turnstile check and a
 * per-IP rate limit before an account (and a confirmation email) is created.
 *
 * It only triggers the confirmation email — with email confirmation on, no
 * session is returned, so there is nothing to hand back to the browser. The
 * confirmation link lands on /auth/callback, which signs the member in.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { ok: false, error: "Member accounts are not configured in this environment." },
      { status: 503 },
    );
  }

  let payload: {
    username?: string;
    email?: string;
    password?: string;
    token?: string;
  };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  const username = (payload.username ?? "").trim();
  const email = (payload.email ?? "").trim();
  const password = payload.password ?? "";

  const info = describeRequest(request.headers);

  // Per-IP rate limit: at most 5 sign-ups per hour from one address.
  if (!(await rateHit("signup", info.ip, 3600, 5))) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Please try again later." },
      { status: 429 },
    );
  }

  // Cloudflare Turnstile, verified server-side.
  const turnstile = await verifyTurnstile(payload.token, info.ip);
  if (!turnstile.ok) {
    return NextResponse.json(
      { ok: false, error: "Could not verify you are human. Please try again." },
      { status: 400 },
    );
  }

  // Server-side validation (never trust the browser).
  if (usernameProblem(username)) {
    return NextResponse.json({ ok: false, error: "Please choose a valid username." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Please enter a valid email address." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ ok: false, error: "Please use at least 8 characters for your password." }, { status: 400 });
  }

  const origin =
    request.headers.get("origin") ||
    (request.headers.get("host") ? `https://${request.headers.get("host")}` : env.siteUrl);

  const supabase = createClient(env.supabaseUrl!, env.supabaseAnonKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: { username },
    },
  });

  if (error) {
    if (/already registered/i.test(error.message)) {
      return NextResponse.json({ ok: false, error: "already-registered" }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  // With email confirmation on, an existing email comes back as a user with no
  // identities rather than an error.
  if (data.user && data.user.identities?.length === 0) {
    return NextResponse.json({ ok: false, error: "already-registered" }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}
