"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import type { RefObject } from "react";
import { emitSparks } from "../store";

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin, useGSAP);

/**
 * Every text element on the journey declares its role with `data-fx`, and
 * each role has its own entrance:
 *   title    characters rise from a mask with a slight 3D tilt, then a gold light sweeps across
 *   eyebrow  letter spacing collapses from very wide while it fades in
 *   lede     words un-blur and drift into place in a staggered wave
 *   body     lines reveal from behind a mask, top to bottom
 *   number   scrambles into its final value
 *   link     the underline draws in, then the label slides up
 *   block    media and cards open from a clip and settle
 *   stagger  a container whose children open one after another
 *   rule     a hairline draws across
 * Entrances play on the way down and reverse on the way up. When a section
 * leaves, its text dissolves upward and sheds gold sparks into the 3D scene.
 * Reduced motion: soft opacity fades only. SplitText's aria handling keeps
 * the original string as an aria-label and hides the fragments.
 */

const GOLD = "#f3d6ae";
const ENTER = { start: "top 88%", toggleActions: "play none none reverse" } as const;

/** The section that owns an element's exit (sticky copy leaves with its world). */
function scopeOf(el: HTMLElement) {
  return (el.closest("[data-fx-scope]") as HTMLElement | null) ?? el;
}

/**
 * Exits never touch a property the entrance animates on the same node: they
 * use `filter: opacity() blur()` and a translate on a different layer, so a
 * deep-link load or a fast reverse can never leave text stuck invisible.
 */
function exitTrigger(el: HTMLElement, targets: gsap.TweenTarget, blur: number, extra: gsap.TweenVars = {}, sparks = 0) {
  const scope = scopeOf(el);
  gsap.fromTo(
    targets,
    { filter: "opacity(1) blur(0px)", y: 0 },
    {
      filter: `opacity(0) blur(${blur}px)`,
      y: -28,
      ...extra,
      ease: "power2.in",
      scrollTrigger: {
        trigger: scope,
        start: "bottom 58%",
        end: "bottom 8%",
        scrub: 0.6,
        onEnter: sparks
          ? () => {
              const r = el.getBoundingClientRect();
              emitSparks(r.left + r.width / 2, r.top + r.height / 2, r.width, r.height, sparks);
            }
          : undefined,
      },
    },
  );
}

function title(el: HTMLElement) {
  SplitText.create(el, {
    type: "words,chars",
    mask: "words",
    autoSplit: true,
    onSplit(self) {
      gsap.set(self.chars, { transformPerspective: 700, transformOrigin: "50% 100%" });
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, ...ENTER } });
      tl.from(self.chars, { yPercent: 118, rotateX: -78, opacity: 0, duration: 1.35, ease: "power4.out", stagger: 0.032 })
        // The light sweep: each letter catches gold and lets it go.
        .to(self.chars, { color: GOLD, duration: 0.32, ease: "power2.out", stagger: 0.028 }, "-=0.95")
        .to(self.chars, { color: "", duration: 0.7, ease: "power2.inOut", stagger: 0.028 }, "<0.22");
      exitTrigger(el, self.words, 8, { color: GOLD, stagger: { each: 0.03, from: "random" } }, Math.min(90, self.chars.length * 3));
      return tl;
    },
  });
}

function eyebrow(el: HTMLElement) {
  gsap.from(el, {
    letterSpacing: "0.9em",
    opacity: 0,
    duration: 1.5,
    ease: "expo.out",
    scrollTrigger: { trigger: el, ...ENTER },
  });
  exitTrigger(el, el, 4);
}

function lede(el: HTMLElement) {
  SplitText.create(el, {
    type: "words",
    autoSplit: true,
    onSplit(self) {
      const tween = gsap.from(self.words, {
        opacity: 0,
        y: 22,
        filter: "blur(12px)",
        duration: 1.3,
        ease: "power3.out",
        stagger: { each: 0.045, ease: "sine.inOut" },
        scrollTrigger: { trigger: el, ...ENTER },
      });
      return tween;
    },
  });
  // On the element itself: the words carry the entrance.
  exitTrigger(el, el, 10, { color: GOLD }, 40);
}

function body(el: HTMLElement) {
  SplitText.create(el, {
    type: "lines",
    mask: "lines",
    autoSplit: true,
    onSplit(self) {
      const tween = gsap.from(self.lines, {
        yPercent: 105,
        duration: 1.15,
        ease: "expo.out",
        stagger: 0.085,
        scrollTrigger: { trigger: el, ...ENTER },
      });
      exitTrigger(el, self.masks, 6, { stagger: 0.04 });
      return tween;
    },
  });
}

function number(el: HTMLElement) {
  const text = el.textContent ?? "";
  el.setAttribute("aria-label", text);
  gsap.from(el, { opacity: 0, duration: 0.4, scrollTrigger: { trigger: el, ...ENTER } });
  gsap.to(el, {
    duration: 1.4,
    ease: "power3.out",
    scrambleText: { text, chars: "0123456789", revealDelay: 0.25, speed: 0.6 },
    scrollTrigger: { trigger: el, ...ENTER },
  });
  exitTrigger(el, el, 6);
}

function link(el: HTMLElement) {
  SplitText.create(el, {
    type: "lines",
    mask: "lines",
    autoSplit: true,
    onSplit(self) {
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, ...ENTER } });
      tl.fromTo(el, { "--fx-line": 0 }, { "--fx-line": 1, duration: 1.1, ease: "expo.inOut" })
        .from(self.lines, { yPercent: 110, duration: 0.9, ease: "power4.out" }, "-=0.45");
      const icons = el.querySelectorAll("svg");
      if (icons.length) tl.from(icons, { opacity: 0, x: -8, duration: 0.6, ease: "power3.out" }, "<0.15");
      return tl;
    },
  });
  exitTrigger(el, el, 5);
}

function block(el: HTMLElement) {
  gsap.from(el, {
    clipPath: "inset(18% 6% 18% 6%)",
    opacity: 0,
    y: 60,
    scale: 0.96,
    duration: 1.4,
    ease: "expo.out",
    scrollTrigger: { trigger: el, start: "top 92%", toggleActions: "play none none reverse" },
  });
}

function stagger(el: HTMLElement) {
  const selector = el.dataset.fxItems;
  const items = selector ? gsap.utils.toArray<HTMLElement>(selector, el) : Array.from(el.children);
  if (!items.length) return;
  gsap.from(items, {
    opacity: 0,
    y: 70,
    scale: 0.94,
    clipPath: "inset(12% 8% 12% 8%)",
    duration: 1.3,
    ease: "expo.out",
    stagger: 0.09,
    scrollTrigger: { trigger: el, start: "top 90%", toggleActions: "play none none reverse" },
  });
}

function rule(el: HTMLElement) {
  gsap.from(el, { scaleX: 0, transformOrigin: "left center", duration: 1.6, ease: "expo.inOut", scrollTrigger: { trigger: el, ...ENTER } });
}

const ROLES: Record<string, (el: HTMLElement) => void> = { title, eyebrow, lede, body, number, link, block, stagger, rule };

/** `started` holds every entrance until the first world is ready, so text arrives with the piano. */
export function useTextChoreography(root: RefObject<HTMLElement | null>, reduced: boolean, started: boolean) {
  useGSAP(
    () => {
      const host = root.current;
      if (!host) return;
      if (!started) return;
      const nodes = gsap.utils.toArray<HTMLElement>("[data-fx]", host);
      if (reduced) {
        // Soft fades only.
        nodes.forEach((el) => gsap.from(el, { opacity: 0, duration: 0.8, ease: "power1.out", scrollTrigger: { trigger: el, ...ENTER } }));
        host.setAttribute("data-fx-ready", "");
        return;
      }
      nodes.forEach((el) => ROLES[el.dataset.fx ?? ""]?.(el));
      host.setAttribute("data-fx-ready", "");
    },
    { scope: root, dependencies: [reduced, started], revertOnUpdate: true },
  );
}
