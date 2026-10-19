import { Resend } from "resend";
import { env, isResendConfigured } from "@/lib/env";

function getResend(): Resend | null {
  if (!isResendConfigured) return null;
  return new Resend(env.resendApiKey);
}

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  /** Sender; defaults to EMAIL_FROM (the store address). */
  from?: string;
}

export type SendResult =
  | { ok: true; skipped?: false }
  | { ok: false; skipped: true }
  | { ok: false; skipped?: false; error: string };

/**
 * Sends an email via Resend. When Resend isn't configured the call is a no-op
 * (logged) and returns `{ ok:false, skipped:true }` so callers can degrade
 * gracefully rather than crash.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo,
  from,
}: SendArgs): Promise<SendResult> {
  const resend = getResend();
  if (!resend) {
    console.warn(`[email] Resend not configured — skipped "${subject}" → ${to}`);
    await previewToDisk(subject, html);
    return { ok: false, skipped: true };
  }
  try {
    const { error } = await resend.emails.send({
      from: from ?? env.emailFrom,
      to,
      subject,
      html,
      text,
      replyTo,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown email error" };
  }
}

/**
 * Development only: with EMAIL_PREVIEW_DIR set and no Resend key, every email
 * that would have been sent is written there as HTML, so templates can be
 * opened in a browser.
 */
async function previewToDisk(subject: string, html: string) {
  const dir = process.env.EMAIL_PREVIEW_DIR;
  if (!dir || process.env.NODE_ENV === "production") return;
  try {
    const { mkdir, writeFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    await mkdir(dir, { recursive: true });
    const name = `${Date.now()}-${subject.replace(/[^a-z0-9]+/gi, "-").slice(0, 60)}.html`;
    await writeFile(join(dir, name), html, "utf8");
  } catch (e) {
    console.warn("[email] preview not written:", e instanceof Error ? e.message : e);
  }
}

/** Shared, minimal black-and-white email shell. */
export function emailLayout(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;background:#0a0a0c;color:#f2eee6;font-family:Georgia,serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 28px;">
    <div style="font-size:13px;letter-spacing:4px;text-transform:uppercase;color:#9a9aa6;font-family:Arial,sans-serif;">Reza Ohadi</div>
    <h1 style="font-size:28px;font-weight:400;margin:18px 0 8px;color:#f2eee6;">${title}</h1>
    <div style="height:1px;background:rgba(255,255,255,0.12);margin:18px 0 24px;"></div>
    ${bodyHtml}
    <div style="height:1px;background:rgba(255,255,255,0.12);margin:28px 0 16px;"></div>
    <p style="font-size:12px;color:#6f6f78;font-family:Arial,sans-serif;">Reza Ohadi — Pianist &amp; Composer</p>
  </div></body></html>`;
}
