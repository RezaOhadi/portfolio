"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type RefObject } from "react";
import { Vector3, MathUtils, PerspectiveCamera } from "three";
import { universeConfig } from "@/config/home-universe";

export interface JourneyMotion {
  progress: number;
  pointerX: number;
  pointerY: number;
  snap: boolean;
}

export function CameraRig({ motion, onIntroComplete }: { motion: RefObject<JourneyMotion>; onIntroComplete: () => void }) {
  const target = useMemo(() => new Vector3(), []);
  const entrance = useRef({ elapsed: 0, complete: false });
  useFrame(({ camera, size }, delta) => {
    const state = motion.current;
    const p = state.progress;
    const intro = entrance.current;
    if (!intro.complete) {
      intro.elapsed += Math.min(delta, 0.05);
      // Deep links, restored scroll and an early swipe take priority over the intro.
      if (intro.elapsed >= 1.8 || p > 0.015) {
        intro.complete = true;
        onIntroComplete();
      }
    }
    const t = Math.min(1, intro.elapsed / 1.8);
    const entranceOffset = intro.complete ? 0 : 4 * (1 - t * t * (3 - 2 * t));
    const alpha = state.snap ? 1 : 1 - Math.exp(-universeConfig.camera.damping * Math.min(delta, 0.05));
    const portrait = MathUtils.clamp(1 - size.width / Math.max(1, size.height), 0, 0.65);
    if (camera instanceof PerspectiveCamera) {
      const fov = universeConfig.camera.fov + portrait * 48;
      if (Math.abs(camera.fov - fov) > 0.01) {
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }
    }
    target.set(
      Math.sin(p * Math.PI * 2) * 0.65 * (1 - portrait) + state.pointerX * 0.16,
      Math.sin(p * Math.PI) * 0.3 - state.pointerY * 0.1,
      MathUtils.lerp(universeConfig.camera.startZ, universeConfig.camera.endZ, p) + portrait * 4 + entranceOffset,
    );
    if (!intro.complete) camera.position.copy(target);
    else camera.position.lerp(target, alpha);
    camera.rotation.x = MathUtils.lerp(camera.rotation.x, state.pointerY * 0.012, alpha);
    camera.rotation.y = MathUtils.lerp(camera.rotation.y, -state.pointerX * 0.025, alpha);
    state.snap = false;
  });
  return null;
}
