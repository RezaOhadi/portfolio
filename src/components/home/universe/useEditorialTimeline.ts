"use client";
import { useEffect, type RefObject } from "react";
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const ease = (n: number) => n * n * (3 - 2 * n);

/** Event-driven DOM animation; no per-frame React updates or scroll interception. */
export function useEditorialTimeline(root: RefObject<HTMLDivElement | null>, enabled: boolean) {
  useEffect(() => {
    const host = root.current;
    if (!host || !enabled) return;
    const chapters = Array.from(host.querySelectorAll<HTMLElement>("[data-editorial-chapter]")).map(element => ({
      element, panel: element.querySelector<HTMLElement>("[data-text-plane]")!,
      top: 0, span: 1, current: 0, target: 0,
      beats: Array.from(element.querySelectorAll<HTMLElement>("[data-beat]")).map(node => ({ node, enter: Number(node.dataset.enter), exit: Number(node.dataset.exit) })),
    }));
    let frame = 0, previous = 0, x = 0, y = 0, targetX = 0, targetY = 0;
    let disposed = false;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const tick = (time: number) => {
      frame = 0;
      if (document.hidden) return;
      const dt = Math.min((time - (previous || time - 16)) / 1000, 0.05);
      previous = time;
      const alpha = 1 - Math.exp(-dt / 0.18);
      x += (targetX - x) * (1 - Math.exp(-dt / 0.22));
      y += (targetY - y) * (1 - Math.exp(-dt / 0.22));
      let unsettled = Math.abs(x - targetX) + Math.abs(y - targetY) > 0.002;
      for (const chapter of chapters) {
        chapter.current += (chapter.target - chapter.current) * alpha;
        unsettled ||= Math.abs(chapter.target - chapter.current) > 0.0001;
        chapter.panel.style.setProperty("--tilt-x", `${(-y * 1.5).toFixed(3)}deg`);
        chapter.panel.style.setProperty("--tilt-y", `${(x * 1.5).toFixed(3)}deg`);
        for (const beat of chapter.beats) {
          const enter = ease(clamp((chapter.current - beat.enter) / 0.12));
          const exit = ease(clamp((chapter.current - beat.exit) / 0.12));
          beat.node.style.setProperty("--enter", enter.toFixed(4));
          beat.node.style.setProperty("--exit", exit.toFixed(4));
          beat.node.style.pointerEvents = enter > 0.9 && exit < 0.1 ? "" : "none";
        }
      }
      if (unsettled) frame = requestAnimationFrame(tick);
    };
    const wake = () => { if (!frame && !document.hidden && !disposed) { previous = 0; frame = requestAnimationFrame(tick); } };
    const scroll = () => {
      chapters.forEach((chapter, index) => { chapter.target = clamp((window.scrollY - chapter.top + 100) / chapter.span + (index === 0 ? 0.13 : 0)); });
      wake();
    };
    const measure = () => {
      for (const chapter of chapters) {
        const height = chapter.panel.offsetHeight;
        chapter.element.style.setProperty("--panel-height", `${height}px`);
        chapter.element.style.setProperty("--pin-top", `${Math.min(100, window.innerHeight - height - 30)}px`);
      }
      for (const chapter of chapters) {
        chapter.top = chapter.element.getBoundingClientRect().top + window.scrollY;
        chapter.span = Math.max(1, chapter.element.offsetHeight - window.innerHeight);
      }
      scroll();
    };
    const pointer = (event: PointerEvent) => {
      if (!finePointer.matches || event.pointerType !== "mouse") return;
      targetX = Math.max(-1, Math.min(1, event.clientX / window.innerWidth * 2 - 1));
      targetY = Math.max(-1, Math.min(1, event.clientY / window.innerHeight * 2 - 1));
      wake();
    };
    const leave = () => { targetX = 0; targetY = 0; wake(); };
    const restore = () => { measure(); chapters.forEach(c => { c.current = c.target; }); wake(); };
    const visibility = () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else restore(); };
    const resize = new ResizeObserver(measure);
    chapters.forEach(({ panel }) => resize.observe(panel));
    host.dataset.editorial = "true";
    restore();
    void document.fonts.ready.then(() => { if (!disposed) measure(); });
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", measure);
    window.addEventListener("pageshow", restore);
    document.addEventListener("visibilitychange", visibility);
    host.addEventListener("pointermove", pointer);
    host.addEventListener("pointerleave", leave);
    return () => {
      disposed = true; cancelAnimationFrame(frame); resize.disconnect();
      window.removeEventListener("scroll", scroll); window.removeEventListener("resize", measure); window.removeEventListener("pageshow", restore);
      document.removeEventListener("visibilitychange", visibility);
      host.removeEventListener("pointermove", pointer); host.removeEventListener("pointerleave", leave);
      delete host.dataset.editorial;
      chapters.forEach(({ element, panel, beats }) => {
        element.style.removeProperty("--panel-height"); element.style.removeProperty("--pin-top");
        panel.style.removeProperty("--tilt-x"); panel.style.removeProperty("--tilt-y");
        beats.forEach(({ node }) => { node.style.removeProperty("--enter"); node.style.removeProperty("--exit"); node.style.pointerEvents = ""; });
      });
    };
  }, [root, enabled]);
}
