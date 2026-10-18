import { SEGMENTS, type QualityTier } from "./config";

/**
 * Mutable, React-free journey state. Scroll writes it, the render loop reads
 * it. Nothing here triggers a re-render: continuous values never touch React.
 */
export interface JourneyState {
  /** Raw scroll progress per segment, 0..1, written by ScrollTrigger. */
  raw: Record<string, number>;
  /** Lenis scroll velocity in px/frame; drives aberration and kinetic effects. */
  velocity: number;
  /** Pointer in NDC (-1..1), plus whether a mouse is actually over the page. */
  pointer: { x: number; y: number; mouse: boolean };
  reduced: boolean;
  tier: QualityTier;
  /** A low-end mobile GPU (touch tier only): bloom stays off. */
  weakGpu: boolean;
  mobile: boolean;
  /** Phone layout: the biography copy stacked under the piano (config STACKED_QUERY). */
  stacked: boolean;
  /** A performance card is hovered: the hammer world goes into bullet time. */
  bullet: boolean;
  /** Part currently under the cursor in the exploded world. */
  hovered: string | null;
  sound: boolean;
}

export const journey: JourneyState = {
  raw: Object.fromEntries(SEGMENTS.map((s) => [s.id, 0])),
  velocity: 0,
  pointer: { x: 0, y: 0, mouse: false },
  reduced: false,
  tier: "high",
  weakGpu: false,
  mobile: false,
  stacked: false,
  hovered: null,
  bullet: false,
  sound: false,
};

type Listener = () => void;
const listeners = new Set<Listener>();

/** Discrete events only (hover changed, sound toggled), never per-frame values. */
export function emit() {
  listeners.forEach((listener) => listener());
}
export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** A rectangle of text dissolving into the scene, in CSS pixels. */
export interface SparkBurst {
  x: number;
  y: number;
  w: number;
  h: number;
  count: number;
}
/** Consumed by the canvas spark system each frame. */
export const sparkQueue: SparkBurst[] = [];

export function emitSparks(x: number, y: number, w: number, h: number, count: number) {
  if (journey.reduced || sparkQueue.length > 24) return;
  sparkQueue.push({ x, y, w, h, count });
}

export const clamp01 =(v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
/** Remap v from [a, b] into 0..1. */
export const range = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));
