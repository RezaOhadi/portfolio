/**
 * Cloudflare Turnstile — server-side verification.
 *
 * The widget on the contact and sign-up forms produces a short-lived token
 * (field name `cf-turnstile-response`). We verify it here with the secret key
 * before trusting a submission. Tokens are single-use: verify each exactly once.
 *
 * Degrades gracefully: with no secret configured (local/dev), verification is
 * skipped so the forms keep working.
 */

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const secret = process.env.TURNSTILE_SECRET_KEY;

export const isTurnstileConfigured = Boolean(secret);

export type TurnstileResult =
  | { ok: true; skipped?: boolean }
  | { ok: false; skipped?: false; error: string };

export async function verifyTurnstile(
  token: string | null | undefined,
  ip?: string | null,
): Promise<TurnstileResult> {
  // Not configured → don't block (dev, previews without the secret).
  if (!secret) return { ok: true, skipped: true };

  if (!token) return { ok: false, error: "missing-token" };

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set("remoteip", ip);

    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      // Never cache a verification.
      cache: "no-store",
    });
    const data = (await res.json()) as {
      success: boolean;
      "error-codes"?: string[];
    };
    if (data.success) return { ok: true };
    return { ok: false, error: (data["error-codes"] ?? ["failed"]).join(",") };
  } catch (e) {
    // A Cloudflare outage shouldn't take the forms down; log and let it pass.
    console.error("[turnstile] verify error:", e instanceof Error ? e.message : e);
    return { ok: true, skipped: true };
  }
}
