"use client";
import { useLayoutEffect, type RefObject } from "react";

/** One observer drives CSS entrances; no text scroll listeners or frame loop. */
export function useEditorialTimeline(root: RefObject<HTMLDivElement | null>, enabled: boolean) {
  useLayoutEffect(() => {
    const host = root.current;
    if (!host || !enabled || !("IntersectionObserver" in window)) return;
    const chapters = Array.from(host.querySelectorAll<HTMLElement>("[data-editorial-chapter]"));
    for (const chapter of chapters) {
      let bodyIndex = 0, titleIndex = 0;
      const beats = chapter.querySelectorAll<HTMLElement>("[data-beat]");
      beats.forEach((node, index) => {
        const kind = index === 0 ? "label" : node.dataset.beat!;
        node.dataset.revealKind = kind;
        const delay = kind === "label" ? 0 : kind === "mask" ? 150 + titleIndex++ * 100
          : kind === "body" ? 300 + bodyIndex++ * 150 : 600;
        node.style.setProperty("--reveal-delay", `${delay}ms`);
      });
    }
    host.dataset.editorial = "true";
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        // Reset only after the whole section leaves; tall copy remains readable.
        (entry.target as HTMLElement).dataset.visible = String(entry.isIntersecting);
      }
    }, { threshold: 0 });
    chapters.forEach(chapter => observer.observe(chapter));
    return () => {
      observer.disconnect();
      delete host.dataset.editorial;
      for (const chapter of chapters) {
        delete chapter.dataset.visible;
        chapter.querySelectorAll<HTMLElement>("[data-beat]").forEach(node => {
          delete node.dataset.revealKind;
          node.style.removeProperty("--reveal-delay");
        });
      }
    };
  }, [root, enabled]);
}
