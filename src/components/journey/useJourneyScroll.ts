"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useEffect, useLayoutEffect, type RefObject } from "react";
import { isTouchDevice, STACKED_QUERY } from "./config";
import { journey } from "./store";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Section snapping. Each world rests between two scroll positions: its top at
 * the top of the screen, and its bottom at the bottom of the screen. Inside
 * that range the page scrolls freely (long copy, the concert list, the
 * contact form). Stopping anywhere between two worlds, that is inside a
 * transition, settles onto the next world going down or the previous one
 * going up. Measured on every ScrollTrigger refresh.
 */
let rests: [number, number][] = [];
let lenis: Lenis | null = null;

function measureRests(host: HTMLElement) {
  const vh = window.innerHeight;
  rests = gsap.utils
    .toArray<HTMLElement>('[data-segment]:not([data-kind="transition"])', host)
    .map((node) => {
      const top = node.getBoundingClientRect().top + window.scrollY;
      return [top, Math.max(top, top + node.offsetHeight - vh)] as [number, number];
    });
}

/** Where a stop at y settles: in place inside a world, else the next or previous world by direction. */
function settle(y: number, direction: number) {
  if (!rests.length || y >= rests[rests.length - 1][1] - 1) return y;
  if (rests.some(([a, b]) => y >= a - 1 && y <= b + 1)) return y;
  const next = rests.findIndex(([a]) => a > y);
  if (next <= 0) return y;
  const ahead = rests[next][0];
  const behind = rests[next - 1][1];
  if (direction > 0) return ahead;
  if (direction < 0) return behind;
  return y - behind < ahead - y ? behind : ahead;
}

/**
 * Phones and narrow tablets lay the biography copy below the exploded piano, in flow
 * (journey.module.css, max-width 760px). There the exploded world's progress ends when
 * the copy's top reaches the bottom of the viewport: the drawing and its part labels
 * complete over the piano runway alone, before the first line of text appears, exactly
 * as they do beside the sticky copy on desktop. Wider layouts keep the whole world.
 */
function explodedEnd(node: HTMLElement) {
  return () => {
    const copy = node.querySelector<HTMLElement>("[data-about-copy]");
    // Read the layout here, not journey.stacked: triggers are created in a layout effect,
    // before the effect that keeps the flag current has run.
    if (!copy || !window.matchMedia(STACKED_QUERY).matches) return node.getBoundingClientRect().top + window.scrollY + node.offsetHeight;
    return copy.getBoundingClientRect().top + window.scrollY - window.innerHeight;
  };
}

/**
 * Phones: the landing assist. The browser's proximity snapping only catches a
 * stop that is very close; a normal flick often ends with a heading just past
 * the top edge, so the reader misses it and scrolls back. When a flick ends
 * with a section heading within reach of its stop (30% of the screen, the
 * snap position in portfolio.css), the page glides there. A short, deliberate
 * scroll is never touched, nothing happens mid-copy, and nothing happens while
 * a glide of its own is in flight.
 */
let gliding = 0;
function landOnHeading(moved: number) {
  if (!journey.stacked || performance.now() < gliding) return;
  const vh = window.innerHeight;
  // Only a real flick is assisted: a short, deliberate scroll (reading) is never undone.
  if (Math.abs(moved) < vh * 0.4) return;
  const stop = vh * 0.3;
  const down = moved > 0;
  let best: { delta: number } | null = null;
  for (const el of document.querySelectorAll<HTMLElement>("[data-snap]")) {
    const delta = el.getBoundingClientRect().top - stop;
    // Going down: a heading still up to 55% of the screen short of its stop, or passed by up to 35%.
    // Going up: the mirror image.
    const ahead = down ? delta : -delta;
    if (ahead > vh * 0.55 || ahead < -vh * 0.35) continue;
    if (!best || Math.abs(delta) < Math.abs(best.delta)) best = { delta };
  }
  if (!best || Math.abs(best.delta) < 2) return;
  gliding = performance.now() + 900;
  window.scrollBy({ top: best.delta, behavior: "smooth" });
}

/** A menu key or anchor lands on the resting point of the world that holds its target. */
function landingFor(target: HTMLElement) {
  const y = target.getBoundingClientRect().top + window.scrollY;
  const vh = window.innerHeight;
  const world = rests.find(([a, b]) => y >= a - 1 && y < b + vh);
  return world ? world[0] : settle(y, 1);
}

/** Same-page anchors (the piano keys, in-page links) glide to their world's resting point. */
function onAnchor(event: MouseEvent) {
  const link = (event.target as Element | null)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
  const target = link && document.getElementById(decodeURIComponent(link.hash.slice(1)));
  if (!target) return;
  event.preventDefault();
  const top = target.closest("[data-segment]") ? landingFor(target) : target.getBoundingClientRect().top + window.scrollY;
  if (lenis) lenis.scrollTo(top, { duration: 1.1, easing: (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2) });
  else window.scrollTo({ top, behavior: "smooth" });
  history.replaceState(null, "", link.hash);
}

/**
 * Lenis smooths the wheel, GSAP's ticker drives Lenis, and one ScrollTrigger
 * per segment writes that segment's progress into the journey store. Phones
 * and tablets skip Lenis entirely and scroll natively (no normalizeScroll);
 * the velocity the effects read comes from the native scroll instead.
 * Reduced motion skips Lenis and snapping.
 */
export function useJourneyScroll(root: RefObject<HTMLElement | null>, reduced: boolean) {
  // The phone layout flag, kept current across rotation and resizes.
  useLayoutEffect(() => {
    const query = window.matchMedia(STACKED_QUERY);
    const sync = () => {
      journey.stacked = query.matches;
    };
    sync();
    query.addEventListener("change", sync);
    return () => {
      query.removeEventListener("change", sync);
      journey.stacked = false;
    };
  }, []);

  useEffect(() => {
    if (reduced) return;
    if (isTouchDevice()) {
      // CSS smooth scrolling would animate ScrollTrigger's own refresh jumps; anchors glide explicitly instead.
      const html = document.documentElement;
      const previous = html.style.scrollBehavior;
      html.style.scrollBehavior = "auto";
      // Section snapping on phones is native CSS scroll-snap, run by the compositor (portfolio.css).
      html.classList.add("journey-snap");
      document.addEventListener("click", onAnchor);
      // The address bar showing and hiding must not re-measure every trigger mid-scroll.
      ScrollTrigger.config({ ignoreMobileResize: true });
      // Pixels per frame, as Lenis reports it. The position is read in the scroll event, where
      // layout is clean; reading it in the ticker, after GSAP has written styles, forced a layout every frame.
      let last = window.scrollY;
      let at = 0;
      const onScroll = () => {
        const y = window.scrollY;
        journey.velocity = y - last;
        last = y;
        at = performance.now();
      };
      // Once the page stops, the velocity settles back to zero.
      const tick = () => {
        if (performance.now() - at > 60) journey.velocity *= 0.8;
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      gsap.ticker.add(tick);
      // Landing assist (phones): after a flick settles, a nearby heading comes to its stop.
      let settleTimer = 0;
      let gestureStart = window.scrollY;
      let idle = true;
      const onGesture = () => {
        if (idle) {
          idle = false;
          gestureStart = last;
        }
      };
      const onScrollEnd = () => {
        window.clearTimeout(settleTimer);
        settleTimer = window.setTimeout(() => {
          idle = true;
          landOnHeading(window.scrollY - gestureStart);
        }, 60);
      };
      window.addEventListener("scroll", onGesture, { passive: true });
      const hasScrollEnd = "onscrollend" in window;
      if (hasScrollEnd) window.addEventListener("scrollend", onScrollEnd);
      else window.addEventListener("scroll", () => { window.clearTimeout(settleTimer); settleTimer = window.setTimeout(onScrollEnd, 160); }, { passive: true });
      return () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("scroll", onGesture);
        window.removeEventListener("scrollend", onScrollEnd);
        window.clearTimeout(settleTimer);
        gsap.ticker.remove(tick);
        document.removeEventListener("click", onAnchor);
        html.classList.remove("journey-snap");
        html.style.scrollBehavior = previous;
        journey.velocity = 0;
      };
    }
    // The site sets `html { scroll-behavior: smooth }`; it would fight Lenis.
    const html = document.documentElement;
    const previousBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";
    const smooth = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true, syncTouch: false, anchors: false });
    lenis = smooth;
    const onScroll = (instance: Lenis) => {
      journey.velocity = instance.velocity;
      ScrollTrigger.update();
    };
    smooth.on("scroll", onScroll);
    const tick = (time: number) => smooth.raf(time * 1000);
    gsap.ticker.add(tick);
    document.addEventListener("click", onAnchor);
    return () => {
      gsap.ticker.remove(tick);
      document.removeEventListener("click", onAnchor);
      smooth.destroy();
      lenis = null;
      html.style.scrollBehavior = previousBehavior;
      journey.velocity = 0;
    };
  }, [reduced]);

  useGSAP(
    () => {
      const host = root.current;
      if (!host) return;
      const nodes = gsap.utils.toArray<HTMLElement>("[data-segment]", host);
      nodes.forEach((node, index) => {
        const id = node.dataset.segment!;
        const transition = node.dataset.kind === "transition";
        ScrollTrigger.create({
          trigger: node,
          // Transitions run while their runway fills the viewport; worlds while any part shows.
          start: transition || index === 0 ? "top top" : "top bottom",
          end: transition ? "bottom bottom" : id === "exploded" ? explodedEnd(node) : "bottom top",
          onUpdate: (self) => {
            journey.raw[id] = self.progress;
          },
          onRefresh: (self) => {
            journey.raw[id] = self.progress;
          },
        });
      });
      // Desktop: one trigger over the whole page carries the snap and settles on world resting
      // points. Phones snap natively instead (the journey-snap class, portfolio.css).
      if (!reduced && !isTouchDevice())
        ScrollTrigger.create({
          start: 0,
          end: () => ScrollTrigger.maxScroll(window),
          onRefresh: () => measureRests(host),
          snap: {
            snapTo: (value, self) => {
              if (!self) return value;
              const span = Math.max(1, self.end - self.start);
              return (settle(self.start + value * span, self.direction) - self.start) / span;
            },
            duration: { min: 0.6, max: 1 },
            delay: 0.1,
            ease: "power3.inOut",
            inertia: false,
          },
        });
      measureRests(host);
      // Fonts and lazy media change section heights after first layout.
      document.fonts?.ready.then(() => ScrollTrigger.refresh());
    },
    { scope: root, dependencies: [reduced], revertOnUpdate: true },
  );
}
