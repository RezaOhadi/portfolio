"use client";
import { useLayoutEffect, type RefObject } from "react";
import { clamp01, subscribe, wake } from "@/lib/motion/engine";
import type { JourneyMotion } from "./CameraRig";

interface Chapter {
  node: HTMLElement;
  top: number;
  height: number;
  entry: boolean;
  enter: number;
  leave: number;
}

/**
 * Scroll choreography for the Piano Universe chapters.
 *
 * Each chapter receives two normalised values as CSS custom properties:
 *  --enter  0 → 1 while it rises into view (its top travels from the bottom
 *           of the viewport to a quarter of the way down),
 *  --leave  0 → 1 while it exits (its bottom travels from mid-screen — or,
 *           for the hero, from the very first pixel of scroll — to the top).
 * Between the two it is at rest, so copy is perfectly still while it is read.
 * CSS maps them onto the independent `translate` / `scale` properties, which
 * compose with (and never fight) the editorial reveal transforms.
 *
 * Layout is measured on resize only; each frame is arithmetic on the shared
 * scroll sample and a handful of style writes, and only when a value changes.
 *
 * The same subscriber eases the champagne stage light toward the pointer and
 * the journey's progress, and forwards scroll velocity to the camera rig.
 */
export function useChapterDepth(
  root: RefObject<HTMLDivElement | null>,
  glow: RefObject<HTMLDivElement | null>,
  motion: RefObject<JourneyMotion>,
  enabled: boolean,
) {
  useLayoutEffect(() => {
    const host = root.current;
    if (!host || !enabled) return;
    const nodes = Array.from(
      host.querySelectorAll<HTMLElement>("[data-editorial-chapter]"),
    );
    const chapters: Chapter[] = nodes.map((node, i) => ({
      node,
      top: 0,
      height: 0,
      entry: i === 0,
      enter: -1,
      leave: -1,
    }));
    const measure = () => {
      for (const c of chapters) {
        const rect = c.node.getBoundingClientRect();
        c.top = rect.top + window.scrollY;
        c.height = rect.height;
        c.enter = c.leave = -1; // force a write
      }
      wake();
    };
    measure();
    const observer = new ResizeObserver(measure);
    nodes.forEach((n) => observer.observe(n));
    host.dataset.depth = "true";

    const light = { x: 0.72, y: 0.3, o: 0 };
    const pointerWake = () => wake();
    host.addEventListener("pointermove", pointerWake, { passive: true });

    const unsubscribe = subscribe(({ scroll, vh, dt, velocity }) => {
      const state = motion.current;
      state.velocity = velocity;

      for (const c of chapters) {
        const top = c.top - scroll;
        const bottom = top + c.height;
        const enter = c.entry ? 1 : clamp01((vh - top) / (vh * 0.75));
        const start = c.entry ? vh : vh * 0.5;
        const leave = clamp01((start - bottom) / start);
        // Round to keep style writes (and recalcs) to genuine changes.
        const e = Math.round(enter * 1000) / 1000;
        const l = Math.round(leave * 1000) / 1000;
        if (e !== c.enter) {
          c.enter = e;
          c.node.style.setProperty("--enter", String(e));
        }
        if (l !== c.leave) {
          c.leave = l;
          c.node.style.setProperty("--leave", String(l));
        }
      }

      // Stage light: drifts from the upper right (prelude) across to the
      // artist's side and back as the camera travels, nudged by the pointer.
      const p = state.progress;
      const tx = 0.72 - Math.sin(p * Math.PI) * 0.46 + state.pointerX * 0.06;
      const ty = 0.3 + p * 0.25 + state.pointerY * 0.05;
      const to = 0.55 + Math.sin(p * Math.PI) * 0.3;
      const k = 1 - Math.exp(-dt * 5);
      light.x += (tx - light.x) * k;
      light.y += (ty - light.y) * k;
      light.o += (to - light.o) * k;
      const el = glow.current;
      if (el) {
        el.style.transform = `translate3d(${(light.x - 0.5) * 100}vw, ${(light.y - 0.5) * 100}vh, 0)`;
        el.style.opacity = light.o.toFixed(3);
      }
      return (
        Math.abs(tx - light.x) > 0.001 ||
        Math.abs(ty - light.y) > 0.001 ||
        Math.abs(to - light.o) > 0.001
      );
    });

    return () => {
      unsubscribe();
      observer.disconnect();
      host.removeEventListener("pointermove", pointerWake);
      delete host.dataset.depth;
      for (const c of chapters) {
        c.node.style.removeProperty("--enter");
        c.node.style.removeProperty("--leave");
      }
      motion.current.velocity = 0;
    };
  }, [root, glow, motion, enabled]);
}
