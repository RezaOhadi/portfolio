"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { getLenis, scrollToTarget, setLenis, wake } from "@/lib/motion/engine";

/** Wheel smoothing only where it helps: fine pointers, motion allowed. */
const SMOOTH_QUERY =
  "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

/** Matches `scroll-padding-top` in portfolio.css so anchors clear the nav. */
function scrollPadding() {
  const value = parseFloat(
    getComputedStyle(document.documentElement).scrollPaddingTop,
  );
  return Number.isFinite(value) ? value : 0;
}

let leaving = 0;

/** Drop any in-flight easing and adopt the current native scroll position. */
function resync(lenis: Lenis) {
  lenis.stop();
  lenis.start();
}

/**
 * Turns the mouse wheel into a finely interpolated camera move.
 *
 * Lenis smooths wheel input on desktop only. Touch keeps native momentum
 * (syncTouch off), reduced-motion visitors get plain native scrolling, and
 * Lenis is driven by the shared motion clock rather than its own rAF, so
 * there is exactly one animation loop on the page.
 *
 * Every scroll position is still the real document scroll: framer-motion's
 * useScroll, sticky pins, IntersectionObservers and scroll restoration all
 * keep working unchanged.
 */
export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const query = window.matchMedia(SMOOTH_QUERY);
    let instance: Lenis | null = null;

    const enable = () => {
      if (instance) return;
      instance = new Lenis({
        autoRaf: false,
        lerp: 0.11,
        wheelMultiplier: 0.95,
        smoothWheel: true,
        syncTouch: false,
        anchors: false,
        allowNestedScroll: true,
        // Modal dialogs (menu, photo viewer) scroll natively and never move the page.
        prevent: (node) => node.nodeName === "DIALOG" || node.nodeName === "IFRAME",
      });
      document.documentElement.classList.add("has-smooth-scroll");
      setLenis(instance);
    };
    const disable = () => {
      if (!instance) return;
      instance.destroy();
      instance = null;
      document.documentElement.classList.remove("has-smooth-scroll");
      setLenis(null);
    };
    const update = () => (query.matches ? enable() : disable());
    update();
    query.addEventListener("change", update);

    /**
     * Same-page anchors ease through the engine (respecting the nav offset)
     * instead of jumping. Runs in the capture phase so Next's <Link> sees the
     * event as handled and skips its own instant hash scroll.
     */
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank")
        return;
      const url = new URL(anchor.href, location.href);
      const samePage =
        url.origin === location.origin && url.pathname === location.pathname;
      const lenis = getLenis();
      if (!samePage) {
        // Leaving the page: drop any in-flight wheel easing so it can't fight
        // the router's scroll reset on the next route.
        if (lenis) resync(lenis);
        // Immediate feedback while the next route loads. Navigation itself is
        // never delayed; the class clears when the new route commits.
        if (
          url.origin === location.origin &&
          !anchor.hasAttribute("download") &&
          !url.pathname.startsWith("/api/")
        ) {
          const html = document.documentElement;
          html.classList.add("is-leaving");
          window.clearTimeout(leaving);
          leaving = window.setTimeout(
            () => html.classList.remove("is-leaving"),
            2500,
          );
        }
        return;
      }
      if (!lenis || !url.hash) return;
      const target =
        url.hash === "#" || url.hash === "#top"
          ? document.body
          : document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!target) return;
      event.preventDefault();
      scrollToTarget(target === document.body ? 0 : target, {
        offset: target === document.body ? 0 : -scrollPadding(),
      });
      if (location.hash !== url.hash) history.pushState(history.state, "", url.hash);
      // Move keyboard focus with the view, without a second (instant) scroll.
      if (target !== document.body) {
        if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      }
    };
    window.addEventListener("click", onClick, true);

    /**
     * Scroll-linked values (framer-motion's useScroll, the reel) cache their
     * targets' offsets and only re-measure on scroll or window resize. When the
     * document changes height on its own — late images or fonts, the universe
     * falling back to its static layout — announce it as a scroll so every
     * pin and progress value re-measures instead of waiting for input.
     */
    let pending = 0;
    let lastHeight = document.documentElement.scrollHeight;
    const layout = new ResizeObserver(() => {
      const height = document.documentElement.scrollHeight;
      if (height === lastHeight || pending) return;
      lastHeight = height;
      pending = requestAnimationFrame(() => {
        pending = 0;
        getLenis()?.resize();
        window.dispatchEvent(new Event("scroll"));
      });
    });
    layout.observe(document.body);
    const settle = () => document.documentElement.classList.remove("is-leaving");
    window.addEventListener("popstate", settle);
    window.addEventListener("pageshow", settle);

    return () => {
      query.removeEventListener("change", update);
      window.removeEventListener("click", onClick, true);
      layout.disconnect();
      cancelAnimationFrame(pending);
      window.removeEventListener("popstate", settle);
      window.removeEventListener("pageshow", settle);
      disable();
    };
  }, []);

  // After a route change the router has set the scroll position natively;
  // re-sync Lenis so it eases from there rather than from the old page.
  useEffect(() => {
    document.documentElement.classList.remove("is-leaving");
    const lenis = getLenis();
    if (lenis) {
      resync(lenis);
      lenis.resize();
    }
    wake();
  }, [pathname]);

  return null;
}
