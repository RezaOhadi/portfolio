"use client";

import { useEffect, useRef } from "react";
import styles from "./journey.module.css";

interface Manifest {
  name: string;
  from: string;
  to: string;
  count: number;
  width: number;
  height: number;
  ext: string;
  bytes: number;
}

/** Decoded frames kept around the current one: each is a full-resolution bitmap (~17 MB). */
const AHEAD = 5;
const BEHIND = 2;
/** Frames fetched in parallel while the rest of the sequence streams in. */
const PARALLEL = 4;

/**
 * Phones and tablets: a stretch of the journey played as an image sequence that was
 * rendered offline at full desktop quality (scripts/capture-sequence.mjs). One canvas
 * draws the frame matching the scroll position; scroll stays native. The first frames
 * load at once, the rest stream in behind them; frames are decoded ahead of the scroll
 * with createImageBitmap and released once they fall behind.
 *
 * `onState` reports whether the sequence holds the stage (the live 3D rests) and
 * whether the live 3D should warm up because the end of the sequence is near.
 */
export function SequencePlayer({ name, onState }: { name: string; onState: (state: { holds: boolean; warm: boolean }) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const node = canvas.current;
    if (!node) return;
    let alive = true;
    let manifest: Manifest | null = null;
    const blobs: (Blob | null)[] = [];
    const bitmaps = new Map<number, ImageBitmap>();
    const decoding = new Set<number>();
    let range: [number, number] = [0, 1];
    let index = 0;
    let drawn = -1;
    let frame = 0;
    let last = { holds: true, warm: false };
    const base = `/sequence/${name}/`;
    const file = (i: number) => `${base}${String(i).padStart(4, "0")}.${manifest!.ext}`;
    const ctx = node.getContext("2d", { alpha: false });

    // Layout is read on load and resize only, never while scrolling.
    const measure = () => {
      if (!manifest) return;
      const a = document.querySelector<HTMLElement>(`[data-segment="${manifest.from}"]`);
      const b = document.querySelector<HTMLElement>(`[data-segment="${manifest.to}"]`);
      if (a && b) range = [a.offsetTop, b.offsetTop];
      const dpr = Math.min(window.devicePixelRatio || 1, manifest.width / Math.max(1, node.clientWidth));
      node.width = Math.round(node.clientWidth * dpr);
      node.height = Math.round(node.clientHeight * dpr);
      drawn = -1;
      onScroll();
    };

    const decode = (i: number) => {
      const blob = blobs[i];
      if (!blob || bitmaps.has(i) || decoding.has(i)) return;
      decoding.add(i);
      createImageBitmap(blob)
        .then((bitmap) => {
          decoding.delete(i);
          if (!alive) return bitmap.close();
          bitmaps.set(i, bitmap);
          if (Math.abs(i - index) <= AHEAD) schedule();
        })
        .catch(() => decoding.delete(i));
    };

    // Keep a small decoded window around the current frame, ahead in the scroll direction.
    let direction = 1;
    const keepWindow = () => {
      if (!manifest) return;
      const lo = Math.max(0, index - (direction > 0 ? BEHIND : AHEAD));
      const hi = Math.min(manifest.count - 1, index + (direction > 0 ? AHEAD : BEHIND));
      for (const [i, bitmap] of bitmaps) if (i < lo || i > hi) { bitmap.close(); bitmaps.delete(i); }
      decode(index);
      for (let k = 1; k <= AHEAD; k++) { decode(index + k * direction); if (k <= BEHIND) decode(index - k * direction); }
    };

    const draw = () => {
      frame = 0;
      if (!manifest || !ctx) return;
      keepWindow();
      // The exact frame if it is ready, else the nearest one that is.
      let pick = -1;
      for (let d = 0; d <= AHEAD + BEHIND && pick < 0; d++) {
        if (bitmaps.has(index - d)) pick = index - d;
        else if (bitmaps.has(index + d)) pick = index + d;
      }
      if (pick < 0 || pick === drawn) return;
      const bitmap = bitmaps.get(pick)!;
      // Cover the canvas, centred, like the live stage.
      const scale = Math.max(node.width / bitmap.width, node.height / bitmap.height);
      const sw = node.width / scale;
      const sh = node.height / scale;
      ctx.drawImage(bitmap, (bitmap.width - sw) / 2, (bitmap.height - sh) / 2, sw, sh, 0, 0, node.width, node.height);
      drawn = pick;
      if (pick !== index) schedule();
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };

    const onScroll = () => {
      if (!manifest) return;
      const y = window.scrollY;
      const p = Math.min(1, Math.max(0, (y - range[0]) / Math.max(1, range[1] - range[0])));
      const next = Math.round(p * (manifest.count - 1));
      if (next !== index) direction = next > index ? 1 : -1;
      index = next;
      const state = { holds: y < range[1], warm: p > 0.82 };
      if (state.holds !== last.holds || state.warm !== last.warm) {
        last = state;
        onState(state);
      }
      schedule();
    };

    // Progressive load: the first frames at once, then the rest in order, a few at a time.
    const load = async () => {
      const res = await fetch(`${base}manifest.json`);
      if (!res.ok) throw new Error("no sequence");
      manifest = (await res.json()) as Manifest;
      if (!alive) return;
      measure();
      let next = 0;
      const worker = async () => {
        while (alive && next < manifest!.count) {
          const i = next++;
          try {
            const r = await fetch(file(i));
            blobs[i] = await r.blob();
            if (Math.abs(i - index) <= AHEAD) schedule();
          } catch {
            /* a missed frame falls back to its neighbour */
          }
        }
      };
      await Promise.all(Array.from({ length: PARALLEL }, worker));
    };
    load().catch(() => onState({ holds: false, warm: true }));

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      bitmaps.forEach((b) => b.close());
      bitmaps.clear();
    };
  }, [name, onState]);

  return <canvas ref={canvas} className={styles.sequence} data-sequence aria-hidden />;
}
