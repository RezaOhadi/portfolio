/**
 * Centralised environment access + "is this integration configured?" flags.
 * The whole app degrades gracefully: when a flag is false, the corresponding
 * feature falls back to placeholder data or a friendly disabled state.
 */

export const env = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",

  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  // Accept either the legacy anon key or the newer publishable key (anon first).
  // Both are referenced statically so Next.js inlines them into client bundles.
  supabaseAnonKey:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  publicBucket: process.env.SUPABASE_PUBLIC_BUCKET ?? "public-assets",
  scoresBucket: process.env.SUPABASE_SCORES_BUCKET ?? "scores",

  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,

  resendApiKey: process.env.RESEND_API_KEY,
  emailFrom: process.env.EMAIL_FROM ?? "Reza Ohadi <onboarding@resend.dev>",
  contactTo: process.env.CONTACT_TO_EMAIL ?? "rezaohadi.music@gmail.com",

  adminEmails: (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),

  downloadTtlSeconds: Number(process.env.DOWNLOAD_LINK_TTL_SECONDS ?? 300),
} as const;

export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey);
export const isSupabaseAdminConfigured = Boolean(
  env.supabaseUrl && env.supabaseServiceKey,
);
export const isStripeConfigured = Boolean(env.stripeSecretKey && env.stripePublishableKey);
export const isResendConfigured = Boolean(env.resendApiKey);

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  // If no allowlist configured, fall back to "any authenticated user is admin"
  // ONLY in dev convenience is risky — so require the allowlist in production.
  if (env.adminEmails.length === 0) return false;
  return env.adminEmails.includes(email.toLowerCase());
}
