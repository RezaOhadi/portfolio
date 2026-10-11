"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import { MathUtils, Vector3, type PerspectiveCamera } from "three";
import { journey, range } from "../store";
import { ease, rig } from "./rig";

/**
 * One camera, a different move per world:
 * - World 1, The Piano: slow orbit around the instrument.
 * - Explode: pull-back, the camera recoils as the case bursts (with a short shake).
 * - World 2, Exploded View: crane, a vertical descent through the floating stack.
 * Composition uses an off-axis lens shift so overlays keep their side of the frame.
 */
interface Shot {
  angle: number;
  radius: number;
  height: number;
  target: Vector3;
  fov: number;
  shiftX: number;
  shiftY: number;
}

const shot = (): Shot => ({ angle: 0, radius: 0, height: 0, target: new Vector3(), fov: 30, shiftX: 0, shiftY: 0 });

function mix(out: Shot, a: Shot, b: Shot, t: number) {
  out.angle = MathUtils.lerp(a.angle, b.angle, t);
  out.radius = MathUtils.lerp(a.radius, b.radius, t);
  out.height = MathUtils.lerp(a.height, b.height, t);
  out.target.lerpVectors(a.target, b.target, t);
  out.fov = MathUtils.lerp(a.fov, b.fov, t);
  out.shiftX = MathUtils.lerp(a.shiftX, b.shiftX, t);
  out.shiftY = MathUtils.lerp(a.shiftY, b.shiftY, t);
  return out;
}

export function CameraDirector() {
  const s = useMemo(() => ({ orbit: shot(), pull: shot(), crane: shot(), out: shot(), parallax: new Vector3(), right: new Vector3(), up: new Vector3() }), []);

  useFrame((state) => {
    const camera = state.camera as PerspectiveCamera;
    const { width, height } = state.size;
    const aspect = width / Math.max(1, height);
    // Portrait screens: pull back and push the subject into the upper half.
    const portrait = MathUtils.clamp((1.25 - aspect) / 0.8, 0, 1);
    const t = rig.time;

    // World 1: orbit. Scroll advances the orbit; time keeps it alive at rest.
    // Arrival: the camera glides in from far and high as the piano materializes.
    // Scroll: an ~80° orbit that pushes in and drops toward the keyboard.
    const o = s.orbit;
    const hero = ease.settle(rig.piano);
    const away = 1 - rig.arrival;
    // Portrait screens see the instrument more from the front, so it fits the width.
    o.angle = 0.62 - portrait * 0.5 + hero * 0.85 - away * 0.55 + (journey.reduced ? 0 : Math.sin(t * 0.13) * 0.1);
    o.radius = MathUtils.lerp(6.4, 9.0, portrait) * (1 - hero * 0.06) + away * 5.5;
    // High enough to look into the open case and catch the gold plate.
    o.height = MathUtils.lerp(1.95, 2.6, portrait) - hero * 0.45 + away * 2.4;
    o.target.set(0.02, 0.74 + hero * 0.22, -0.92);
    o.fov = MathUtils.lerp(30, 40, portrait);
    // As the hero copy leaves, the instrument moves to the centre of the frame.
    o.shiftX = MathUtils.lerp(-0.5, 0, portrait) * (1 - ease.settle(range(rig.piano, 0.25, 0.9)));
    o.shiftY = MathUtils.lerp(0, -0.4, portrait);

    // Explode: the camera recoils up and back to a high three-quarter view,
    // so every flat part (lid, plate, strings, soundboard) shows its face.
    const p = s.pull;
    p.angle = o.angle + 0.3;
    p.radius = MathUtils.lerp(8.4, 15.5, portrait);
    p.height = MathUtils.lerp(5.0, 7.4, portrait);
    p.target.set(0, 1.12, -0.7);
    p.fov = MathUtils.lerp(33, 42, portrait);
    p.shiftX = MathUtils.lerp(0.18, 0, portrait);
    p.shiftY = MathUtils.lerp(0, 0.02, portrait);

    // World 2: crane down through the floating stack, from above to eye level.
    const c = s.crane;
    const k = ease.settle(range(rig.exploded, 0.12, 0.96));
    c.angle = p.angle + k * 0.16;
    c.radius = p.radius * MathUtils.lerp(1, 0.92, k);
    c.height = MathUtils.lerp(p.height, 1.25, k);
    c.target.set(0, MathUtils.lerp(1.12, 0.95, k), -0.7);
    c.fov = p.fov;
    c.shiftX = p.shiftX;
    // Portrait: the stack rises into the upper half as the biography arrives below it.
    c.shiftY = MathUtils.lerp(p.shiftY, MathUtils.lerp(0, -0.3, portrait), ease.settle(range(rig.exploded, 0.02, 0.3)));

    // The crane starts exactly on the pull-back shot, so blending it in never jumps.
    // The recoil leads the burst: quick to leave, long to settle.
    const out = mix(s.out, o, p, ease.recoil(range(rig.explode, 0, 0.7)));
    mix(out, out, c, range(rig.explode, 0.4, 1));

    camera.position.set(
      out.target.x + Math.sin(out.angle) * out.radius,
      out.height,
      out.target.z + Math.cos(out.angle) * out.radius,
    );
    camera.lookAt(out.target);
    camera.updateMatrix();

    // Mouse parallax in the camera's own plane, and the burst shake.
    s.right.setFromMatrixColumn(camera.matrix, 0);
    s.up.setFromMatrixColumn(camera.matrix, 1);
    const mouse = journey.pointer.mouse && !journey.reduced ? 1 : 0;
    s.parallax.lerp(s.right.multiplyScalar(journey.pointer.x * 0.22 * mouse).add(s.up.multiplyScalar(journey.pointer.y * 0.12 * mouse)), 0.05);
    camera.position.add(s.parallax);
    if (rig.burst > 0.01) {
      // The shock always lands; fast scrolling makes it harder.
      const shake = rig.burst * (0.03 + rig.velocity * 0.03);
      camera.position.x += Math.sin(t * 41) * shake;
      camera.position.y += Math.sin(t * 37 + 1.3) * shake;
    }
    camera.lookAt(out.target);
    camera.updateMatrixWorld();

    if (Math.abs(camera.fov - out.fov) > 0.001) camera.fov = out.fov;
    camera.updateProjectionMatrix();
    // Off-axis lens shift: composition without moving the subject in 3D.
    camera.projectionMatrix.elements[8] = out.shiftX;
    camera.projectionMatrix.elements[9] = out.shiftY;
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();

    rig.focus.copy(out.target);
  }, -2);

  return null;
}
