"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, type RefObject } from "react";
import { Vector3, MathUtils } from "three";
import { universeConfig } from "@/config/home-universe";

export interface JourneyMotion {
  progress: number;
  pointerX: number;
  pointerY: number;
  snap: boolean;
}

export function CameraRig({ motion }: { motion: RefObject<JourneyMotion> }) {
  const target = useMemo(() => new Vector3(), []);
  useFrame(({ camera }, delta) => {
    const state = motion.current;
    const p = state.progress;
    const alpha = state.snap ? 1 : 1 - Math.exp(-universeConfig.camera.damping * Math.min(delta, 0.05));
    target.set(
      Math.sin(p * Math.PI * 2) * 0.65 + state.pointerX * 0.16,
      Math.sin(p * Math.PI) * 0.3 - state.pointerY * 0.1,
      MathUtils.lerp(universeConfig.camera.startZ, universeConfig.camera.endZ, p),
    );
    camera.position.lerp(target, alpha);
    camera.rotation.x = MathUtils.lerp(camera.rotation.x, state.pointerY * 0.012, alpha);
    camera.rotation.y = MathUtils.lerp(camera.rotation.y, -state.pointerX * 0.025, alpha);
    state.snap = false;
  });
  return null;
}
