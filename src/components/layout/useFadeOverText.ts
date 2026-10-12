"use client";

import { useEffect, type RefObject } from "react";

/** Where a fixed corner control can end up over copy. */
const TEXT = "main :is(h1, h2, h3, h4, p, li, blockquote, figcaption, time, dt, dd, label, small), footer :is(p, li, small, a)";
/** Matches the CSS: only short screens fade the controls. */
const SHORT = "(max-height: 960px)";

const overlaps = (a: DOMRect, b: DOMRect) => a.width > 1 && a.bottom > b.top && a.top < b.bottom && a.right > b.left && a.left < b.right;

const shown = (node: Element | null) => {
  for (let a = node, i = 0; a && i < 8; a = a.parentElement, i++) {
    const s = getComputedStyle(a);
    if (s.visibility === "hidden" || +s.opacity < 0.15) return false;
  }
  return true;
};

/**
 * Sets `data-over-text` on a fixed control while visible text passes under it,
 * so CSS can fade it back. Only the text's own line boxes count, not the
 * blocks around them. Checks are throttled to scroll, with one after it stops.
 */
export function useFadeOverText(ref: RefObject<HTMLElement | null>, active = true) {
  useEffect(() => {
    if (!active) return;
    const short = window.matchMedia(SHORT);
    const range = document.createRange();
    let timer = 0;
    let settle = 0;

    const check = () => {
      const node = ref.current;
      if (!node) return;
      let over = false;
      if (short.matches) {
        const box = node.getBoundingClientRect();
        for (const el of document.querySelectorAll(TEXT)) {
          if (node.contains(el) || !overlaps(el.getBoundingClientRect(), box)) continue;
          const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
          for (let t = walker.nextNode(); t && !over; t = walker.nextNode()) {
            if (!t.textContent?.trim()) continue;
            range.selectNodeContents(t);
            over = [...range.getClientRects()].some((line) => overlaps(line, box)) && shown(t.parentElement);
          }
          if (over) break;
        }
      }
      if (over) node.dataset.overText = "true";
      else delete node.dataset.overText;
    };

    const onScroll = () => {
      if (!timer) timer = window.setTimeout(() => { timer = 0; requestAnimationFrame(check); }, 90);
      // Copy keeps revealing for a moment after the scroll stops.
      window.clearTimeout(settle);
      settle = window.setTimeout(check, 700);
    };

    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    short.addEventListener("change", check);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      short.removeEventListener("change", check);
      window.clearTimeout(timer);
      window.clearTimeout(settle);
    };
  }, [ref, active]);
}
