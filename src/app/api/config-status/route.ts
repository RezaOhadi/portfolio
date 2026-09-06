import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";

/**
 * TEMPORARY diagnostics endpoint.
 * Returns ONLY booleans about whether configuration is present — never any
 * secret names beyond these flags, and never any values. Safe to remove once
 * the Vercel production configuration is confirmed working.
 *
 * NEXT_PUBLIC_* flags reflect what was present at BUILD time (Next inlines them);
 * if they read false here, the live build predates the env vars → redeploy.
 * SUPABASE_SERVICE_ROLE_KEY is read at runtime and stays server-only.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const body = {
    hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    hasPublishableKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    isSupabaseConfigured,
  };

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
}
