"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { AdditiveBlending, Color, MeshBasicMaterial, Vector3, type Mesh } from "three";
import { PALETTE } from "../config";
import { rig } from "./rig";

const _dir = new Vector3();

/**
 * A full-frame wash of gold light just in front of the lens. Pushed past 1.0
 * it blooms, so a cut between two stages lands inside a flash of light
 * instead of a visible jump.
 */
export function FlashVeil() {
  const mesh = useRef<Mesh>(null);
  const material = useMemo(
    () =>
      new MeshBasicMaterial({
        color: new Color(PALETTE.goldHot).multiplyScalar(2.6),
        transparent: true,
        opacity: 0,
        blending: AdditiveBlending,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  );
  useFrame(({ camera }) => {
    const m = mesh.current;
    if (!m) return;
    m.visible = rig.flash > 0.002;
    if (!m.visible) return;
    camera.getWorldDirection(_dir);
    m.position.copy(camera.position).addScaledVector(_dir, 0.3);
    m.quaternion.copy(camera.quaternion);
    material.opacity = rig.flash;
  });
  return (
    <mesh ref={mesh} material={material} renderOrder={999} frustumCulled={false} visible={false}>
      <planeGeometry args={[4, 4]} />
    </mesh>
  );
}
