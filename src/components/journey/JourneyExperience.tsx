"use client";

import "lenis/dist/lenis.css";
import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { forcedQuality, isStrongDevice, isTouchDevice, isWeakGpu, LITE_FPS, MOBILE_QUERY, POSTER_FPS, POSTER_FPS_STRONG, SEGMENTS, type QualityTier, type QualityVerdict } from "./config";
import { SoundControls } from "./SoundControls";
import { useTextChoreography } from "./text/useTextChoreography";
import styles from "./journey.module.css";
import { PartLabels } from "./PartLabels";
import { emitSparks, journey } from "./store";
import { playCadence } from "./audio";
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
  if (isTouchDevice()) return "touch";
  if (window.matchMedia(MOBILE_QUERY).matches) return "low";
  const nav = navigator as Navigator & { deviceMemory?: number };
  if ((nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4) return "mid";
  return "high";
}

/** The probe's verdict is kept for the session: a revisit skips straight to it. */
const VERDICT_KEY = "journey:quality";

function readVerdict(): QualityVerdict | null {
  try {
    const value = window.sessionStorage.getItem(VERDICT_KEY);
    return value === "lite" || value === "poster" ? value : null;
  } catch {
    return null;
  }
}

function keepVerdict(value: QualityVerdict) {
  try {
    window.sessionStorage.setItem(VERDICT_KEY, value);
  } catch {
    /* private mode: measured again next time */
  }
}

const BUILT = SEGMENTS.filter((s) => s.built).map((s) => s.id);
/** Running text the world should step back for (titles and taglines are big enough not to need it). */
const COPY = `[data-fx="body"], .${styles.works} li, .concert-row, .media-card p, .contact-grid form, [data-fx="block"] > .container-editorial p`;

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
  const [menuOpen, setMenuOpen] = useState(false);
  const reduced = prefersReduced;
  // The still version: the poster behind the page instead of the live scene.
  // Taken for reduced motion, and when the first seconds ran under POSTER_FPS.
  const [poster, setPoster] = useState(false);
  const still = reduced || poster;
  // "first": measuring the chosen tier; "second": measuring the lite tier; "done": settled.
  const probeStage = useRef<"first" | "second" | "done">("first");
  const [probing, setProbing] = useState(true);

  const [copyReady, setCopyReady] = useState(false);
  useJourneyScroll(root, reduced);
  useTextChoreography(root, reduced, copyReady);

  // The sound threshold waits for the piano, but never longer than a few seconds.
  useEffect(() => {
    if (ready || failed) setGateReady(true);
    const t = window.setTimeout(() => setGateReady(true), 4500);
    return () => window.clearTimeout(t);
  }, [ready, failed]);

  // The copy never waits on the 3D download: it enters with the piano when the piano
  // is quick, and on its own a moment after hydration when the connection is slow.
  useEffect(() => {
    if (ready || failed) setCopyReady(true);
    const t = window.setTimeout(() => setCopyReady(true), 700);
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
    let t = pickTier();
    // A verdict from earlier in the session (or a test flag) stands; nothing is measured again.
    const verdict = forcedQuality() ?? readVerdict();
    if (verdict === "poster") setPoster(true);
    if (verdict === "lite") t = "lite";
    if (verdict) {
      probeStage.current = "done";
      setProbing(false);
    }
    journey.tier = t;
    journey.mobile = t === "low" || t === "touch";
    journey.weakGpu = t === "touch" && isWeakGpu();
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

  // The full-screen menu covers the stage: the render loop rests so the menu opens at
  // full speed. The canvas stays visible underneath, holding its last frame.
  useEffect(() => {
    const onMenu = (event: Event) => setMenuOpen(Boolean((event as CustomEvent<boolean>).detail));
    window.addEventListener("site:menu", onMenu);
    return () => window.removeEventListener("site:menu", onMenu);
  }, []);

  // Body copy in the middle band of the screen dims the world under it (see .dim).
  useEffect(() => {
    const host = root.current;
    if (!host) return;
    const reading = new Set<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => (entry.isIntersecting ? reading.add(entry.target) : reading.delete(entry.target)));
        host.dataset.copy = String(reading.size > 0);
      },
      { rootMargin: "-28% 0px -28% 0px" },
    );
    host.querySelectorAll(COPY).forEach((node) => observer.observe(node));
    return () => observer.disconnect();
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
    // A message sent from the contact form is answered by a closing cadence and a shower of gold.
    const submitted = (event: Event) => {
      const form = (event.target as Element | null)?.closest?.("#contact form");
      if (!form) return;
      playCadence();
      const r = form.getBoundingClientRect();
      emitSparks(r.left + r.width / 2, r.top + r.height / 2, r.width, r.height, 120);
    };
    host.addEventListener("submit", submitted);
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      host.removeEventListener("pointerover", over);
      host.removeEventListener("focusin", over);
      host.removeEventListener("submit", submitted);
      journey.bullet = false;
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, []);

  // Without a live scene there is nothing to wait for: the copy and the sound threshold go ahead.
  useEffect(() => {
    if (still) setReady(true);
  }, [still]);

  // The FPS monitor's verdict: under LITE_FPS step down once and measure again,
  // under POSTER_FPS at either step show the still version instead.
  const onVerdict = useCallback((fps: number) => {
    const stage = probeStage.current;
    if (stage === "done") return;
    // A strong device is never stepped down; the poster is only for a scene that cannot run at all.
    const strong = isStrongDevice();
    if (fps < (strong ? POSTER_FPS_STRONG : POSTER_FPS)) {
      probeStage.current = "done";
      keepVerdict("poster");
      setPoster(true);
      setProbing(false);
      return;
    }
    if (stage === "first" && !strong && fps < LITE_FPS) {
      probeStage.current = "second";
      keepVerdict("lite");
      journey.tier = "lite";
      setTier("lite");
      return;
    }
    probeStage.current = "done";
    if (stage === "first") keepVerdict("full");
    setProbing(false);
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
      data-poster={still}
    >
      <div className={styles.stage} aria-hidden="true">
        <div className={styles.fallback} />
        {/* The still version never loads the 3D chunk. A tier change remounts the
            canvas, so the lighter scene is built fresh rather than rebuilt in place. */}
        {mount && tier && eventSource && !failed && !still && (
          <CanvasBoundary onFailure={onFailure}>
            <JourneyCanvas key={tier} tier={tier} active={active && !menuOpen} reduced={reduced} eventSource={eventSource} onReady={onReady} onFailure={onFailure} probe={probing} onVerdict={onVerdict} />
          </CanvasBoundary>
        )}
        <div className={styles.dim} />
      </div>
      <PartLabels />
      <SoundControls ready={gateReady} />
      <div className={styles.content}>{children}</div>
    </div>
  );
}
