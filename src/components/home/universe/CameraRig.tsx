"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type RefObject } from "react";
import { Vector3, MathUtils, PerspectiveCamera } from "three";
import { universeConfig } from "@/config/home-universe";

export interface JourneyMotion {
  progress: number;
  pointerX: number;
  pointerY: number;
  /** Eased scroll velocity in px/frame, from the shared motion clock. */
  velocity: number;
  snap: boolean;
}

export function CameraRig({ motion, onIntroComplete }: { motion: RefObject<JourneyMotion>; onIntroComplete: () => void }) {
  const target = useMemo(() => new Vector3(), []);
  const entrance = useRef({ elapsed: 0, complete: false });
  const lens = useRef({ breath: 0 });
  useFrame(({ camera, size }, delta) => {
    const state = motion.current;
    const p = state.progress;
    const intro = entrance.current;
    if (!intro.complete) {
      intro.elapsed += Math.min(delta, 0.05);
      // Deep links, restored scroll and an early swipe take priority over the intro.
      if (intro.elapsed >= 2.4 || p > 0.015) {
        intro.complete = true;
        onIntroComplete();
      }
    }
    const t = Math.min(1, intro.elapsed / 2.4);
    const entranceOffset = intro.complete ? 0 : 4 * (1 - t * t * (3 - 2 * t));
    const alpha = state.snap ? 1 : 1 - Math.exp(-universeConfig.camera.damping * Math.min(delta, 0.05));
    const portrait = MathUtils.clamp(1 - size.width / Math.max(1, size.height), 0, 0.65);
    // A dolly moving fast "breathes" its lens a touch wider, then settles —
    // the speed reads as depth rather than as a jump in position.
    const speed = Math.min(1, Math.abs(state.velocity) / 60);
    lens.current.breath = MathUtils.lerp(lens.current.breath, speed * 2.4, 1 - Math.exp(-6 * Math.min(delta, 0.05)));
    if (lens.current.breath < 0.001) lens.current.breath = 0;
    if (camera instanceof PerspectiveCamera) {
      const fov = universeConfig.camera.fov + portrait * 48 + lens.current.breath;
      const aspect = size.width / Math.max(1, size.height);
      if (Math.abs(camera.fov - fov) > 0.01 || camera.aspect !== aspect) {
        camera.fov = fov;
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
      }
    }
    target.set(
      Math.sin(p * Math.PI * 2) * 0.65 * (1 - portrait * 1.5) + state.pointerX * 0.16 * (1 - portrait),
      Math.sin(p * Math.PI) * 0.3 - state.pointerY * 0.1,
      MathUtils.lerp(universeConfig.camera.startZ, universeConfig.camera.endZ, p) + portrait * 4 + entranceOffset,
    );
    if (!intro.complete) camera.position.copy(target);
    else camera.position.lerp(target, alpha);
    camera.rotation.x = MathUtils.lerp(camera.rotation.x, state.pointerY * 0.012, alpha);
    camera.rotation.y = MathUtils.lerp(camera.rotation.y, -state.pointerX * 0.025, alpha);
    // Slight bank into the direction of travel, like a camera on a curved track.
    const bank = MathUtils.clamp(state.velocity * 0.00045, -0.02, 0.02) * Math.cos(p * Math.PI * 2);
    camera.rotation.z = MathUtils.lerp(camera.rotation.z, bank, 1 - Math.exp(-4 * Math.min(delta, 0.05)));
    state.snap = false;
  });
  return null;
}
