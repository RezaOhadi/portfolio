import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env, isSupabaseConfigured } from "@/lib/env";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Cookie-bound server client for authenticated contexts (admin dashboard,
 * server actions that need the logged-in user). Returns null when Supabase
 * is not configured.
 */
export async function createSupabaseServerClient() {
  if (!isSupabaseConfigured) return null;
  const cookieStore = await cookies();

  return createServerClient(env.supabaseUrl!, env.supabaseAnonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2]),
          );
        } catch {
          // Called from a Server Component — safe to ignore; middleware refreshes.
        }
      },
    },
  });
}
