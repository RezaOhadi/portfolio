"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useEffect, type RefObject } from "react";
import { journey } from "./store";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Lenis smooths the wheel, GSAP's ticker drives Lenis, and one ScrollTrigger
 * per segment writes that segment's progress into the journey store. Touch
 * keeps native momentum (syncTouch off). Reduced motion skips Lenis entirely.
 */
export function useJourneyScroll(root: RefObject<HTMLElement | null>, reduced: boolean) {
  useEffect(() => {
    if (reduced) return;
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
