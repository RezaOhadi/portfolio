import { DataTexture, FloatType, NearestFilter, RedFormat } from "three";

/**
 * Shared by the string meshes and the particle shader, so motes sit exactly on
 * the strings and ride the same standing waves.
 */
export const STRINGS = {
  count: 216,
  x0: -4.1,
  dx: 0.038,
  y: 0,
  z0: 7,
  length: 15,
  /** Bass strings (the first ones) cross over the tenor at a slight angle. */
  bass: 44,
  bassAngle: 0.11,
  bassLift: 0.05,
} as const;

/** midi of string i: low on the left, like a keyboard seen from the player. */
export const stringMidi = (i: number) => Math.round(24 + (i / (STRINGS.count - 1)) * 72);

/** Per-string ringing amplitude, written by the strings stage every frame, read by both shaders. */
export const stringAmp = (() => {
  const data = new Float32Array(256);
  const texture = new DataTexture(data, 256, 1, RedFormat, FloatType);
  texture.minFilter = texture.magFilter = NearestFilter;
  texture.needsUpdate = true;
  return { data, texture };
})();

/** Ring time shared by both shaders. */
export const stringTime = { value: 0 };
