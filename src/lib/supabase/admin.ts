import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env, isSupabaseAdminConfigured } from "@/lib/env";

/**
 * Service-role client — SERVER ONLY. Bypasses RLS. Use exclusively in route
 * handlers / server actions for: webhooks, purchase writes, signed download
 * URLs, and admin mutations. NEVER import this into a client component.
 */
export function createSupabaseAdminClient(): SupabaseClient | null {
  if (!isSupabaseAdminConfigured) return null;
  return createClient(env.supabaseUrl!, env.supabaseServiceKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
