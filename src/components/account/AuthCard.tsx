import type { ReactNode } from "react";
import styles from "./account.module.css";

/** The narrow lacquer card every member page is set in. */
export function AuthCard({
  kicker = "Members",
  title,
  lead,
  children,
  footer,
}: {
  kicker?: string;
  title: string;
  lead?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className={styles.page}>
      <div className={styles.card}>
        <span className={styles.kicker}>{kicker}</span>
        <h1 className={styles.title}>{title}</h1>
        {lead ? <p className={styles.lead}>{lead}</p> : null}
        {children}
        {footer ? <p className={styles.footer}>{footer}</p> : null}
      </div>
    </section>
  );
}

/** Shown in place of a form when Supabase is not configured (demo mode). */
export function NotConfigured() {
  return (
    <p className={styles.fine}>
      Member accounts are not switched on in this environment. Add the Supabase
      keys to <code>.env.local</code> (see the README) and reload.
    </p>
  );
}
