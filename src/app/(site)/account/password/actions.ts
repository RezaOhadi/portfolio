"use server";

import { cookies, headers } from "next/headers";
import { createClient, type UserAttributes } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import {
  checkPasswordCode,
  consumePasswordCode,
  issuePasswordCode,
  notifyPasswordChanged,
  RECOVERY_COOKIE,
} from "@/lib/account/security";
import { passwordContext as context } from "./context";

const MIN_PASSWORD = 8;

export interface PasswordState {
  status: "idle" | "success" | "error" | "code_required";
  message?: string;
  /** Which box the message belongs to. */
  field?: "current" | "code" | "password";
}

export interface CodeState {
  status: "idle" | "sent" | "error";
  message?: string;
}

/**
 * Checks the current password ourselves, by signing in with it on a throwaway
 * client, so the rule holds whatever the Supabase project settings say. The
 * extra session it creates is closed straight away.
 */
async function currentPasswordIsRight(email: string, password: string): Promise<"yes" | "no" | "rate_limited" | "unknown"> {
  if (!env.supabaseUrl || !env.supabaseAnonKey) return "unknown";
  const probe = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await probe.auth.signInWithPassword({ email, password });
  if (error) {
    if (/rate limit|too many/i.test(error.message)) return "rate_limited";
    return "no";
  }
  if (data.session) await probe.auth.signOut({ scope: "local" }).catch(() => {});
  return "yes";
}

/** Emails the member a code: ours for a first password, Supabase's for an old session. */
export async function sendPasswordCode(_prev: CodeState, _formData: FormData): Promise<CodeState> {
  const ctx = await context();
  if (!ctx) return { status: "error", message: "Please sign in again." };
  const to = ctx.member.email ?? "your email";

  if (ctx.codeSource === "own") {
    const result = await issuePasswordCode(ctx.member);
    if (!result.ok) {
      return {
        status: "error",
        message:
          result.reason === "email_failed"
            ? "We could not send the email just now. Please try again in a moment."
            : "Codes cannot be sent in this environment yet. Please try again later.",
      };
    }
    return { status: "sent", message: `We emailed a code to ${to}.` };
  }

  // Supabase asked for reauthentication (session older than a day): its own code.
  const { error } = await ctx.supabase.auth.reauthenticate();
  if (error) {
    return {
      status: "error",
      message: /rate limit/i.test(error.message)
        ? "Too many codes requested for now. Please try again in a few minutes."
        : "We could not send the email just now. Please try again in a moment.",
    };
  }
  return { status: "sent", message: `We emailed a code to ${to}.` };
}

/** Changes or sets the password, then emails the member about it. */
export async function changePassword(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const ctx = await context();
  if (!ctx) return { status: "error", message: "Please sign in again." };
  const { member, supabase, needsCurrent, codeSource, first } = ctx;

  const current = String(formData.get("current") ?? "");
  const code = String(formData.get("code") ?? "").replace(/\s+/g, "");
  const password = String(formData.get("password") ?? "");

  if (needsCurrent && !current) return { status: "error", field: "current", message: "Enter your current password first." };
  if (password.length < MIN_PASSWORD)
    return { status: "error", field: "password", message: `Please use at least ${MIN_PASSWORD} characters for the new password.` };
  if (needsCurrent && current === password)
    return { status: "error", field: "password", message: "Your new password must be different from the current one." };
  if (needsCurrent && member.email) {
    const verdict = await currentPasswordIsRight(member.email, current);
    if (verdict === "no")
      return { status: "error", field: "current", message: "That is not your current password. Try again, or reset it by email." };
    if (verdict === "rate_limited")
      return { status: "error", message: "Too many attempts for now. Please try again in a few minutes." };
  }

  if (codeSource && !code) return { status: "code_required", field: "code", message: "Enter the code we emailed you." };
  if (codeSource === "own") {
    const check = await checkPasswordCode(member.id, code);
    if (check !== "ok") {
      return {
        status: "code_required",
        field: "code",
        message:
          check === "wrong"
            ? "That code is not right. Check the email and try again."
            : check === "locked"
              ? "Too many wrong codes. Send yourself a new one."
              : check === "expired"
                ? "That code has expired. Send yourself a new one."
                : "Send yourself a code first, then enter it here.",
      };
    }
  }

  const attrs: UserAttributes = { password };
  if (needsCurrent) attrs.current_password = current;
  if (codeSource === "supabase") attrs.nonce = code;

  const { error } = await supabase.auth.updateUser(attrs);
  if (error) {
    const errorCode = (error as { code?: string }).code ?? "";
    if (errorCode === "current_password_invalid" || errorCode === "current_password_required" || /current password/i.test(error.message))
      return { status: "error", field: "current", message: "That is not your current password. Try again, or reset it by email." };
    if (errorCode === "reauthentication_needed")
      return { status: "code_required", field: "code", message: "You signed in a while ago, so we need to confirm it is you: send yourself a code and enter it here." };
    if (errorCode === "reauthentication_not_valid")
      return { status: "code_required", field: "code", message: "That code is wrong or has expired. Send yourself a new one." };
    if (errorCode === "same_password")
      return { status: "error", field: "password", message: "Your new password must be different from the current one." };
    if (errorCode === "weak_password")
      return { status: "error", field: "password", message: error.message };
    if (/rate limit/i.test(error.message))
      return { status: "error", message: "Too many attempts for now. Please try again in a few minutes." };
    return { status: "error", message: error.message };
  }

  if (codeSource === "own") await consumePasswordCode(member.id);
  if (ctx.facts.recovery) (await cookies()).delete(RECOVERY_COOKIE);
  await notifyPasswordChanged(member, await headers(), first);
  return { status: "success" };
}
