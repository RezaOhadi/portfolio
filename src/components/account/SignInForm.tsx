"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, MailCheck } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { PasswordField } from "./PasswordField";
import cta from "@/components/golden-grand/lets-play.module.css";
import styles from "./account.module.css";

const LINK_ERRORS: Record<string, string> = {
  link: "That link is invalid or has expired. Sign in below, or request a new one.",
  reset_link: "That password reset link is invalid or has expired. Request a new one.",
  not_configured: "Member accounts are not configured in this environment.",
};

export function SignInForm({ next, initialError }: { next: string; initialError?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    initialError ? (LINK_ERRORS[initialError] ?? null) : null,
  );
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [resent, setResent] = useState(false);
  const [loading, setLoading] = useState(false);

  // Already signed in: straight through.
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace(next);
    });
  }, [next, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setUnconfirmed(false);
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError(LINK_ERRORS.not_configured);
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (/not confirmed/i.test(error.message)) setUnconfirmed(true);
      else if (/invalid login credentials/i.test(error.message))
        setError("That email and password don't match.");
      else setError(error.message);
      setLoading(false);
      return;
    }
    // Records this browser and sends the new sign-in alert when it is unknown.
    await fetch("/api/account/session", { method: "POST", credentials: "same-origin" }).catch(() => {});
    router.push(next);
    router.refresh();
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

  return (
    <form onSubmit={onSubmit} noValidate={false}>
      {error ? (
        <p className={styles.error} role="alert">
          <AlertCircle aria-hidden /> <span>{error}</span>
        </p>
      ) : null}
      {unconfirmed ? (
        <div className={styles.notice} role="alert">
          <MailCheck aria-hidden />
          <span>
            {resent
              ? "A fresh confirmation link is on its way. Check your inbox and spam folder."
              : "Please confirm your email first. Check your inbox for the link we sent, or "}
            {!resent ? (
              <button type="button" className={styles.textLink} onClick={resend} disabled={loading}>
                send it again
              </button>
            ) : null}
            {!resent ? "." : null}
          </span>
        </div>
      ) : null}

      <div className={styles.field}>
        <label htmlFor="signin-email" className={styles.label}>
          <span>Email</span>
        </label>
        <div className={styles.control}>
          <input
            id="signin-email"
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
        id="signin-password"
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
        labelRight={
          <Link href="/forgot-password" className={styles.textLink}>
            Forgot password?
          </Link>
        }
      />

      <button type="submit" className={`${cta.cta} ${styles.primary}`} disabled={loading}>
        {loading ? <Loader2 className={styles.spin} aria-hidden style={{ width: 16, height: 16 }} /> : null}
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
