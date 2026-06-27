import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/env";

export interface AdminUser {
  id: string;
  email: string;
}

/**
 * Returns the current user IF they are an admin, else null.
 * Admin = email in ADMIN_EMAILS allowlist OR profiles.role = 'admin'.
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  if (isAdminEmail(user.email)) {
    return { id: user.id, email: user.email };
  }

  const admin = createSupabaseAdminClient();
  if (admin) {
    const { data } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (data?.role === "admin") return { id: user.id, email: user.email };
  }

  return null;
}

/** Guard for admin pages/actions. Redirects to login when not an admin. */
export async function requireAdmin(): Promise<AdminUser> {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return user;
}
