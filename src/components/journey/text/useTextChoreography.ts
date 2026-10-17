"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useEffect, type RefObject } from "react";
import { isTouchDevice } from "../config";
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
/**
 * Phones and tablets animate transform and opacity only: no blur, no letter
 * spacing, colour sweeps or clip paths. Set when the choreography starts.
 */
let touch = false;
/**
 * An entrance trigger. Desktop plays on enter and reverses on the way back up.
 * Phones play once, by time, and the trigger is killed after it fires, so only
 * a few text triggers are ever live while scrolling.
 */
const enter = (start = "top 88%") => (touch ? { start, once: true } : { start, toggleActions: "play none none reverse" });

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
  // Phones: no scrubbed exits and no gold dust; the copy simply scrolls away.
  if (touch) return;
  const scope = scopeOf(el);
  gsap.fromTo(
    targets,
    { filter: touch ? "opacity(1)" : "opacity(1) blur(0px)", y: 0 },
    {
      filter: touch ? "opacity(0)" : `opacity(0) blur(${blur}px)`,
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
    // Phones split into words only: far fewer pieces to animate.
    type: touch ? "words" : "words,chars",
    mask: "words",
    // Named so journey.module.css can give each word mask room for descenders.
    wordsClass: "fx-word",
    autoSplit: true,
    onSplit(self) {
      const pieces = touch ? self.words : self.chars;
      gsap.set(pieces, { transformPerspective: 700, transformOrigin: "50% 100%" });
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, ...enter() } });
      tl.from(pieces, { yPercent: 118, rotateX: -78, opacity: 0, duration: 1.35, ease: "power4.out", stagger: touch ? 0.09 : 0.032 });
      // The light sweep: each letter catches gold and lets it go.
      if (!touch)
        tl.to(self.chars, { color: GOLD, duration: 0.32, ease: "power2.out", stagger: 0.028 }, "-=0.95").to(self.chars, { color: "", duration: 0.7, ease: "power2.inOut", stagger: 0.028 }, "<0.22");
      exitTrigger(el, self.words, 8, { ...(touch ? {} : { color: GOLD }), stagger: { each: 0.03, from: "random" } }, Math.min(90, self.chars.length * 3));
      return tl;
    },
  });
}

function eyebrow(el: HTMLElement) {
  gsap.from(el, {
    // Phones slide in instead of tracking in: letter spacing re-lays the line every frame.
    // (x, not y: the exit owns y on this node.)
    ...(touch ? { x: -14 } : { letterSpacing: "0.9em" }),
    opacity: 0,
    duration: 1.5,
    ease: "expo.out",
    scrollTrigger: { trigger: el, ...enter() },
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
        ...(touch ? {} : { filter: "blur(12px)" }),
        duration: 1.3,
        ease: "power3.out",
        stagger: { each: 0.045, ease: "sine.inOut" },
        scrollTrigger: { trigger: el, ...enter() },
      });
      return tween;
    },
  });
  // On the element itself: the words carry the entrance.
  exitTrigger(el, el, 10, touch ? {} : { color: GOLD }, 40);
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
        scrollTrigger: { trigger: el, ...enter() },
      });
      exitTrigger(el, self.masks, 6, { stagger: 0.04 });
      return tween;
    },
  });
}

function number(el: HTMLElement) {
  const text = el.textContent ?? "";
  el.setAttribute("aria-label", text);
  gsap.from(el, { opacity: 0, duration: 0.4, scrollTrigger: { trigger: el, ...enter() } });
  gsap.to(el, {
    duration: 1.4,
    ease: "power3.out",
    scrambleText: { text, chars: "0123456789", revealDelay: 0.25, speed: 0.6 },
    scrollTrigger: { trigger: el, ...enter() },
  });
  exitTrigger(el, el, 6);
}

/**
 * Links are flex rows (label, gap, icon). Gather the label's text nodes into
 * one span so its word masks stay a single flex item. The text nodes are
 * moved, not copied, so React keeps its references to them.
 */
function labelOf(el: HTMLElement) {
  const existing = el.querySelector<HTMLElement>(":scope > [data-fx-label]");
  if (existing) return existing;
  const texts = Array.from(el.childNodes).filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim());
  if (!texts.length) return el;
  const label = document.createElement("span");
  label.dataset.fxLabel = "";
  el.insertBefore(label, texts[0]);
  texts.forEach((n) => label.append(n));
  return label;
}

function link(el: HTMLElement) {
  // Word masks stay inline, so flex links (label + icon) keep their single line.
  SplitText.create(labelOf(el), {
    type: "words",
    mask: "words",
    autoSplit: true,
    onSplit(self) {
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, ...enter() } });
      tl.fromTo(el, { "--fx-line": 0 }, { "--fx-line": 1, duration: 1.1, ease: "expo.inOut" })
        .from(self.words, { yPercent: 110, duration: 0.9, ease: "power4.out", stagger: 0.03 }, "-=0.45");
      const icons = el.querySelectorAll("svg");
      if (icons.length) tl.from(icons, { opacity: 0, x: -8, duration: 0.6, ease: "power3.out" }, "<0.15");
      return tl;
    },
  });
  exitTrigger(el, el, 5);
}

function block(el: HTMLElement) {
  gsap.from(el, {
    ...(touch ? {} : { clipPath: "inset(18% 6% 18% 6%)" }),
    opacity: 0,
    y: 60,
    scale: 0.96,
    duration: 1.4,
    ease: "expo.out",
    scrollTrigger: { trigger: el, ...enter("top 92%") },
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
    ...(touch ? {} : { clipPath: "inset(12% 8% 12% 8%)" }),
    duration: 1.3,
    ease: "expo.out",
    stagger: 0.09,
    scrollTrigger: { trigger: el, ...enter("top 90%") },
  });
}

function rule(el: HTMLElement) {
  gsap.from(el, { scaleX: 0, transformOrigin: "left center", duration: 1.6, ease: "expo.inOut", scrollTrigger: { trigger: el, ...enter() } });
}

const ROLES: Record<string, (el: HTMLElement) => void> = { title, eyebrow, lede, body, number, link, block, stagger, rule };

/** `started` holds every entrance until the first world is ready, so text arrives with the piano. */
export function useTextChoreography(root: RefObject<HTMLElement | null>, reduced: boolean, started: boolean) {
  // The scripts have arrived: from here the choreography owns the hero copy (see LATE_COPY in the root layout).
  useEffect(() => {
    (window as Window & { __fxStarted?: boolean }).__fxStarted = true;
  }, []);
  useGSAP(
    () => {
      const host = root.current;
      if (!host) return;
      if (!started) return;
      touch = isTouchDevice();
      // On a slow connection the hero copy has already shown itself (see LATE_COPY in the root layout): leave it in place.
      const shown = document.documentElement.classList.contains("fx-late");
      // Only the first, slow arrival: a later visit within the session gets the full entrance.
      document.documentElement.classList.remove("fx-late");
      const nodes = gsap.utils.toArray<HTMLElement>("[data-fx]", host).filter((el) => !(shown && el.closest("[data-hero-copy]")));
      if (reduced) {
        // Soft fades only.
        nodes.forEach((el) => gsap.from(el, { opacity: 0, duration: 0.8, ease: "power1.out", scrollTrigger: { trigger: el, ...enter() } }));
        host.setAttribute("data-fx-ready", "");
        return;
      }
      nodes.forEach((el) => ROLES[el.dataset.fx ?? ""]?.(el));
      // The dark pools behind the copy (--scrim, see journey.module.css) leave with their section's text.
      // Desktop only: on phones the only scroll-scrubbed timeline is the journey itself.
      if (!touch) gsap.utils.toArray<HTMLElement>("[data-fx-scope]", host).forEach((scope) =>
        gsap.fromTo(
          scope,
          { "--scrim": 1 },
          { "--scrim": 0, ease: "power2.in", scrollTrigger: { trigger: scope, start: "bottom 58%", end: "bottom 8%", scrub: 0.6 } },
        ),
      );
      host.setAttribute("data-fx-ready", "");
    },
    { scope: root, dependencies: [reduced, started], revertOnUpdate: true },
  );
}
