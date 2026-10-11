"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { AdditiveBlending, Color, MeshBasicMaterial, type Mesh } from "three";
import { PALETTE } from "../../config";
import { range } from "../../store";
import { ease, rig } from "../rig";
import { STRINGS } from "./stringLayout";

const bell = (v: number) => Math.sin(Math.PI * Math.min(1, Math.max(0, v)));

/**
 * The portal (World 4 -> 5): a gold iris opens around the last hammer's
 * strike point and the camera flies into it; after the flash the camera
 * comes out through a second ring, already flying along the strings.
 */
export function Portal() {
  const entry = useRef<Mesh>(null);
  const exit = useRef<Mesh>(null);
  const material = useMemo(
    () =>
      new MeshBasicMaterial({
        color: new Color(PALETTE.goldHot).multiplyScalar(7),
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        fog: false,
      }),
    [],
  );
  const exitMaterial = useMemo(() => material.clone(), [material]);

  useFrame(({ camera }) => {
    const p = rig.portal;
    const a = entry.current;
    if (a) {
      a.visible = rig.show.hammers && p > 0.05;
      if (a.visible) {
        a.position.copy(rig.portalPoint);
        a.lookAt(camera.position);
        a.scale.setScalar(0.04 + ease.recoil(range(p, 0.1, 0.5)) * 1.1);
        material.opacity = bell(range(p, 0.05, 0.55));
      }
    }
    const b = exit.current;
    if (b) {
      b.visible = rig.show.strings && p < 0.85;
      if (b.visible) {
        b.position.set(0, STRINGS.y + 0.32, STRINGS.z0 + 1.6);
        b.rotation.set(0, 0, 0);
        b.scale.setScalar(1.1 + ease.burst(range(p, 0.5, 0.85)) * 3.5);
        exitMaterial.opacity = 1 - range(p, 0.5, 0.85);
      }
    }
  });

  return (
    <>
      <mesh ref={entry} material={material} visible={false} renderOrder={10}>
        <torusGeometry args={[1, 0.014, 10, 128]} />
      </mesh>
      <mesh ref={exit} material={exitMaterial} visible={false} renderOrder={10}>
        <torusGeometry args={[1, 0.02, 10, 128]} />
      </mesh>
    </>
  );
}
