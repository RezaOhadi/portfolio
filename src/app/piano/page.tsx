import type { Metadata } from "next";
import Link from "next/link";
import styles from "./piano.module.css";

export const metadata: Metadata = {
  title: "The Golden Grand",
  description:
    "A golden concert grand in a royal hall. Play it, record it, make it yours.",
};

/**
 * Full-screen stage for the standalone Golden Grand app
 * (public/golden-grand/index.html). Lives outside the (site) group, so there
 * is no header, footer or page-reveal: only the piano and a way back.
 */
export default function PianoPage() {
  return (
    <main className={styles.stage}>
      {/* The site reserves a scrollbar gutter on <html> (portfolio.css). This
          page never scrolls, so release it here only; the rule unmounts with
          the page and no other route sees it. */}
      <style>{"html{scrollbar-gutter:auto}"}</style>
      <iframe
        src="/golden-grand/index.html"
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          border: 0,
        }}
        allow="midi; fullscreen; autoplay"
        allowFullScreen
        title="Golden Grand Piano"
      />
      <Link href="/" className={styles.back}>
        <span aria-hidden>←</span> rezaohadi.com
      </Link>
    </main>
  );
}
