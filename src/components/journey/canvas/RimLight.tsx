"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Vector3, type DirectionalLight } from "three";
import { PALETTE } from "../config";
import { rig } from "./rig";

const _dir = new Vector3();

/**
 * A gold backlight that follows the camera: it always sits behind the subject,
 * opposite the lens, so the black lacquer keeps a burning gold silhouette from
 * every angle the orbit and the crane pass through.
 */
export function RimLight() {
  const light = useRef<DirectionalLight>(null);
  useFrame(({ camera }) => {
    const l = light.current;
    if (!l) return;
    _dir.subVectors(rig.focus, camera.position).setY(0).normalize();
    l.position.copy(rig.focus).addScaledVector(_dir, 6);
    l.position.y += 4.6;
    l.target.position.copy(rig.focus);
    l.target.updateMatrixWorld();
    l.intensity = 1.5 + rig.anticipation * 3 + rig.burst * 2.5;
  }, -1);
  return <directionalLight ref={light} color={PALETTE.goldHot} intensity={2.6} />;
}
