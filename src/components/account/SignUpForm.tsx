"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { AlertCircle, Loader2, MailCheck } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { USERNAME_MESSAGES, usernameProblem } from "@/lib/username";
import { PasswordField } from "./PasswordField";
import { UsernameField, type UsernameStatus } from "./UsernameField";
import cta from "@/components/golden-grand/lets-play.module.css";
import styles from "./account.module.css";

const MIN_PASSWORD = 8;

/**
 * Email sign-up: username, email, one password. Supabase emails a
 * confirmation link (supabase/email-templates/confirm-signup.html) that lands
 * on /auth/callback and signs the new member straight in.
 */
export function SignUpForm() {
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resent, setResent] = useState(false);

  const onStatus = useCallback((s: UsernameStatus) => setUsernameStatus(s), []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const handle = username.trim();
    const problem = usernameProblem(handle);
    if (problem) return setError(USERNAME_MESSAGES[problem]);
    if (usernameStatus === "bad") return setError(USERNAME_MESSAGES.taken);
    if (usernameStatus === "checking") return setError("One moment, still checking that username.");
    if (password.length < MIN_PASSWORD)
      return setError(`Please use at least ${MIN_PASSWORD} characters for your password.`);

    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Member accounts are not configured in this environment.");
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { username: handle },
      },
    });
    setLoading(false);
    if (error) {
      setError(
        /already registered/i.test(error.message)
          ? "There is already an account with that email. Sign in instead."
          : error.message,
      );
      return;
    }
    // With email confirmation on, Supabase answers an existing email with a
    // user that has no identities rather than an error.
    if (data.user && data.user.identities?.length === 0) {
      setError("There is already an account with that email. Sign in instead.");
      return;
    }
    setSent(true);
  }

  async function resend() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setResent(true);
  }

  if (sent) {
    return (
      <div className={styles.done} role="status">
        <MailCheck aria-hidden />
        <p className={styles.lead} style={{ margin: 0 }}>
          We sent a confirmation link to <strong>{email}</strong>. Click it and
          you will be signed in as <strong>@{username.trim()}</strong>.
        </p>
        {error ? (
          <p className={styles.error} role="alert" style={{ margin: 0 }}>
            <AlertCircle aria-hidden /> <span>{error}</span>
          </p>
        ) : null}
        <p className={styles.fine}>
          Nothing there? Check your spam folder, or{" "}
          {resent ? (
            "we have sent it again."
          ) : (
            <button type="button" className={styles.textLink} onClick={resend} disabled={loading}>
              send it again
            </button>
          )}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      {error ? (
        <p className={styles.error} role="alert">
          <AlertCircle aria-hidden /> <span>{error}</span>
        </p>
      ) : null}

      <UsernameField id="signup-username" value={username} onChange={setUsername} onStatus={onStatus} />

      <div className={styles.field}>
        <label htmlFor="signup-email" className={styles.label}>
          <span>Email</span>
        </label>
        <div className={styles.control}>
          <input
            id="signup-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className={styles.input}
          />
        </div>
      </div>

      <PasswordField
        id="signup-password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        minLength={MIN_PASSWORD}
        placeholder="Choose a password"
        hint={`At least ${MIN_PASSWORD} characters. Use the eye to check it; there is no second box.`}
      />

      <button type="submit" className={`${cta.cta} ${styles.primary}`} disabled={loading}>
        {loading ? <Loader2 className={styles.spin} aria-hidden style={{ width: 16, height: 16 }} /> : null}
        {loading ? "Creating your account…" : "Create account"}
      </button>

      <p className={styles.fine} style={{ marginTop: 16 }}>
        By creating an account you agree to receive the emails needed to run it
        (confirmation, new sign-in alerts, password changes, purchase receipts). Nothing else.
        {" "}
        <Link href="/library" className={styles.textLink} style={{ textTransform: "none", letterSpacing: 0 }}>
          Prefer no account? Use the email library.
        </Link>
      </p>
    </form>
  );
}
