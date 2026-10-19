"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, MailCheck } from "lucide-react";
import {
  changePassword,
  sendPasswordCode,
  type CodeState,
  type PasswordState,
} from "@/app/(site)/account/password/actions";
import { PasswordField } from "./PasswordField";
import cta from "@/components/golden-grand/lets-play.module.css";
import styles from "./account.module.css";

const MIN_PASSWORD = 8;
const idle: PasswordState = { status: "idle" };
const noCode: CodeState = { status: "idle" };

/**
 * Change or set the member's password. The server decides what is needed
 * (actions.ts): the current password, an emailed code, or both.
 */
export function ChangePasswordForm({
  needsCurrent,
  needsCode,
  first,
  email,
  next = "/account",
}: {
  needsCurrent: boolean;
  needsCode: boolean;
  first: boolean;
  email: string;
  next?: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(changePassword, idle);
  const [codeState, sendAction, sending] = useActionState(sendPasswordCode, noCode);
  const [current, setCurrent] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  // Supabase can ask for a code after the fact (a session older than a day).
  const codeNeeded = needsCode || state.status === "code_required";
  const codeSent = codeState.status === "sent";

  useEffect(() => {
    if (state.status !== "success") return;
    router.push(next);
    router.refresh();
  }, [state, next, router]);

  const error = state.status === "error" || state.status === "code_required" ? state.message : null;

  return (
    <form action={formAction}>
      {error ? (
        <p className={styles.error} role="alert">
          <AlertCircle aria-hidden /> <span>{error}</span>
        </p>
      ) : null}

      {needsCurrent ? (
        <PasswordField
          id="current-password"
          name="current"
          label="Current password"
          value={current}
          onChange={setCurrent}
          autoComplete="current-password"
          placeholder="Your current password"
          invalid={state.field === "current"}
          labelRight={
            <Link href="/forgot-password" className={styles.textLink}>
              Forgot it?
            </Link>
          }
        />
      ) : null}

      {codeNeeded ? (
        <div className={styles.field}>
          <div className={styles.notice} role="status">
            <MailCheck aria-hidden />
            <span>
              {codeSent
                ? `${codeState.message} Enter it below. Nothing there? Check your spam folder, or `
                : `To confirm it is you, we will email an eight-digit code to ${email}. `}
              {/* Same form, different action: the fields are posted to the code sender instead. */}
              <button type="submit" formAction={sendAction} formNoValidate className={styles.textLink} disabled={sending}>
                {sending ? "sending…" : codeSent ? "send it again" : "email me a code"}
              </button>
              .
            </span>
          </div>
          {codeState.status === "error" ? (
            <p className={styles.error} role="alert" style={{ marginTop: 10 }}>
              <AlertCircle aria-hidden /> <span>{codeState.message}</span>
            </p>
          ) : null}
          <label htmlFor="security-code" className={styles.label} style={{ marginTop: 14 }}>
            <span>Security code</span>
          </label>
          <div className={styles.control}>
            <input
              id="security-code"
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={8}
              spellCheck={false}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="12345678"
              aria-invalid={state.field === "code" || undefined}
              className={styles.input}
            />
          </div>
        </div>
      ) : null}

      <PasswordField
        id="new-password"
        label="New password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        minLength={MIN_PASSWORD}
        placeholder="Choose a password"
        invalid={state.field === "password"}
        hint={`At least ${MIN_PASSWORD} characters. Use the eye to check it before saving.`}
      />

      <button type="submit" className={`${cta.cta} ${styles.primary}`} disabled={pending}>
        {pending ? <Loader2 className={styles.spin} aria-hidden style={{ width: 16, height: 16 }} /> : null}
        {pending ? "Saving…" : first ? "Set password" : "Save new password"}
      </button>

      <p className={styles.fine} style={{ marginTop: 16 }}>
        We email you whenever your password changes, so you always know.
      </p>
    </form>
  );
}
