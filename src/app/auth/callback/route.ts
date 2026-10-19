import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMemberUser, claimPurchases, safeNext } from "@/lib/member";
import { afterSignIn, recoveryCookie } from "@/lib/account/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OTP_TYPES = new Set<string>(["signup", "email", "recovery", "email_change", "magiclink", "invite"]);

/**
 * Where every member link lands:
 *   - Google sign-in returns here with `?code=` (PKCE), exchanged for a session.
 *   - Confirmation and password-reset emails link here with
 *     `?token_hash=...&type=...` (see supabase/email-templates). That form works
 *     on any device, so clicking the email signs the member straight in.
 * On success it claims any guest purchases made with the verified email and
 * continues to `next`, or to the username step for a first Google sign-in.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const next = safeNext(url.searchParams.get("next"));

  const toSignIn = (error: string) =>
    NextResponse.redirect(new URL(`/sign-in?error=${error}`, url.origin), 302);

  const supabase = await createSupabaseServerClient();
  if (!supabase) return toSignIn("not_configured");

  let failed = false;
  if (tokenHash && type && OTP_TYPES.has(type)) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash: tokenHash,
    });
    failed = Boolean(error);
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    failed = Boolean(error);
  } else {
    failed = true;
  }
  if (failed) return toSignIn(type === "recovery" ? "reset_link" : "link");

  const member = await getMemberUser();
  if (!member) return toSignIn("link");

  await claimPurchases(member);
  // Welcome email on a first confirmed sign-in; new sign-in alert for an unknown browser.
  const { cookie } = await afterSignIn(member, req.headers);

  // A member without a handle (first Google sign-in, or a sign-up whose chosen
  // name was taken in the meantime) picks one before anything else, except
  // when they came to set a new password.
  const destination =
    !member.profile?.username && next !== "/account/password"
      ? `/account/username?next=${encodeURIComponent(next)}`
      : next;

  const res = NextResponse.redirect(new URL(destination, url.origin), 302);
  if (cookie) res.cookies.set(cookie.name, cookie.value, cookie.options);
  // A reset link: for a few minutes the password form asks for no current password.
  if (type === "recovery") {
    const recovery = recoveryCookie(member.id);
    res.cookies.set(recovery.name, recovery.value, recovery.options);
  }
  return res;
}
