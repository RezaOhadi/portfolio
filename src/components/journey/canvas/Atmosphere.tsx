"use client";

import { useFrame } from "@react-three/fiber";
import { Fog, MathUtils, type Scene } from "three";
import { rig } from "./rig";

/**
 * Each stage has its own air: how much studio light reaches it and how close
 * the dark comes. The piano worlds sit in an open studio; the corridor is a
 * closed tunnel where only the travelling lamp and the pressed keys glow.
 */
interface Air {
  env: number;
  /** Scale on the studio key and rim lights. */
  studio: number;
  near: number;
  far: number;
}

const STUDIO: Air = { env: 0.85, studio: 1, near: 9, far: 26 };
const TUNNEL: Air = { env: 0.22, studio: 0.12, near: 0.8, far: 13 };
const ACTION: Air = { env: 0.3, studio: 0.2, near: 3, far: 20 };
const HARP: Air = { env: 0.32, studio: 0.25, near: 2.5, far: 17 };
const BOARDROOM: Air = { env: 0.45, studio: 0.55, near: 4, far: 26 };

export function Atmosphere() {
  useFrame(({ scene }, delta) => {
    const air = rig.show.board && !rig.show.strings ? BOARDROOM : rig.show.strings ? HARP : rig.show.hammers ? ACTION : rig.show.corridor ? TUNNEL : STUDIO;
    const s = scene as Scene & { environmentIntensity: number };
    // Inside a cut the change is hidden by the flash, so it can settle quickly.
    const k = 1 - Math.exp(-8 * Math.min(delta, 1 / 20));
    s.environmentIntensity = MathUtils.lerp(s.environmentIntensity ?? STUDIO.env, air.env, k);
    rig.studio = MathUtils.lerp(rig.studio, air.studio, k);
    if (s.fog instanceof Fog) {
      s.fog.near = MathUtils.lerp(s.fog.near, air.near, k);
      s.fog.far = MathUtils.lerp(s.fog.far, air.far, k);
    }
  }, -1);
  return null;
}
