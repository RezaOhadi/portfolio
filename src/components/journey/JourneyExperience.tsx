"use client";

import "lenis/dist/lenis.css";
import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { MOBILE_QUERY, SEGMENTS, type QualityTier } from "./config";
import { SoundControls } from "./SoundControls";
import { useTextChoreography } from "./text/useTextChoreography";
import styles from "./journey.module.css";
import { PartLabels } from "./PartLabels";
import { journey } from "./store";
import { useJourneyScroll } from "./useJourneyScroll";

const JourneyCanvas = dynamic(() => import("./canvas/JourneyCanvas"), { ssr: false });

class CanvasBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFailure();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function pickTier(): QualityTier {
  if (window.matchMedia(MOBILE_QUERY).matches) return "low";
  const nav = navigator as Navigator & { deviceMemory?: number };
  if ((nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4) return "mid";
  return "high";
}

const BUILT = SEGMENTS.filter((s) => s.built).map((s) => s.id);

/**
 * The persistent world behind the home page. Content is server-rendered and
 * readable before (and without) WebGL; the canvas loads after first paint,
 * pauses whenever no built world is on screen, and falls back to a still
 * gradient if WebGL fails.
 */
export function JourneyExperience({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const [eventSource, setEventSource] = useState<HTMLElement | null>(null);
  const [tier, setTier] = useState<QualityTier | null>(null);
  const [prefersReduced, setPrefersReduced] = useState(false);
  const [mount, setMount] = useState(false);
  const [active, setActive] = useState(true);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [gateReady, setGateReady] = useState(false);
  const reduced = prefersReduced;

  useJourneyScroll(root, reduced);
  useTextChoreography(root, reduced, gateReady);

  // The sound threshold waits for the piano, but never longer than a few seconds.
  useEffect(() => {
    if (ready || failed) setGateReady(true);
    const t = window.setTimeout(() => setGateReady(true), 4500);
    return () => window.clearTimeout(t);
  }, [ready, failed]);

  useEffect(() => {
    journey.reduced = reduced;
  }, [reduced]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReduced(query.matches);
    update();
    query.addEventListener("change", update);
    const t = pickTier();
    journey.tier = t;
    journey.mobile = t === "low";
    setTier(t);
    setEventSource(root.current);
    // Let the first paint and hydration finish before the 3D chunk downloads.
    const handle = window.requestIdleCallback
      ? window.requestIdleCallback(() => setMount(true), { timeout: 800 })
      : window.setTimeout(() => setMount(true), 300);
    return () => {
      query.removeEventListener("change", update);
      (window.cancelIdleCallback ?? window.clearTimeout)(handle as number);
    };
  }, []);

  // Render only while a built world is on screen and the tab is visible.
  useEffect(() => {
    const host = root.current;
    if (!host) return;
    const visible = new Set<Element>();
    const update = () => setActive(visible.size > 0 && !document.hidden);
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => (entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target)));
      update();
    });
    BUILT.forEach((id) => {
      const node = host.querySelector(`[data-segment="${id}"]`);
      if (node) observer.observe(node);
    });
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  // Pointer in NDC; only a real mouse drives parallax, reveal and repulsion.
  useEffect(() => {
    const host = root.current;
    if (!host) return;
    const move = (event: PointerEvent) => {
      journey.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      journey.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
      journey.pointer.mouse = event.pointerType === "mouse";
    };
    const leave = () => {
      journey.pointer.mouse = false;
    };
    // Hovering (or focusing) a performance freezes the hammer world in bullet time.
    const cards = ".showcase-card, .media-card";
    // Entering a concert row strums a chord across the strings world.
    let row: Element | null = null;
    const over = (event: Event) => {
      const target = event.target as Element | null;
      journey.bullet = Boolean(target?.closest?.(cards));
      const next = target?.closest?.(".concert-row") ?? null;
      if (next && next !== row) window.dispatchEvent(new Event("journey:strum"));
      row = next;
    };
    host.addEventListener("pointerover", over);
    host.addEventListener("focusin", over);
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      host.removeEventListener("pointerover", over);
      host.removeEventListener("focusin", over);
      journey.bullet = false;
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, []);

  const onReady = useCallback(() => setReady(true), []);
  const onFailure = useCallback(() => {
    setFailed(true);
    setReady(false);
  }, []);

  return (
    <div
      ref={root}
      className={styles.journey}
      data-ready={ready && !failed}
      data-reduced={reduced}
      data-active={active}
    >
      <div className={styles.stage} aria-hidden="true">
        <div className={styles.fallback} />
        {mount && tier && eventSource && !failed && (
          <CanvasBoundary onFailure={onFailure}>
            <JourneyCanvas tier={tier} active={active} reduced={reduced} eventSource={eventSource} onReady={onReady} onFailure={onFailure} />
          </CanvasBoundary>
        )}
      </div>
      <PartLabels />
      <SoundControls ready={gateReady} />
      <div className={styles.content}>{children}</div>
    </div>
  );
}
