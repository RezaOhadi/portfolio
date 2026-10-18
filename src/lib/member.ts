import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOwnProfile } from "@/lib/data/profiles";
import { claimPurchasesByEmail } from "@/lib/data/purchases";
import type { MemberProfile } from "@/lib/types";

/**
 * Member (customer) session helpers. Deliberately separate from lib/auth.ts:
 * nothing here grants or checks admin rights, and the admin guard does not
 * know members exist.
 */

export interface MemberUser {
  id: string;
  email: string | null;
  /** Confirmed by the confirmation link, or verified by Google. */
  emailVerified: boolean;
  /** True when the account can sign in with a password (not Google-only). */
  hasPassword: boolean;
  profile: MemberProfile | null;
}

export async function getMemberUser(): Promise<MemberUser | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await getOwnProfile(user.id);
  // identities is the precise source; app_metadata.providers covers the rare
  // response that omits it. A Google-only member has neither "email" entry.
  const providers = [
    ...(user.identities?.map((i) => i.provider) ?? []),
    ...((user.app_metadata?.providers as string[] | undefined) ?? []),
  ];
  return {
    id: user.id,
    email: user.email ?? null,
    emailVerified: Boolean(user.email_confirmed_at),
    hasPassword: providers.includes("email"),
    profile,
  };
}

/** Where to send someone who must sign in before seeing `next`. */
export function signInPath(next: string): string {
  return `/sign-in?next=${encodeURIComponent(next)}`;
}

/** Guard for member pages. Redirects to the sign-in page when signed out. */
export async function requireMember(next: string): Promise<MemberUser> {
  const member = await getMemberUser();
  if (!member) redirect(signInPath(next));
  return member;
}

/**
 * Attaches guest purchases made with this member's email to their account.
 * Only a verified email may claim purchases.
 */
export async function claimPurchases(member: MemberUser): Promise<void> {
  if (!member.email || !member.emailVerified) return;
  await claimPurchasesByEmail(member.id, member.email);
}

/** Only ever redirect within the site. */
export function safeNext(value: string | null | undefined, fallback = "/account"): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}
