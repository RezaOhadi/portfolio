import type { Metadata } from "next";
import { PianoStage } from "./PianoStage";
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
      <PianoStage />
    </main>
  );
}
