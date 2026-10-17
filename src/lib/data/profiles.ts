import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MemberProfile } from "@/lib/types";

/**
 * Member profiles. Reads go through the member's own session (RLS lets a user
 * read their own row). Writes go through the service role on the server only,
 * after validation, so the role column is never reachable from the browser.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProfileRow(r: any): MemberProfile {
  return {
    id: r.id,
    email: r.email ?? null,
    username: r.username ?? null,
    displayName: r.display_name ?? null,
    role: r.role ?? "customer",
  };
}

const COLUMNS = "id, email, username, display_name, role";

/** The signed-in user's own profile, read with their session. */
export async function getOwnProfile(userId: string): Promise<MemberProfile | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase.from("profiles").select(COLUMNS).eq("id", userId).maybeSingle();
  return data ? mapProfileRow(data) : null;
}

/** Case-insensitive availability check. `null` when it cannot be checked. */
export async function isUsernameAvailable(username: string): Promise<boolean | null> {
  const admin = createSupabaseAdminClient();
  if (!admin) return null;
  // ILIKE treats % and _ as wildcards; a username may contain underscores.
  const pattern = username.replace(/[\\%_]/g, (c) => `\\${c}`);
  const { data, error } = await admin
    .from("profiles")
    .select("id")
    .ilike("username", pattern)
    .limit(1);
  if (error) return null;
  return (data ?? []).length === 0;
}

export type SetUsernameResult =
  | { ok: true }
  | { ok: false; reason: "taken" | "not_configured" | "failed" };

/** Writes a validated username for a member. Callers validate the format first. */
export async function setUsername(userId: string, username: string): Promise<SetUsernameResult> {
  const admin = createSupabaseAdminClient();
  if (!admin) return { ok: false, reason: "not_configured" };
  const { error } = await admin.from("profiles").update({ username }).eq("id", userId);
  if (error) {
    // 23505 = unique violation: someone took it between the check and the write.
    if (error.code === "23505") return { ok: false, reason: "taken" };
    console.error("[profiles] username update failed:", error.message);
    return { ok: false, reason: "failed" };
  }
  return { ok: true };
}
