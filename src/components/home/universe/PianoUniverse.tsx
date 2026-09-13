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
  const [mobile, setMobile] = useState(false);
  const [active, setActive] = useState(true);
  const [selected, setSelected] = useState(0);
  const onFailure = useCallback(() => { setFailed(true); setReady(false); }, []);
  const onReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const screen = window.matchMedia("(max-width: 760px)");
    const update = () => {
      setMobile(screen.matches);
      if (preference.matches) { setAllowed(false); return; }
      // Probe before importing the renderer. Release the temporary GPU context.
      const probe = document.createElement("canvas");
      try {
        const gl = probe.getContext("webgl2");
        setAllowed(Boolean(gl));
        gl?.getExtension("WEBGL_lose_context")?.loseContext();
      } catch { setAllowed(false); }
    };
    update();
    preference.addEventListener("change", update);
    screen.addEventListener("change", update);
    return () => { preference.removeEventListener("change", update); screen.removeEventListener("change", update); };
  }, []);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    let visible = true;
    const updateActive = () => setActive(visible && !document.hidden);
    const measure = () => {
      const rect = node.getBoundingClientRect();
      motion.current.progress = Math.max(0, Math.min(1, -rect.top / Math.max(1, node.offsetHeight - window.innerHeight)));
    };
    const snap = () => { measure(); motion.current.snap = true; };
    const pointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      motion.current.pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
      motion.current.pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
    };
    const resetPointer = () => { motion.current.pointerX = 0; motion.current.pointerY = 0; };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; updateActive(); });
    const resize = new ResizeObserver(snap);
    observer.observe(node); resize.observe(node);
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", snap);
    window.addEventListener("hashchange", snap);
    window.addEventListener("pageshow", snap);
    document.addEventListener("visibilitychange", updateActive);
    node.addEventListener("pointermove", pointer);
    node.addEventListener("pointerleave", resetPointer);
    snap(); updateActive();
    return () => {
      observer.disconnect(); resize.disconnect();
      window.removeEventListener("scroll", measure); window.removeEventListener("resize", snap);
      window.removeEventListener("hashchange", snap); window.removeEventListener("pageshow", snap);
      document.removeEventListener("visibilitychange", updateActive);
      node.removeEventListener("pointermove", pointer); node.removeEventListener("pointerleave", resetPointer);
    };
  }, []);

  const enabled = allowed && !staticMode && !failed;
  useEditorialTimeline(root, Boolean(enabled && ready));
  return <div ref={root} className={styles.universe} data-enhanced={Boolean(enabled && ready)} data-static={allowed === false || staticMode || failed}>
    <div className={styles.stage} aria-hidden="true">
      <div className={styles.fallbackArt} />
      {enabled && <CanvasBoundary onFailure={onFailure}>
        <UniverseCanvas motion={motion} mobile={mobile} active={active} selected={selected}
          workCount={data.works.length} onReady={onReady} onFailure={onFailure} />
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
