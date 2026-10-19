import { cookies } from "next/headers";
import { getMemberUser, type MemberUser } from "@/lib/member";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isRecoveryCookie, RECOVERY_COOKIE, sessionFacts, type SessionFacts } from "@/lib/account/security";

/**
 * What this member must provide, worked out from their account and session:
 *  - a current password, when they have one and did not arrive by reset link;
 *  - an emailed code, when they have no password yet (our own code), or when
 *    the session is older than Supabase's 24-hour window (Supabase's code).
 * The password action enforces exactly this; the page only shapes the form.
 */
export function passwordRequirements(member: MemberUser, facts: SessionFacts) {
  const first = !member.hasPassword;
  return {
    first,
    needsCurrent: member.hasPassword && !facts.recovery,
    codeSource: facts.stale ? ("supabase" as const) : first ? ("own" as const) : null,
  };
}

/** The member, their session and what the form must ask of them. */
export async function passwordContext() {
  const member = await getMemberUser();
  const supabase = await createSupabaseServerClient();
  if (!member || !supabase) return null;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const recovery = isRecoveryCookie((await cookies()).get(RECOVERY_COOKIE)?.value, member.id);
  const facts = sessionFacts(session?.access_token, recovery);
  return { member, supabase, facts, ...passwordRequirements(member, facts) };
}
