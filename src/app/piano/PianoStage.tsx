"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import styles from "./piano.module.css";

/** The Golden Grand's own phone breakpoint (public/golden-grand/index.html). */
const PHONE = "(max-width: 760px)";
/** The app's transient overlays near the top: while one covers the row, the row fades out. */
const OVERLAYS = ["pop-settings", "pop-help", "toast", "focus-label"];

/**
 * The Golden Grand in a full-screen iframe, with the back link and the
 * copyright line placed from the app's real layout: the app sizes its panels
 * at runtime (the piano roll height is a saved, draggable preference), so the
 * row reads the panels' rectangles through the same-origin document instead
 * of guessing. Phones: just under the app's top bar, at the left. Desktop and
 * tablet: bottom-left, just above the pedal dock and the piano roll.
 */
export function PianoStage() {
  const frame = useRef<HTMLIFrameElement>(null);
  const foot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const row = foot.current;
    const iframe = frame.current;
    if (!row || !iframe) return;
    let timers: number[] = [];
    let observer: MutationObserver | null = null;
    let appWindow: Window | null = null;
    let poll: number | undefined;

    const measure = () => {
      const doc = iframe.contentDocument;
      if (!doc) return;
      if (window.matchMedia(PHONE).matches) {
        const bar = doc.getElementById("topbar");
        if (bar) row.style.setProperty("--foot-top", `${Math.round(bar.getBoundingClientRect().bottom) + 4}px`);
      } else {
        const dock = doc.getElementById("dock");
        const roll = doc.getElementById("roll");
        if (!dock || !roll) return;
        const top = Math.min(dock.getBoundingClientRect().top, roll.getBoundingClientRect().top);
        const bottom = Math.min(window.innerHeight - 60, Math.round(window.innerHeight - top) + 12);
        row.style.setProperty("--foot-bottom", `${bottom}px`);
      }
      // Popovers, the toast and the focus label can reach the row (phones especially): yield to them.
      const mine = row.getBoundingClientRect();
      const view = doc.defaultView;
      const covered = OVERLAYS.some((id) => {
        const el = doc.getElementById(id);
        if (!el || el.hidden || !view) return false;
        const cs = view.getComputedStyle(el);
        if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) < 0.05) return false;
        const r = el.getBoundingClientRect();
        return r.left < mine.right + 4 && r.right > mine.left - 4 && r.top < mine.bottom + 4 && r.bottom > mine.top - 4;
      });
      row.toggleAttribute("data-covered", covered);
    };
    // The panels animate for up to 600 ms after a change: measure now and again as they settle.
    const settle = () => {
      timers.forEach(clearTimeout);
      timers = [0, 150, 400, 800].map((ms) => window.setTimeout(measure, ms));
    };
    const attach = () => {
      if (observer) return true;
      const doc = iframe.contentDocument;
      const app = doc?.getElementById("app");
      if (!doc || !app || !doc.getElementById("dock")) return false;
      // Collapsing a panel toggles a class on #app; dragging the roll writes --roll-h on the root.
      observer = new MutationObserver(settle);
      observer.observe(app, { attributes: true, attributeFilter: ["class"] });
      observer.observe(doc.documentElement, { attributes: true, attributeFilter: ["style"] });
      for (const id of OVERLAYS) {
        const el = doc.getElementById(id);
        if (el) observer.observe(el, { attributes: true, attributeFilter: ["class", "hidden", "style"] });
      }
      appWindow = iframe.contentWindow;
      appWindow?.addEventListener("resize", settle);
      settle();
      return true;
    };
    // The app may already be parsed when this runs, or still be loading.
    if (!attach()) poll = window.setInterval(() => attach() && clearInterval(poll), 200);
    iframe.addEventListener("load", attach);
    window.addEventListener("resize", settle);
    return () => {
      clearInterval(poll);
      timers.forEach(clearTimeout);
      observer?.disconnect();
      appWindow?.removeEventListener("resize", settle);
      iframe.removeEventListener("load", attach);
      window.removeEventListener("resize", settle);
    };
  }, []);

  return (
    <>
      <iframe
        ref={frame}
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
      <div ref={foot} className={styles.foot}>
        <Link href="/" className={styles.back}>
          <span aria-hidden>←</span> rezaohadi.com
        </Link>
        <small className={styles.copyright}>© 2026 Reza Ohadi. All rights reserved.</small>
      </div>
    </>
  );
}
