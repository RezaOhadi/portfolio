import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env, isSupabaseConfigured } from "@/lib/env";

/**
 * A cookie-less anon client for *public* reads (catalogue, gallery, content).
 * Safe to use at build time (sitemap, generateStaticParams) and in RSCs.
 * Respects Row Level Security — only published/public rows are readable.
 */
let cached: SupabaseClient | null = null;

export function createSupabasePublicClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (cached) return cached;
  cached = createClient(env.supabaseUrl!, env.supabaseAnonKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
