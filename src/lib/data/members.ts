import type { User } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Admin, read-only view of every account: auth users (service role) joined
 * with their profile row and a paid-purchase count. Newest first.
 */

export interface MemberRow {
  id: string;
  email: string | null;
  username: string | null;
  role: string;
  /** "Google", "Email", or "Google, Email" when both identities are linked. */
  signInMethod: string;
  emailConfirmed: boolean;
  createdAt: string;
  lastSignInAt: string | null;
  purchases: number;
}

const PROVIDER_LABEL: Record<string, string> = { google: "Google", email: "Email" };

export async function getAllMembers(): Promise<MemberRow[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return [];

  // Auth users, all pages.
  const users: User[] = [];
  for (let page = 1; page < 50; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) {
      console.error("[members] listUsers failed:", error.message);
      break;
    }
    users.push(...data.users);
    if (data.users.length < 1000) break;
  }
  if (users.length === 0) return [];

  const [{ data: profiles }, { data: purchases }] = await Promise.all([
    supabase.from("profiles").select("id, username, role"),
    supabase.from("purchases").select("user_id, customer_email").eq("status", "paid"),
  ]);

  const profileById = new Map((profiles ?? []).map((p) => [p.id as string, p]));
  const byUser = new Map<string, number>();
  const byEmail = new Map<string, number>();
  for (const p of purchases ?? []) {
    if (p.user_id) byUser.set(p.user_id, (byUser.get(p.user_id) ?? 0) + 1);
    else if (p.customer_email) {
      const e = String(p.customer_email).toLowerCase();
      byEmail.set(e, (byEmail.get(e) ?? 0) + 1);
    }
  }

  return users
    .map((u) => {
      const profile = profileById.get(u.id);
      const providers = Array.from(
        new Set<string>([
          ...(u.identities?.map((i) => i.provider) ?? []),
          ...((u.app_metadata?.providers as string[] | undefined) ?? []),
        ]),
      ).filter((p) => p in PROVIDER_LABEL);
      // Google first, since it is the primary option on the site.
      providers.sort((a, b) => (a === "google" ? -1 : b === "google" ? 1 : 0));
      const email = u.email ?? null;
      return {
        id: u.id,
        email,
        username: (profile?.username as string | null) ?? null,
        role: (profile?.role as string | undefined) ?? "customer",
        signInMethod: providers.map((p) => PROVIDER_LABEL[p]).join(", ") || "—",
        emailConfirmed: Boolean(u.email_confirmed_at),
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at ?? null,
        // Purchases filed under the account, plus unclaimed ones under its email.
        purchases: (byUser.get(u.id) ?? 0) + (email ? (byEmail.get(email.toLowerCase()) ?? 0) : 0),
      };
    })
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/** Case-insensitive match on username or email. */
export function filterMembers(members: MemberRow[], query: string): MemberRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return members;
  return members.filter(
    (m) => (m.username ?? "").toLowerCase().includes(q) || (m.email ?? "").toLowerCase().includes(q),
  );
}
