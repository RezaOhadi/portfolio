import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Per-IP fixed-window rate limiting, backed by the public.rate_hit() SQL
 * function (see supabase/anti-spam.sql). One row per (scope, ip, window).
 *
 * Returns true when the request is ALLOWED, false when the caller has exceeded
 * `limit` within `windowSeconds`. Degrades open: if the migration hasn't been
 * run or the service role is unavailable, it logs and allows the request so a
 * missing table never blocks real visitors.
 */
export async function rateHit(
  scope: string,
  ip: string | null | undefined,
  windowSeconds: number,
  limit: number,
): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  if (!admin) return true; // not configured → don't block

  const { data, error } = await admin.rpc("rate_hit", {
    p_scope: scope,
    p_ip: ip || "unknown",
    p_window_seconds: windowSeconds,
    p_limit: limit,
  });

  if (error) {
    console.warn(`[rate-limit] skipped (${scope}):`, error.message);
    return true;
  }
  return data !== false;
}
