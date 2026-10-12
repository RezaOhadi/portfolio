"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useEffect, type RefObject } from "react";
import { isTouchDevice } from "./config";
import { journey } from "./store";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Lenis smooths the wheel, GSAP's ticker drives Lenis, and one ScrollTrigger
 * per segment writes that segment's progress into the journey store. Phones
 * and tablets skip Lenis entirely and scroll natively (no normalizeScroll);
 * the velocity the effects read comes from the native scroll instead.
 * Reduced motion skips Lenis too.
 */
export function useJourneyScroll(root: RefObject<HTMLElement | null>, reduced: boolean) {
  useEffect(() => {
    if (reduced) return;
    if (isTouchDevice()) {
      // CSS smooth scrolling would animate ScrollTrigger's own refresh jumps; anchors glide explicitly instead.
      const html = document.documentElement;
      const previous = html.style.scrollBehavior;
      html.style.scrollBehavior = "auto";
      const anchor = (event: MouseEvent) => {
        const link = (event.target as Element | null)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
        const target = link && document.getElementById(decodeURIComponent(link.hash.slice(1)));
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        history.replaceState(null, "", link.hash);
      };
      document.addEventListener("click", anchor);
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
      return () => {
        window.removeEventListener("scroll", onScroll);
        gsap.ticker.remove(tick);
        document.removeEventListener("click", anchor);
        html.style.scrollBehavior = previous;
        journey.velocity = 0;
      };
    }
    // The site sets `html { scroll-behavior: smooth }`; it would fight Lenis.
    const html = document.documentElement;
    const previousBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";
    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true, syncTouch: false, anchors: true });
    const onScroll = (instance: Lenis) => {
      journey.velocity = instance.velocity;
      ScrollTrigger.update();
    };
    lenis.on("scroll", onScroll);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
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
          end: transition ? "bottom bottom" : "bottom top",
          onUpdate: (self) => {
            journey.raw[id] = self.progress;
          },
          onRefresh: (self) => {
            journey.raw[id] = self.progress;
          },
        });
      });
      // Fonts and lazy media change section heights after first layout.
      document.fonts?.ready.then(() => ScrollTrigger.refresh());
    },
    { scope: root, dependencies: [reduced], revertOnUpdate: true },
  );
}
