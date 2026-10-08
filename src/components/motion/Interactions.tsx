"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { subscribe, wake } from "@/lib/motion/engine";

/** Rich pointer interactions only where a precise pointer exists. */
const FINE_POINTER =
  "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

const INTERACTIVE =
  "a[href], button:not(:disabled), [role='button'], summary, label[for], select";
const TEXT_ENTRY =
  "input:not([type='checkbox']):not([type='radio']):not([type='submit']):not([type='button']), textarea, [contenteditable='true']";

/**
 * Sitewide pointer layer, wired to the shared motion clock:
 *
 *  - A contextual cursor: a fine ring that trails the pointer with a short,
 *    critically damped ease, grows over links and becomes a gold disc with a
 *    label (VIEW, PLAY, OPEN, EXPLORE…) over elements carrying `data-cursor`.
 *    The native cursor stays everywhere except over labelled targets, and the
 *    ring hides over text fields and iframes, so nothing is ever harder to use.
 *  - Pointer depth for `[data-tilt]` surfaces: one delegated listener writes
 *    normalised pointer coordinates as CSS variables; CSS turns them into a
 *    restrained perspective tilt and a moving champagne highlight.
 *
 * Touch devices and reduced-motion visitors get neither; the markup is the
 * same in every mode.
 */
export function Interactions() {
  const cursor = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const pathname = usePathname();
  const reset = useRef<() => void>(() => {});

  useEffect(() => {
    const query = window.matchMedia(FINE_POINTER);
    let teardown: (() => void) | null = null;

    const enable = () => {
      const root = cursor.current;
      const text = label.current;
      if (!root || !text || teardown) return;
      const html = document.documentElement;
      html.classList.add("has-cursor");

      const pointer = { x: -100, y: -100, seen: false };
      const ring = { x: -100, y: -100 };
      let mode = "";
      let tilt: HTMLElement | null = null;
      let tiltRect: DOMRect | null = null;
      const tiltTarget = { x: 0, y: 0, mx: 50, my: 50 };
      let dirtyTilt = false;

      const setMode = (next: string, word = "") => {
        if (next === mode && text.textContent === word) return;
        mode = next;
        root.dataset.mode = next;
        text.textContent = word;
      };

      const leaveTilt = () => {
        if (!tilt) return;
        tilt.style.setProperty("--tx", "0");
        tilt.style.setProperty("--ty", "0");
        tilt.removeAttribute("data-tilt-active");
        tilt = null;
        tiltRect = null;
      };

      /** Cursor state + tilt surface for whatever is under the pointer. */
      const resolve = (target: Element | null) => {
        // A label describes a click, so it only shows over something
        // clickable: the nearest labelled zone around the interactive element
        // under the pointer (or that element itself). Plain text inside a
        // labelled card keeps the neutral ring.
        const interactive = target?.closest?.<HTMLElement>(INTERACTIVE);
        const labelled = interactive?.closest<HTMLElement>("[data-cursor]");
        if (target?.closest?.(TEXT_ENTRY)) setMode("hidden");
        else if (labelled?.dataset.cursor)
          setMode("label", labelled.dataset.cursor);
        else if (interactive) setMode("link");
        else setMode("");

        const surface = target?.closest?.<HTMLElement>("[data-tilt]") ?? null;
        if (surface !== tilt) {
          leaveTilt();
          if (surface) {
            tilt = surface;
            tiltRect = surface.getBoundingClientRect();
            surface.setAttribute("data-tilt-active", "");
          }
        }
        if (tilt && tiltRect) {
          const nx = (pointer.x - tiltRect.left) / tiltRect.width;
          const ny = (pointer.y - tiltRect.top) / tiltRect.height;
          tiltTarget.x = Math.max(-1, Math.min(1, nx * 2 - 1));
          tiltTarget.y = Math.max(-1, Math.min(1, ny * 2 - 1));
          tiltTarget.mx = nx * 100;
          tiltTarget.my = ny * 100;
          dirtyTilt = true;
        }
      };

      const onMove = (event: PointerEvent) => {
        if (event.pointerType !== "mouse") return;
        pointer.x = event.clientX;
        pointer.y = event.clientY;
        if (!pointer.seen) {
          pointer.seen = true;
          ring.x = pointer.x;
          ring.y = pointer.y;
          root.dataset.visible = "true";
        }
        resolve(event.target as Element | null);
        wake();
      };

      const onDown = () => root.setAttribute("data-pressed", "");
      const onUp = () => root.removeAttribute("data-pressed");
      // Leaving the window or entering an iframe: the trail can no longer
      // follow, so it fades rather than freezing in place.
      const onOut = (event: MouseEvent) => {
        if (!event.relatedTarget || (event.relatedTarget as Element).nodeName === "IFRAME") {
          root.dataset.visible = "false";
          pointer.seen = false;
          leaveTilt();
        }
      };
      // Scrolling moves content under a still pointer (the reel slides whole
      // performances beneath it): re-resolve what is there, a few times a second.
      let lastScroll = window.scrollY;
      let lastHit = 0;
      let pendingHit = false;
      const onScroll = () => {
        if (tilt) tiltRect = tilt.getBoundingClientRect();
      };

      const unsubscribe = subscribe(({ dt, scroll, time }) => {
        if (!pointer.seen) return false;
        if (scroll !== lastScroll) {
          lastScroll = scroll;
          pendingHit = true;
        }
        if (pendingHit && time - lastHit > 90) {
          pendingHit = false;
          lastHit = time;
          resolve(document.elementFromPoint(pointer.x, pointer.y));
        }
        const k = 1 - Math.exp(-dt * 20);
        ring.x += (pointer.x - ring.x) * k;
        ring.y += (pointer.y - ring.y) * k;
        root.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0)`;
        root.style.setProperty("--dot-x", `${pointer.x - ring.x}px`);
        root.style.setProperty("--dot-y", `${pointer.y - ring.y}px`);
        if (dirtyTilt && tilt) {
          tilt.style.setProperty("--tx", tiltTarget.x.toFixed(3));
          tilt.style.setProperty("--ty", tiltTarget.y.toFixed(3));
          tilt.style.setProperty("--mx", `${tiltTarget.mx.toFixed(1)}%`);
          tilt.style.setProperty("--my", `${tiltTarget.my.toFixed(1)}%`);
          dirtyTilt = false;
        }
        return (
          pendingHit ||
          Math.abs(pointer.x - ring.x) + Math.abs(pointer.y - ring.y) > 0.3
        );
      });

      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerdown", onDown, { passive: true });
      window.addEventListener("pointerup", onUp, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      document.addEventListener("mouseout", onOut);

      reset.current = () => {
        leaveTilt();
        setMode("");
      };
      teardown = () => {
        unsubscribe();
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerdown", onDown);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("scroll", onScroll);
        document.removeEventListener("mouseout", onOut);
        leaveTilt();
        html.classList.remove("has-cursor");
        root.dataset.visible = "false";
        reset.current = () => {};
      };
    };
    const disable = () => {
      teardown?.();
      teardown = null;
    };
    const update = () => (query.matches ? enable() : disable());
    update();
    query.addEventListener("change", update);
    return () => {
      query.removeEventListener("change", update);
      disable();
    };
  }, []);

  // A route change swaps the element under the pointer without a move event.
  useEffect(() => {
    reset.current();
  }, [pathname]);

  return (
    <div ref={cursor} className="site-cursor" data-visible="false" aria-hidden>
      <span className="site-cursor-ring">
        <span ref={label} className="site-cursor-label" />
      </span>
      <span className="site-cursor-dot" />
    </div>
  );
}
