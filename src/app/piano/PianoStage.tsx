"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import cta from "@/components/golden-grand/lets-play.module.css";
import styles from "./piano.module.css";

/** The Golden Grand's own phone breakpoint (public/golden-grand/index.html). */
const PHONE = "(max-width: 760px)";
/** The app's transient overlays near the top: while one covers the row, the row fades out. */
const OVERLAYS = ["pop-settings", "pop-help", "toast", "focus-label"];

/** Escape must not leave while someone is typing. Same test the app uses for its own shortcuts. */
function isField(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el || !el.tagName) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

/**
 * The Golden Grand in a full-screen iframe, with the home link (the site
 * wordmark and a gold "Home" label) and the copyright line in one row at the
 * top left, just under the app's top bar. The app sizes its panels at runtime,
 * so the row reads the bar's rectangle through the same-origin document instead
 * of guessing, and steps aside while a popover, the toast or the focus label
 * reaches it. Escape goes home too, unless the app needs it first: a text
 * field has focus, a popover is open, performance mode is on, or the piano
 * roll is clearing a selection.
 */
export function PianoStage() {
  const router = useRouter();
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
      const bar = doc.getElementById("topbar");
      if (bar) {
        const gap = window.matchMedia(PHONE).matches ? 4 : 10;
        row.style.setProperty("--foot-top", `${Math.round(bar.getBoundingClientRect().bottom) + gap}px`);
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

    // Escape, inside the app or on this page. The app's own Escape (close a
    // popover, leave performance mode) runs on the same event, so the state is
    // read in the capture phase, before any handler, and acted on in the bubble
    // phase. The piano roll stops propagation when it clears a selection, so
    // that Escape never arrives here at all.
    let appBusy = false;
    const peek = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const doc = iframe.contentDocument;
      const app = doc?.getElementById("app");
      const popOpen = doc ? [...doc.querySelectorAll<HTMLElement>(".pop")].some((p) => !p.hidden) : false;
      appBusy = !!app?.classList.contains("perf") || popOpen;
    };
    const leave = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.repeat || e.defaultPrevented || appBusy || isField(e.target)) return;
      router.push("/");
    };
    window.addEventListener("keydown", peek, true);
    window.addEventListener("keydown", leave);

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
      appWindow?.addEventListener("keydown", peek, true);
      appWindow?.addEventListener("keydown", leave);
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
      appWindow?.removeEventListener("keydown", peek, true);
      appWindow?.removeEventListener("keydown", leave);
      iframe.removeEventListener("load", attach);
      window.removeEventListener("resize", settle);
      window.removeEventListener("keydown", peek, true);
      window.removeEventListener("keydown", leave);
    };
  }, [router]);

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
        {/* The same wordmark the site header shows (portfolio.css), with a gold "Home" beside it. */}
        <Link href="/" className={styles.home} aria-label="Reza Ohadi — home">
          <span className={`wordmark ${styles.wordmark}`}>
            <span className="wordmark-name">
              Reza Ohadi<span aria-hidden>.</span>
            </span>
            <span className="wordmark-role" aria-hidden>
              Pianist · Composer
            </span>
          </span>
          <span className={`${cta.cta} ${styles.homeLabel}`} aria-hidden>
            Home
          </span>
        </Link>
        <small className={styles.copyright}>© 2026 Reza Ohadi. All rights reserved.</small>
      </div>
    </>
  );
}
