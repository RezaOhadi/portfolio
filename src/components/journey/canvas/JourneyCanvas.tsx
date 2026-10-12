"use client";

import { Environment, Lightformer, PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HalfFloatType, WebGLRenderTarget, type DirectionalLight, type Light, type Object3D, type PointLight } from "three";
import { PALETTE, QUALITY, type QualityTier } from "../config";
import { journey } from "../store";
import { CameraDirector } from "./CameraDirector";
import { Effects } from "./Effects";
import { PianoParts } from "./PianoParts";
import { ParticleField } from "./particles/ParticleField";
import { Sparks } from "./Sparks";
import { RimLight } from "./RimLight";
import { FlashVeil } from "./FlashVeil";
import { Corridor } from "./stages/Corridor";
import { Hammers } from "./stages/Hammers";
import { Strings } from "./stages/Strings";
import { Portal } from "./stages/Portal";
import { Soundboard } from "./stages/Soundboard";
import { Atmosphere } from "./Atmosphere";
import { buildPiano } from "./piano/build";
import { stepRig, rig } from "./rig";
import { materialOptions, touchQuality } from "./quality";

interface Props {
  tier: QualityTier;
  active: boolean;
  reduced: boolean;
  eventSource: HTMLElement;
  onReady: () => void;
  onFailure: () => void;
}

declare global {
  interface Window {
    __journey?: { fps: number; frames: number; dpr: number; tier: QualityTier; dof: boolean; step?: number };
  }
}

/** Advances the choreography first, and reports frame stats for verification. */
function RigStep({ onReady }: { onReady: () => void }) {
  const stats = useRef({ frames: 0, acc: 0, count: 0, sent: false, opacity: "" });
  useFrame((state, delta) => {
    stepRig(state.clock.elapsedTime, Math.min(delta, 1 / 20));
    // The whole world recedes as the next (not yet built) world's content arrives.
    const layer = state.gl.domElement.parentElement;
    const opacity = (1 - rig.after * 0.88).toFixed(3);
    // Written only when it changes: a style write every frame invalidates style for the page.
    if (layer && stats.current.opacity !== opacity) {
      layer.style.opacity = opacity;
      stats.current.opacity = opacity;
    }
    const s = stats.current;
    s.frames++;
    s.acc += delta;
    s.count++;
    if (s.acc >= 1) {
      window.__journey = { ...(window.__journey as NonNullable<Window["__journey"]>), fps: Math.round(s.count / s.acc), frames: s.frames };
      s.acc = 0;
      s.count = 0;
    }
    if (!s.sent && s.frames > 2) {
      s.sent = true;
      onReady();
      if (process.env.NODE_ENV !== "production") {
        (window as unknown as Record<string, unknown>).__journeyScene = state.scene;
        (window as unknown as Record<string, unknown>).__journeyDebug = () => ({
          rig: { ...rig, focus: rig.focus.toArray() },
          raw: { ...journey.raw },
          camera: state.camera.position.toArray(),
          projection: state.camera.projectionMatrix.elements.slice(),
        });
      }
    }
  }, -3);
  return null;
}

/**
 * Adaptive quality: when frames drop, step the pixel ratio down first, then
 * drop depth of field; recover the same way when there is headroom.
 */
function Governor({ tier, dofOn }: { tier: QualityTier; dofOn: { current: boolean } }) {
  if (tier === "touch") return <TouchGovernor />;
  return <DesktopGovernor tier={tier} dofOn={dofOn} />;
}

/**
 * Phones and tablets: when frames stay under 50 fps for a second, step down
 * (internal resolution 1x to 0.85x, then fewer particles, then no bloom). Never back up
 * mid-visit, so the picture does not shift while scrolling.
 */
const TOUCH_DPR = QUALITY.touch.dpr[1];

function TouchGovernor() {
  const setDpr = useThree((s) => s.setDpr);
  const step = useRef(0);
  const report = () =>
    (window.__journey = { ...(window.__journey as NonNullable<Window["__journey"]>), dpr: step.current > 0 ? QUALITY.touch.dpr[0] : Math.min(window.devicePixelRatio || 1, TOUCH_DPR), tier: "touch", dof: false, step: step.current });
  useEffect(() => {
    touchQuality.particles = 1;
    touchQuality.bloom = !journey.weakGpu;
    setDpr(Math.min(window.devicePixelRatio || 1, TOUCH_DPR));
    report();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <PerformanceMonitor
      ms={250}
      iterations={4}
      threshold={0.75}
      bounds={() => [50, 1000]}
      onDecline={() => {
        step.current++;
        if (step.current === 1) setDpr(QUALITY.touch.dpr[0]);
        if (step.current === 2) touchQuality.particles = 0.6;
        if (step.current === 3) touchQuality.bloom = false;
        report();
      }}
    />
  );
}

function DesktopGovernor({ tier, dofOn }: { tier: QualityTier; dofOn: { current: boolean } }) {
  const setDpr = useThree((s) => s.setDpr);
  const profile = QUALITY[tier];
  const level = useRef(1);
  const apply = () => {
    const [min, max] = profile.dpr;
    const dpr = Math.min(window.devicePixelRatio || 1, min + (max - min) * level.current);
    setDpr(dpr);
    dofOn.current = profile.dof && level.current > 0.45;
    window.__journey = { ...(window.__journey as NonNullable<Window["__journey"]>), dpr, tier, dof: profile.dof && level.current > 0.45 };
  };
  useEffect(apply, [tier]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <PerformanceMonitor
      flipflops={4}
      onDecline={() => {
        level.current = Math.max(0, level.current - 0.34);
        apply();
      }}
      onIncline={() => {
        level.current = Math.min(1, level.current + 0.34);
        apply();
      }}
    />
  );
}

/**
 * Phones keep two dynamic lights: the gold back light and one stage lamp. The
 * stages' own lamps stay in the scene but hidden (so the light count never
 * changes), and the brightest of them is mirrored into this one light.
 */
function StageLamp() {
  const lamp = useRef<PointLight>(null);
  const sources = useRef<Light[]>([]);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const found: Light[] = [];
    scene.traverse((o) => {
      if (o.userData.stageLamp) found.push(o as Light);
    });
    sources.current = found;
  }, [scene]);
  useFrame(() => {
    const out = lamp.current;
    if (!out) return;
    let best: Light | null = null;
    let level = 0;
    for (const l of sources.current) {
      const v = l.intensity * (l.userData.stageLamp as number);
      if (v > level) {
        level = v;
        best = l;
      }
    }
    out.intensity = level;
    if (!best) return;
    out.position.copy(best.position);
    out.color.copy(best.color);
    const p = best as PointLight;
    out.distance = p.distance;
    out.decay = p.decay;
  });
  return <pointLight ref={lamp} intensity={0} />;
}

/** Studio lights for the piano worlds; they dim with the atmosphere inside closed stages. */
function Lights({ touch }: { touch: boolean }) {
  const back = useRef<DirectionalLight>(null);
  const side = useRef<DirectionalLight>(null);
  const key = useRef<DirectionalLight>(null);
  useFrame(() => {
    if (back.current) back.current.intensity = 3.2 * rig.studio;
    if (side.current) side.current.intensity = 1.1 * rig.studio;
    if (key.current) key.current.intensity = 0.75 * (0.25 + rig.studio * 0.75);
  });
  return (
    <>
      <ambientLight intensity={touch ? 0.16 : 0.05} color={PALETTE.ivory} />
      {/* Gold rim light from behind the instrument. */}
      <directionalLight ref={back} position={[-4.5, 3.4, -6]} intensity={3.2} color="#e9bd84" />
      {touch ? (
        // Phones: the side and key lights become a little more ambient fill; the lamp is the second light.
        <StageLamp />
      ) : (
        <>
          <directionalLight ref={side} position={[5, 2.2, -4]} intensity={1.1} color={PALETTE.gold} />
          <directionalLight ref={key} position={[2.5, 6, 4.5]} intensity={0.75} color={PALETTE.ivory} />
        </>
      )}
    </>
  );
}

function Studio({ resolution }: { resolution: number }) {
  // Lightformers paint long warm reflections into the black lacquer.
  return (
    <Environment resolution={resolution} frames={1} environmentIntensity={0.85}>
      <Lightformer form="rect" intensity={2.4} color={PALETTE.goldHot} position={[0, 5, -1]} rotation-x={Math.PI / 2} scale={[12, 1.1, 1]} />
      <Lightformer form="rect" intensity={1.5} color={PALETTE.gold} position={[-6, 2, 1]} rotation-y={Math.PI / 2} scale={[1, 7, 1]} />
      <Lightformer form="rect" intensity={1.1} color={PALETTE.ivory} position={[6, 2.5, 2]} rotation-y={-Math.PI / 2} scale={[1, 4, 1]} />
      <Lightformer form="ring" intensity={1.8} color={PALETTE.gold} position={[0, 2.8, 7]} scale={2.6} />
    </Environment>
  );
}

function Scene({ tier, onReady }: { tier: QualityTier; onReady: () => void }) {
  const dofOn = useRef(QUALITY[tier].dof);
  const parts = useMemo(() => {
    const t = performance.now();
    const built = buildPiano();
    performance.measure("journey:buildPiano", { start: t, end: performance.now() });
    return built;
  }, []);
  const profile = QUALITY[tier];
  const touch = tier === "touch";
  useEffect(
    () => () => {
      parts.forEach((part) => {
        part.materials.forEach((m) => m.material.dispose());
        part.group.traverse((o) => {
          const mesh = o as { geometry?: { dispose(): void } };
          mesh.geometry?.dispose();
        });
      });
    },
    [parts],
  );
  return (
    <>
      <color attach="background" args={[PALETTE.ink]} />
      <fog attach="fog" args={[PALETTE.ink, 9, 26]} />
      <RigStep onReady={onReady} />
      <Governor tier={tier} dofOn={dofOn} />
      <CameraDirector />
      <Studio resolution={profile.envResolution} />
      <Lights touch={touch} />
      {!touch && <RimLight />}
      <PianoParts parts={parts} />
      <ParticleField parts={parts} size={profile.particles} />
      <Sparks />
      <Atmosphere />
      <Corridor />
      <Hammers />
      <Strings />
      <Portal />
      <Soundboard />
      <FlashVeil />
      <Effects dof={profile.dof} dofOn={dofOn} multisampling={profile.multisampling} lite={touch} />
    </>
  );
}

export default function JourneyCanvas({ tier, active, reduced, eventSource, onReady, onFailure }: Props) {
  // Read by every material built below (the piano, then each stage).
  materialOptions.lite = tier === "touch";
  const [compiled, setCompiled] = useState(false);
  const onCompiled = useCallback(() => setCompiled(true), []);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const node = canvas.current;
    if (!node) return;
    const lost = (event: Event) => {
      event.preventDefault();
      onFailure();
    };
    node.addEventListener("webglcontextlost", lost);
    return () => node.removeEventListener("webglcontextlost", lost);
  }, [onFailure]);

  // Reduced motion renders on demand: one still frame whenever the world changes.
  const frameloop = !active || !compiled ? "never" : reduced ? "demand" : "always";

  return (
    <Canvas
      ref={canvas}
      eventSource={eventSource}
      eventPrefix="client"
      frameloop={frameloop}
      dpr={QUALITY[tier].dpr}
      gl={{ antialias: false, alpha: false, stencil: false, depth: true, powerPreference: "high-performance" }}
      camera={{ fov: 30, near: 0.1, far: 60, position: [4, 1.4, 4] }}
      onCreated={({ gl }) => {
        gl.setClearColor(PALETTE.ink);
        rig.time = 0;
      }}
    >
      <Scene tier={tier} onReady={onReady} />
      {!compiled && <Precompile onDone={onCompiled} />}
      {reduced && compiled && <DemandRenderer />}
    </Canvas>
  );
}

/**
 * Before the first frame, compile every world's shader programs off the main
 * thread (KHR_parallel_shader_compile) and upload every texture and buffer, so
 * no world ever stalls the first time it appears. The stages start hidden, and
 * a hidden object is skipped by both compile and render, so everything is shown
 * for the warm-up and put back after. The warm-up renders into a half-float
 * target like the composer's, so the compiled variants are the ones in use.
 */
function Precompile({ onDone }: { onDone: () => void }) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    let cancelled = false;
    const t = performance.now();
    const hidden: Object3D[] = [];
    const culled: Object3D[] = [];
    scene.traverse((o) => {
      // Lights keep their state: a hidden lamp (phones mirror them) must not count while compiling.
      if (!o.visible && !(o as Light).isLight) hidden.push(o);
      if (o.frustumCulled) culled.push(o);
    });
    const target = new WebGLRenderTarget(64, 64, { type: HalfFloatType });
    const reveal = (on: boolean) => {
      hidden.forEach((o) => (o.visible = on));
      culled.forEach((o) => (o.frustumCulled = !on));
    };
    reveal(true);
    gl.setRenderTarget(target);
    gl.compileAsync(scene, camera)
      .catch(() => undefined)
      .then(() => {
        if (cancelled) return;
        reveal(true);
        gl.setRenderTarget(target);
        gl.render(scene, camera);
      })
      .catch(() => undefined)
      .finally(() => {
        reveal(false);
        gl.setRenderTarget(null);
        target.dispose();
        performance.measure("journey:compile", { start: t, end: performance.now() });
        if (!cancelled) onDone();
      });
    gl.setRenderTarget(null);
    reveal(false);
    return () => {
      cancelled = true;
    };
  }, [gl, scene, camera, onDone]);
  return null;
}

/** In reduced motion, re-render a few frames when the snapped world changes. */
function DemandRenderer() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    let last = "";
    let frame = 0;
    const tick = () => {
      // Every segment, in 5% steps: the still frame follows the visitor through all seven worlds.
      const key = Object.values(journey.raw)
        .map((v) => Math.round(v * 20))
        .join("|");
      if (key !== last) {
        last = key;
        invalidate(4);
      }
      frame = requestAnimationFrame(tick);
    };
    invalidate(6);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [invalidate]);
  return null;
}
