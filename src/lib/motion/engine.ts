"use client";

import type Lenis from "lenis";

/**
 * The site's single motion clock.
 *
 * One requestAnimationFrame loop advances Lenis (when it is active) and then
 * hands every subscriber the same scroll sample, so scroll-linked scenes, the
 * cursor and decorative velocity effects all update in the same frame, from
 * the same numbers. The loop sleeps when nothing is moving: it is woken by
 * scroll, wheel, pointer and resize input and stops again once the scroll has
 * been still for a few frames and no subscriber asks for more.
 */

export interface MotionSample {
  /** Current (smoothed, when Lenis is on) window scroll offset in px. */
  scroll: number;
  /** Scroll velocity in px per frame, eased so it settles quickly to zero. */
  velocity: number;
  /** Viewport height, cached on resize. */
  vh: number;
  vw: number;
  /** Seconds since the previous frame, clamped. */
  dt: number;
  time: number;
}

/** Return true to keep the loop awake for another frame (e.g. still easing). */
export type Subscriber = (sample: MotionSample) => boolean | void;

const subscribers = new Set<Subscriber>();
let lenis: Lenis | null = null;
let frame = 0;
let running = false;
let lastTime = 0;
let lastScroll = 0;
let velocity = 0;
let idleFrames = 0;
let vh = 0;
let vw = 0;
let listening = false;

const sample: MotionSample = { scroll: 0, velocity: 0, vh: 0, vw: 0, dt: 0, time: 0 };

function measure() {
  vh = window.innerHeight;
  vw = window.innerWidth;
}

function tick(time: number) {
  frame = 0;
  const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 1 / 60;
  lastTime = time;
  lenis?.raf(time);

  const scroll = window.scrollY;
  const raw = scroll - lastScroll;
  lastScroll = scroll;
  // Frame-rate independent ease toward the raw delta; decays to 0 at rest.
  const k = 1 - Math.exp(-dt * 14);
  velocity += (raw - velocity) * k;
  if (Math.abs(velocity) < 0.01) velocity = 0;

  sample.scroll = scroll;
  sample.velocity = velocity;
  sample.vh = vh;
  sample.vw = vw;
  sample.dt = dt;
  sample.time = time;

  let busy = Boolean(lenis?.isScrolling) || raw !== 0 || velocity !== 0;
  subscribers.forEach((fn) => {
    if (fn(sample)) busy = true;
  });

  idleFrames = busy ? 0 : idleFrames + 1;
  if (idleFrames < 3) frame = requestAnimationFrame(tick);
  else {
    running = false;
    lastTime = 0;
  }
}

/** Ask for frames. Cheap to call from any input handler. */
export function wake() {
  idleFrames = 0;
  if (running || typeof window === "undefined") return;
  running = true;
  frame = requestAnimationFrame(tick);
}

function onResize() {
  measure();
  wake();
}

function listen() {
  if (listening) return;
  listening = true;
  measure();
  lastScroll = window.scrollY;
  const opts = { passive: true } as const;
  window.addEventListener("scroll", wake, opts);
  window.addEventListener("wheel", wake, opts);
  window.addEventListener("touchmove", wake, opts);
  window.addEventListener("keydown", wake, opts);
  window.addEventListener("resize", onResize, opts);
  window.addEventListener("pageshow", onResize, opts);
}

export function subscribe(fn: Subscriber) {
  listen();
  subscribers.add(fn);
  wake();
  return () => {
    subscribers.delete(fn);
  };
}

export function setLenis(instance: Lenis | null) {
  lenis = instance;
  listen();
  if (instance) wake();
}

export function getLenis() {
  return lenis;
}

/**
 * Scroll to an element or offset through the active engine. Lenis eases the
 * travel when it is running; otherwise this falls back to native scrolling
 * (smooth unless the visitor prefers reduced motion).
 */
export function scrollToTarget(
  target: number | HTMLElement,
  { offset = 0, immediate = false }: { offset?: number; immediate?: boolean } = {},
) {
  if (lenis) {
    lenis.scrollTo(target, { offset, immediate, duration: immediate ? 0 : 1.4 });
    wake();
    return;
  }
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const behavior: ScrollBehavior = immediate || reduce ? "auto" : "smooth";
  const top =
    typeof target === "number"
      ? target + offset
      : target.getBoundingClientRect().top + window.scrollY + offset;
  window.scrollTo({ top, behavior });
}

/** Utility: clamp to [0,1]. */
export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export function stop() {
  if (frame) cancelAnimationFrame(frame);
  frame = 0;
  running = false;
}
