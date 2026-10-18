"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Every route change starts at the top of the page.
 *
 * Next scrolls the new page to the top itself, but on this site that jump was
 * being undone: the home page's scroll engine (Lenis on desktop, the snapping
 * scroll on phones) and ScrollTrigger's teardown restore the previous scroll
 * position a few frames later, which on a short page lands on the footer.
 * So the top is pinned again for a short moment after each navigation, and
 * released as soon as the visitor scrolls. Back and forward keep the browser's
 * own restoration.
 */
export function ScrollToTop() {
  const pathname = usePathname();
  const fromHistory = useRef(false);
  const first = useRef(true);

  useEffect(() => {
    const onPop = () => {
      fromHistory.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (fromHistory.current) {
      fromHistory.current = false;
      return;
    }
    const html = document.documentElement;
    const previous = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";
    let active = true;
    const stop = () => {
      if (!active) return;
      active = false;
      html.style.scrollBehavior = previous;
      for (const type of INPUT) window.removeEventListener(type, stop);
    };
    const jump = () => {
      if (!active) return;
      if (window.scrollY !== 0) window.scrollTo(0, 0);
    };
    // The visitor's first scroll wins over the pin.
    for (const type of INPUT) window.addEventListener(type, stop, { passive: true });
    jump();
    let frames = 0;
    const tick = () => {
      jump();
      if (++frames < 12 && active) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    const timers = [60, 160, 320, 600].map((ms) => setTimeout(jump, ms));
    const release = setTimeout(stop, 700);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(release);
      stop();
    };
  }, [pathname]);

  return null;
}

const INPUT = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
