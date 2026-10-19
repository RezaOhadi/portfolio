import { createHash, createHmac, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { MemberUser } from "@/lib/member";
import { describeRequest, type RequestInfo } from "./request-info";
import {
  sendNewSignInEmail,
  sendPasswordChangedEmail,
  sendPasswordCodeEmail,
  sendWelcomeEmail,
} from "@/lib/email/member";

/**
 * Account security, server side only: which browsers a member has signed in
 * from, the welcome email, the password-changed email, and the one-time code
 * a member without a password uses to set one. Every write goes through the
 * service role (tables in supabase/security.sql). Nothing here can block a
 * sign-in: failures are logged and the member carries on.
 */

export const DEVICE_COOKIE = "ro_device";
const DEVICE_COOKIE_DAYS = 400;

export interface CookieToSet {
  name: string;
  value: string;
  options: {
    httpOnly: true;
    sameSite: "lax";
    secure: boolean;
    path: "/";
    maxAge: number;
  };
}

function readCookie(headers: Headers, name: string): string | null {
  const raw = headers.get("cookie");
  if (!raw) return null;
  for (const part of raw.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

function deviceCookie(value: string): CookieToSet {
  return {
    name: DEVICE_COOKIE,
    value,
    options: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: DEVICE_COOKIE_DAYS * 24 * 60 * 60,
    },
  };
}

/**
 * Runs after every successful sign-in (password form, Google, email links):
 * sends the welcome email once per account, and the new sign-in alert when
 * the browser is one this account has not used before. Returns the device
 * cookie the caller must set when the browser had none.
 */
export async function afterSignIn(member: MemberUser, headers: Headers): Promise<{ cookie: CookieToSet | null }> {
  const info = describeRequest(headers);
  const existing = readCookie(headers, DEVICE_COOKIE);
  const valid = existing && /^[a-z0-9-]{20,64}$/i.test(existing) ? existing : null;
  const deviceId = valid ?? randomUUID();

  try {
    await welcomeOnce(member);
  } catch (e) {
    console.error("[security] welcome:", e instanceof Error ? e.message : e);
  }
  try {
    await recordDevice(member, deviceId, info);
  } catch (e) {
    console.error("[security] device:", e instanceof Error ? e.message : e);
  }
  // Refresh the cookie's lifetime on every sign-in.
  return { cookie: deviceCookie(deviceId) };
}

async function welcomeOnce(member: MemberUser) {
  if (!member.email || !member.emailVerified) return;
  const admin = createSupabaseAdminClient();
  if (!admin) return;
  // The update is the lock: only the request that flips welcomed_at sends.
  const { data, error } = await admin
    .from("profiles")
    .update({ welcomed_at: new Date().toISOString() })
    .eq("id", member.id)
    .is("welcomed_at", null)
    .select("id, username, display_name");
  if (error) {
    // Before supabase/security.sql has been run there is no column: no welcome yet.
    console.warn("[security] welcome skipped:", error.message);
    return;
  }
  const row = data?.[0] as { username?: string | null; display_name?: string | null } | undefined;
  if (!row) return;
  const name = row.username ? `@${row.username}` : firstName(row.display_name);
  const result = await sendWelcomeEmail(member.email, name);
  if (!result.ok && !result.skipped) console.error("[security] welcome email:", result.error);
}

function firstName(full: string | null | undefined): string | null {
  const first = full?.trim().split(/\s+/)[0];
  return first && first.length <= 30 ? first : null;
}

async function recordDevice(member: MemberUser, deviceId: string, info: RequestInfo) {
  const admin = createSupabaseAdminClient();
  if (!admin) return;
  const now = new Date().toISOString();
  const { data: known, error } = await admin
    .from("member_devices")
    .select("id, device_id")
    .eq("user_id", member.id);
  if (error) {
    console.warn("[security] devices skipped:", error.message);
    return;
  }
  const mine = known?.find((d) => d.device_id === deviceId);
  if (mine) {
    await admin.from("member_devices").update({ last_seen_at: now, browser: info.browser, location: info.location, ip: info.ip }).eq("id", mine.id);
    return;
  }
  const { error: insertError } = await admin.from("member_devices").insert({
    user_id: member.id,
    device_id: deviceId,
    browser: info.browser,
    location: info.location,
    ip: info.ip,
    user_agent: info.userAgent.slice(0, 400),
    first_seen_at: now,
    last_seen_at: now,
  });
  if (insertError) {
    // A second request from the same new browser raced us: not a new device.
    if (insertError.code !== "23505") console.error("[security] device insert:", insertError.message);
    return;
  }
  // The first browser an account ever uses is the one that created it: no alert.
  if (!known || known.length === 0) return;
  if (!member.email || !member.emailVerified) return;
  const result = await sendNewSignInEmail(member.email, info);
  if (!result.ok && !result.skipped) console.error("[security] sign-in email:", result.error);
}

/** 3. Password changed or set. */
export async function notifyPasswordChanged(member: MemberUser, headers: Headers, firstPassword: boolean) {
  if (!member.email) return;
  const result = await sendPasswordChangedEmail(member.email, describeRequest(headers), firstPassword);
  if (!result.ok && !result.skipped) console.error("[security] password email:", result.error);
}

/* ----------------------------- one-time codes ----------------------------- */

export const CODE_MINUTES = 15;
const CODE_ATTEMPTS = 5;

function hashCode(userId: string, code: string) {
  return createHash("sha256").update(`${userId}:${code}`).digest("hex");
}

export type IssueResult = { ok: true } | { ok: false; reason: "not_configured" | "no_email" | "failed" | "email_failed" };

/** Emails a fresh six-digit code to the member; any earlier code stops working. */
export async function issuePasswordCode(member: MemberUser): Promise<IssueResult> {
  if (!member.email) return { ok: false, reason: "no_email" };
  const admin = createSupabaseAdminClient();
  if (!admin) return { ok: false, reason: "not_configured" };
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const { error } = await admin.from("password_codes").upsert(
    {
      user_id: member.id,
      code_hash: hashCode(member.id, code),
      expires_at: new Date(Date.now() + CODE_MINUTES * 60_000).toISOString(),
      attempts: 0,
      created_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) {
    console.error("[security] code store:", error.message);
    return { ok: false, reason: "failed" };
  }
  const sent = await sendPasswordCodeEmail(member.email, code, CODE_MINUTES);
  if (!sent.ok) {
    if (!sent.skipped) console.error("[security] code email:", sent.error);
    // Without a working mailer the code can never arrive: do not leave it live.
    await admin.from("password_codes").delete().eq("user_id", member.id);
    return { ok: false, reason: "email_failed" };
  }
  return { ok: true };
}

export type CodeCheck = "ok" | "missing" | "wrong" | "expired" | "locked";

/** Checks a code without consuming it (consume after the password is saved). */
export async function checkPasswordCode(userId: string, code: string): Promise<CodeCheck> {
  const admin = createSupabaseAdminClient();
  if (!admin) return "missing";
  const { data } = await admin
    .from("password_codes")
    .select("code_hash, expires_at, attempts")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return "missing";
  if (new Date(data.expires_at).getTime() < Date.now()) return "expired";
  if (data.attempts >= CODE_ATTEMPTS) return "locked";
  if (data.code_hash !== hashCode(userId, code.trim())) {
    await admin.from("password_codes").update({ attempts: data.attempts + 1 }).eq("user_id", userId);
    return data.attempts + 1 >= CODE_ATTEMPTS ? "locked" : "wrong";
  }
  return "ok";
}

export async function consumePasswordCode(userId: string) {
  const admin = createSupabaseAdminClient();
  await admin?.from("password_codes").delete().eq("user_id", userId);
}

/* ------------------------------ session facts ----------------------------- */

export interface SessionFacts {
  /** Arrived through a password-reset link: there is no current password to ask for. */
  recovery: boolean;
  /** Older than Supabase's 24-hour window for "recently signed in". */
  stale: boolean;
}

const STALE_AFTER_MS = 23 * 60 * 60 * 1000;

/**
 * Reads the session's own claims. Only used to choose the form; the rules are
 * enforced in the password action. (A reset-link session carries the same
 * "otp" claim as a confirmation-link one, so recovery is tracked by the cookie
 * below instead.)
 */
export function sessionFacts(accessToken: string | null | undefined, recovery = false): SessionFacts {
  if (!accessToken) return { recovery, stale: false };
  try {
    const payload = JSON.parse(Buffer.from(accessToken.split(".")[1], "base64url").toString("utf8")) as {
      amr?: { method: string; timestamp: number }[];
    };
    const amr = payload.amr ?? [];
    const first = Math.min(...amr.map((m) => m.timestamp * 1000));
    const stale = Number.isFinite(first) && Date.now() - first > STALE_AFTER_MS;
    return { recovery, stale };
  } catch {
    return { recovery, stale: false };
  }
}

/* ----------------------------- recovery cookie ---------------------------- */

export const RECOVERY_COOKIE = "ro_recovery";
const RECOVERY_MINUTES = 20;

function recoverySecret() {
  return env.supabaseServiceKey ?? env.supabaseAnonKey ?? "development";
}

function sign(payload: string) {
  return createHmac("sha256", recoverySecret()).update(payload).digest("base64url");
}

/**
 * Set by /auth/callback after a password-reset link is verified: for the next
 * few minutes this member may choose a new password without the current one.
 * Signed with a server secret, so it cannot be made up in the browser.
 */
export function recoveryCookie(userId: string): CookieToSet {
  const payload = `${userId}.${Date.now() + RECOVERY_MINUTES * 60_000}`;
  return {
    name: RECOVERY_COOKIE,
    value: `${payload}.${sign(payload)}`,
    options: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: RECOVERY_MINUTES * 60,
    },
  };
}

export function isRecoveryCookie(value: string | undefined, userId: string): boolean {
  if (!value) return false;
  const parts = value.split(".");
  if (parts.length !== 3) return false;
  const [uid, exp, mac] = parts;
  if (uid !== userId || Number(exp) < Date.now()) return false;
  const expected = sign(`${uid}.${exp}`);
  return mac.length === expected.length && timingSafeEqual(Buffer.from(mac), Buffer.from(expected));
}
