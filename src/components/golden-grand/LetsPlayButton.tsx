import Link from "next/link";
import styles from "./lets-play.module.css";

/** Three white keys and two black ones: the smallest slice of a keyboard. */
function PianoKeyIcon() {
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 20 14"
      aria-hidden
      focusable="false"
    >
      <rect
        x="0.5"
        y="0.5"
        width="19"
        height="13"
        rx="1.5"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.55"
      />
      <path
        d="M6.83 0.5v13M13.17 0.5v13"
        stroke="currentColor"
        strokeOpacity="0.55"
      />
      <rect x="5.1" y="0.5" width="3.1" height="8" fill="currentColor" />
      <rect x="11.8" y="0.5" width="3.1" height="8" fill="currentColor" />
    </svg>
  );
}

/**
 * The gold "Let's Play" button that opens the Golden Grand (/piano).
 * `variant` only adjusts size and placement; the look is shared.
 */
export function LetsPlayButton({
  variant = "section",
}: {
  variant?: "nav" | "section";
}) {
  return (
    <Link
      href="/piano"
      className={`${styles.cta} ${variant === "nav" ? styles.nav : styles.section}`}
      aria-label="Let's Play — open the Golden Grand piano"
    >
      <PianoKeyIcon />
      <span className={styles.label}>Let&rsquo;s Play</span>
    </Link>
  );
}
