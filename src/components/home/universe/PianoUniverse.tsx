"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { HomeUniverseData } from "@/lib/data/home-universe";
import type { JourneyMotion } from "./CameraRig";
import { JourneyContent } from "./JourneyContent";
import styles from "./universe.module.css";
import { useEditorialTimeline } from "./useEditorialTimeline";

const UniverseCanvas = dynamic(() => import("./UniverseCanvas"), { ssr: false });

class CanvasBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export function PianoUniverse({ data }: { data: HomeUniverseData }) {
  const root = useRef<HTMLDivElement>(null);
  const motion = useRef<JourneyMotion>({ progress: 0, pointerX: 0, pointerY: 0, snap: true });
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [staticMode, setStaticMode] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [active, setActive] = useState(true);
  const [selected, setSelected] = useState(0);
  const onFailure = useCallback(() => { setFailed(true); setReady(false); }, []);
  const onReady = useCallback(() => setReady(true), []);
  const onIntroComplete = useCallback(() => setIntroComplete(true), []);

  useEffect(() => {
    if (introComplete || allowed === false || staticMode || failed) return;
    if (window.scrollY > 100 || (location.hash && location.hash !== "#home")) {
      setIntroComplete(true);
      return;
    }
    // Native scrolling stays available during the prelude, including momentum.
    // A failed import or stalled GPU must never leave content hidden.
    const timeout = window.setTimeout(() => { setIntroComplete(true); setFailed(true); }, 10000);
    return () => {
      clearTimeout(timeout);
    };
  }, [introComplete, allowed, staticMode, failed]);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      // Let the actual renderer determine support without allocating a second
      // GPU context on memory-constrained phones and tablets.
      setAllowed(!preference.matches);
    };
    update();
    preference.addEventListener("change", update);
    return () => { preference.removeEventListener("change", update); };
  }, []);

  useEffect(() => {
    // Quality selection never disables WebGL or the editorial timeline.
    const screen = window.matchMedia("(max-width: 1024px), (any-pointer: coarse)");
    const update = () => setMobile(screen.matches);
    update();
    screen.addEventListener("change", update);
    return () => screen.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    let visible = true;
    let top = 0, span = 1;
    const updateActive = () => setActive(visible && !document.hidden);
    // Scroll events read only the scroll offset; layout is cached on resize.
    const scroll = () => {
      motion.current.progress = Math.max(0, Math.min(1, (window.scrollY - top) / span));
    };
    const measure = () => {
      const rect = node.getBoundingClientRect();
      top = rect.top + window.scrollY;
      span = Math.max(1, node.offsetHeight - window.innerHeight);
      scroll();
    };
    const snap = () => { measure(); motion.current.snap = true; };
    const pointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      motion.current.pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
      motion.current.pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
    };
    const resetPointer = () => { motion.current.pointerX = 0; motion.current.pointerY = 0; };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; updateActive(); });
    const resize = new ResizeObserver(measure);
    observer.observe(node); resize.observe(node);
    window.addEventListener("scroll", scroll, { passive: true });
    // Native scroll includes touch and momentum; never intercept touchmove.
    window.addEventListener("resize", measure);
    window.addEventListener("hashchange", snap);
    window.addEventListener("pageshow", snap);
    document.addEventListener("visibilitychange", updateActive);
    node.addEventListener("pointermove", pointer);
    node.addEventListener("pointerleave", resetPointer);
    snap(); updateActive();
    return () => {
      observer.disconnect(); resize.disconnect();
      window.removeEventListener("scroll", scroll); window.removeEventListener("resize", measure);
      window.removeEventListener("hashchange", snap); window.removeEventListener("pageshow", snap);
      document.removeEventListener("visibilitychange", updateActive);
      node.removeEventListener("pointermove", pointer); node.removeEventListener("pointerleave", resetPointer);
    };
  }, []);

  const enabled = allowed && !staticMode && !failed;
  useEditorialTimeline(root, Boolean(enabled && ready && introComplete));
  return <div ref={root} className={styles.universe} data-intro={introComplete ? "complete" : "pending"} data-enhanced={Boolean(enabled && ready)} data-static={allowed === false || staticMode || failed}>
    <div className={styles.stage} aria-hidden="true">
      <div className={styles.fallbackArt} />
      {enabled && <CanvasBoundary onFailure={onFailure}>
        <UniverseCanvas motion={motion} mobile={mobile} active={active} selected={selected}
          workCount={data.works.length} onReady={onReady} onFailure={onFailure} onIntroComplete={onIntroComplete} />
      </CanvasBoundary>}
    </div>
    <div className={styles.content}>
      <div className={styles.controls}>
        <span>The Piano Universe · A prelude</span>
        {allowed && !failed && <button type="button" aria-pressed={staticMode} onClick={() => { setStaticMode(!staticMode); setReady(false); motion.current.snap = true; }}>
          {staticMode ? "Enable motion" : "Reduce motion"}
        </button>}
      </div>
      <JourneyContent data={data} selected={selected} onSelect={setSelected} />
    </div>
  </div>;
}
