"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { saveUsername, type UsernameState } from "@/app/(site)/account/username/actions";
import { UsernameField, type UsernameStatus } from "./UsernameField";
import { PROFILE_EVENT } from "./AccountMenu";
import cta from "@/components/golden-grand/lets-play.module.css";
import styles from "./account.module.css";

const initial: UsernameState = { status: "idle" };

/** Pick (or change) the member's handle. Saved server-side after validation. */
export function UsernameForm({ current, next }: { current: string | null; next: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(saveUsername, initial);
  const [username, setUsername] = useState(current ?? "");
  const [status, setStatus] = useState<UsernameStatus>("idle");
  const onStatus = useCallback((s: UsernameStatus) => setStatus(s), []);

  useEffect(() => {
    if (state.status !== "success") return;
    window.dispatchEvent(new CustomEvent(PROFILE_EVENT));
    router.push(next);
    router.refresh();
  }, [state, next, router]);

  const blocked = status === "bad" || status === "checking" || !username.trim();

  return (
    <form action={formAction}>
      <input type="hidden" name="next" value={next} />
      {state.status === "error" && state.message ? (
        <p className={styles.error} role="alert">
          <AlertCircle aria-hidden /> <span>{state.message}</span>
        </p>
      ) : null}
      <UsernameField
        id="username"
        value={username}
        onChange={setUsername}
        onStatus={onStatus}
        current={current}
        autoFocus
      />
      <button
        type="submit"
        className={`${cta.cta} ${styles.primary}`}
        disabled={pending || blocked || state.status === "success"}
      >
        {pending ? <Loader2 className={styles.spin} aria-hidden style={{ width: 16, height: 16 }} /> : null}
        {pending ? "Saving…" : current ? "Save username" : "Continue"}
      </button>
    </form>
  );
}
