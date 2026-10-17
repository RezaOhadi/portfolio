"use client";

import { useState } from "react";
import { AlertCircle, Loader2, MailCheck } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import cta from "@/components/golden-grand/lets-play.module.css";
import styles from "./account.module.css";

/**
 * "Forgot password": Supabase emails a reset link
 * (supabase/email-templates/reset-password.html) that lands on /auth/callback
 * with type=recovery and continues to /account/password.
 */
export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Member accounts are not configured in this environment.");
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    setLoading(false);
    if (error && /rate limit/i.test(error.message)) {
      setError("Too many requests for now. Please try again in a few minutes.");
      return;
    }
    // Any other outcome reads the same, so the form never reveals whether an
    // address has an account.
    setSent(true);
  }

  if (sent) {
    return (
      <div className={styles.done} role="status">
        <MailCheck aria-hidden />
        <p className={styles.lead} style={{ margin: 0 }}>
          If there is an account for <strong>{email}</strong>, a reset link is on
          its way. Open it on any device to choose a new password.
        </p>
        <p className={styles.fine}>Nothing there after a minute? Check your spam folder.</p>
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
      <div className={styles.field}>
        <label htmlFor="forgot-email" className={styles.label}>
          <span>Email</span>
        </label>
        <div className={styles.control}>
          <input
            id="forgot-email"
            name="email"
            type="email"
            required
            autoFocus
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className={styles.input}
          />
        </div>
      </div>
      <button type="submit" className={`${cta.cta} ${styles.primary}`} disabled={loading}>
        {loading ? <Loader2 className={styles.spin} aria-hidden style={{ width: 16, height: 16 }} /> : null}
        {loading ? "Sending…" : "Email me a reset link"}
      </button>
    </form>
  );
}
