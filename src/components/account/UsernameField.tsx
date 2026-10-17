"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { USERNAME_MAX, USERNAME_MESSAGES, usernameProblem } from "@/lib/username";
import styles from "./account.module.css";

export type UsernameStatus = "idle" | "checking" | "ok" | "bad" | "unknown";

/**
 * Username box with a live availability check (debounced, against
 * /api/account/username). `current` is the member's existing handle, which
 * always counts as available to them.
 */
export function UsernameField({
  id,
  value,
  onChange,
  onStatus,
  current = null,
  autoFocus,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onStatus?: (status: UsernameStatus) => void;
  current?: string | null;
  autoFocus?: boolean;
}) {
  const [status, setStatus] = useState<UsernameStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    onStatus?.(status);
  }, [status, onStatus]);

  useEffect(() => {
    abort.current?.abort();
    const candidate = value.trim();
    if (!candidate) {
      setStatus("idle");
      setMessage(null);
      return;
    }
    const problem = usernameProblem(candidate);
    if (problem) {
      setStatus("bad");
      setMessage(USERNAME_MESSAGES[problem]);
      return;
    }
    if (current && candidate.toLowerCase() === current.toLowerCase()) {
      setStatus("ok");
      setMessage("This is your current name.");
      return;
    }
    setStatus("checking");
    setMessage(null);
    const controller = new AbortController();
    abort.current = controller;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/account/username?u=${encodeURIComponent(candidate)}`, {
          signal: controller.signal,
        });
        const data = (await res.json()) as {
          available: boolean | null;
          reason?: keyof typeof USERNAME_MESSAGES;
        };
        if (controller.signal.aborted) return;
        if (data.available === true) {
          setStatus("ok");
          setMessage("Available.");
        } else if (data.available === false) {
          setStatus("bad");
          setMessage(USERNAME_MESSAGES[data.reason ?? "taken"]);
        } else {
          setStatus("unknown");
          setMessage(null);
        }
      } catch {
        if (!controller.signal.aborted) setStatus("unknown");
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value, current]);

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        <span>Username</span>
        <span aria-hidden>
          {value.trim().length}/{USERNAME_MAX}
        </span>
      </label>
      <div className={styles.control}>
        <span className={styles.prefix} aria-hidden>
          @
        </span>
        <input
          id={id}
          name="username"
          type="text"
          required
          autoFocus={autoFocus}
          autoComplete="username"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          maxLength={USERNAME_MAX}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\s+/g, ""))}
          placeholder="yourname"
          aria-invalid={status === "bad" || undefined}
          aria-describedby={`${id}-hint`}
          className={`${styles.input} ${styles.withPrefix} ${styles.withTrailing}`}
        />
        <span className={styles.status} aria-hidden>
          {status === "checking" ? <Loader2 className={styles.spin} /> : null}
          {status === "ok" ? <Check className={styles.ok} /> : null}
          {status === "bad" ? <X className={styles.bad} /> : null}
        </span>
      </div>
      <p
        id={`${id}-hint`}
        className={`${styles.hint} ${status === "ok" ? styles.hintOk : ""} ${status === "bad" ? styles.hintBad : ""}`}
        aria-live="polite"
      >
        {message ?? "3 to 20 characters: letters, numbers and underscores."}
      </p>
    </div>
  );
}
