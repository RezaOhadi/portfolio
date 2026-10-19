import { NextResponse } from "next/server";
import { getMemberUser } from "@/lib/member";
import { afterSignIn } from "@/lib/account/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Called by the sign-in form right after a password sign-in succeeds (link
 * and Google sign-ins pass through /auth/callback instead). Records the
 * browser and sends the welcome or new sign-in email when due.
 */
export async function POST(req: Request) {
  const member = await getMemberUser();
  if (!member) return NextResponse.json({ ok: false }, { status: 401 });
  const { cookie } = await afterSignIn(member, req.headers);
  const res = NextResponse.json({ ok: true });
  if (cookie) res.cookies.set(cookie.name, cookie.value, cookie.options);
  return res;
}
