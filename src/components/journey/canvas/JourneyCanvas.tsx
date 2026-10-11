"use client";

import { Environment, Lightformer, PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DirectionalLight } from "three";
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
    __journey?: { fps: number; frames: number; dpr: number; tier: QualityTier; dof: boolean };
  }
}

/** Advances the choreography first, and reports frame stats for verification. */
function RigStep({ onReady }: { onReady: () => void }) {
  const stats = useRef({ frames: 0, acc: 0, count: 0, sent: false });
  useFrame((state, delta) => {
    stepRig(state.clock.elapsedTime, Math.min(delta, 1 / 20));
    // The whole world recedes as the next (not yet built) world's content arrives.
    const layer = state.gl.domElement.parentElement;
    if (layer) layer.style.opacity = (1 - rig.after * 0.88).toFixed(3);
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
function Governor({ tier, setDof }: { tier: QualityTier; setDof: (on: boolean) => void }) {
  const setDpr = useThree((s) => s.setDpr);
  const profile = QUALITY[tier];
  const level = useRef(1);
  const apply = () => {
    const [min, max] = profile.dpr;
    const dpr = Math.min(window.devicePixelRatio || 1, min + (max - min) * level.current);
    setDpr(dpr);
    setDof(profile.dof && level.current > 0.45);
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

/** Studio lights for the piano worlds; they dim with the atmosphere inside closed stages. */
function Lights() {
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
      <ambientLight intensity={0.05} color={PALETTE.ivory} />
      {/* Gold rim light from behind the instrument. */}
      <directionalLight ref={back} position={[-4.5, 3.4, -6]} intensity={3.2} color="#e9bd84" />
      <directionalLight ref={side} position={[5, 2.2, -4]} intensity={1.1} color={PALETTE.gold} />
      <directionalLight ref={key} position={[2.5, 6, 4.5]} intensity={0.75} color={PALETTE.ivory} />
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

function Scene({ tier, setDof, dof, onReady }: { tier: QualityTier; setDof: (on: boolean) => void; dof: boolean; onReady: () => void }) {
  const parts = useMemo(() => {
    const t = performance.now();
    const built = buildPiano();
    performance.measure("journey:buildPiano", { start: t, end: performance.now() });
    return built;
  }, []);
  const profile = QUALITY[tier];
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
      <Governor tier={tier} setDof={setDof} />
      <CameraDirector />
      <Studio resolution={profile.envResolution} />
      <Lights />
      <RimLight />
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
      <Effects dof={dof} multisampling={profile.multisampling} />
    </>
  );
}

export default function JourneyCanvas({ tier, active, reduced, eventSource, onReady, onFailure }: Props) {
  const [dof, setDof] = useState(QUALITY[tier].dof);
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
      <Scene tier={tier} setDof={setDof} dof={dof} onReady={onReady} />
      {!compiled && <Precompile onDone={onCompiled} />}
      {reduced && compiled && <DemandRenderer />}
    </Canvas>
  );
}

/**
 * Compile every shader program off the main thread (KHR_parallel_shader_compile)
 * before the first frame, so the page never freezes while the piano arrives.
 */
function Precompile({ onDone }: { onDone: () => void }) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    let cancelled = false;
    const t = performance.now();
    gl.compileAsync(scene, camera)
      .catch(() => undefined)
      .then(() => {
        performance.measure("journey:compile", { start: t, end: performance.now() });
        if (!cancelled) onDone();
      });
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
      const key = `${journey.raw.explode > 0.5}|${journey.raw.corridor > 0.5}|${Math.round(journey.raw.exploded * 4)}`;
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
