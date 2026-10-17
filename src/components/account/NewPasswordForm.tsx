"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { PasswordField } from "./PasswordField";
import cta from "@/components/golden-grand/lets-play.module.css";
import styles from "./account.module.css";

const MIN_PASSWORD = 8;

/** Sets a new password for the signed-in member (after a reset link, or by choice). */
export function NewPasswordForm({ next = "/account" }: { next?: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < MIN_PASSWORD)
      return setError(`Please use at least ${MIN_PASSWORD} characters.`);
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Member accounts are not configured in this environment.");
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit}>
      {error ? (
        <p className={styles.error} role="alert">
          <AlertCircle aria-hidden /> <span>{error}</span>
        </p>
      ) : null}
      <PasswordField
        id="new-password"
        label="New password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        minLength={MIN_PASSWORD}
        placeholder="Choose a password"
        hint={`At least ${MIN_PASSWORD} characters. Use the eye to check it before saving.`}
      />
      <button type="submit" className={`${cta.cta} ${styles.primary}`} disabled={loading}>
        {loading ? <Loader2 className={styles.spin} aria-hidden style={{ width: 16, height: 16 }} /> : null}
        {loading ? "Saving…" : "Save password"}
      </button>
    </form>
  );
}
