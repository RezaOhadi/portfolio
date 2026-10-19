"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import { MathUtils, Vector3, type PerspectiveCamera } from "three";
import gsap from "gsap";
import { journey, range } from "../store";
import { ease, rig } from "./rig";
import { CORRIDOR } from "./stages/Corridor";
import { HAMMERS } from "./stages/Hammers";
import { STRINGS } from "./stages/stringLayout";
import { BOARD } from "./stages/boardLayout";
import { NAME } from "./particles/shaders";

/** Centre of the assembled piano, the pivot of the final arc. */
const PIANO_TARGET = new Vector3(0.02, 0.86, -0.92);

/**
 * Dolly zoom: the name keeps its size on screen; portrait frames need a far wider hold to fit it.
 * Never narrower than the name itself with a margin, whatever the aspect (4:3 tablets, small phones).
 */
const nameKeep = (portrait: number, aspect: number) =>
  Math.max(6 * Math.tan(MathUtils.degToRad(24)) * MathUtils.lerp(1, 3.2, portrait), ((NAME.width / 2) * 1.14) / aspect);
const TABLET_LIFT = 0.22;
const TABLET_PULL = 0.2;
const nameDistance =(portrait: number) => MathUtils.lerp(1, 2.6, portrait);

/**
 * One camera, a different move per world:
 * - World 1, The Piano: orbit around the instrument.
 * - Explode: pull-back, the camera recoils as the case bursts (with a shock).
 * - World 2, Exploded View: crane, a vertical descent through the floating stack.
 * - Dive: an accelerating plunge into the floating keyboard, cut inside the veil's dark.
 * - World 3, Keyboard Corridor: a forward dolly down an endless tunnel of keys.
 * Composition uses an off-axis lens shift so overlays keep their side of the frame.
 */
interface Orbit {
  angle: number;
  radius: number;
  height: number;
  target: Vector3;
  fov: number;
  shiftX: number;
  shiftY: number;
}

const orbit = (): Orbit => ({ angle: 0, radius: 0, height: 0, target: new Vector3(), fov: 30, shiftX: 0, shiftY: 0 });

function mixOrbit(out: Orbit, a: Orbit, b: Orbit, t: number) {
  out.angle = MathUtils.lerp(a.angle, b.angle, t);
  out.radius = MathUtils.lerp(a.radius, b.radius, t);
  out.height = MathUtils.lerp(a.height, b.height, t);
  out.target.lerpVectors(a.target, b.target, t);
  out.fov = MathUtils.lerp(a.fov, b.fov, t);
  out.shiftX = MathUtils.lerp(a.shiftX, b.shiftX, t);
  out.shiftY = MathUtils.lerp(a.shiftY, b.shiftY, t);
  return out;
}

/** The resolved camera for one frame: every world writes into this. */
interface Frame {
  pos: Vector3;
  target: Vector3;
  fov: number;
  shiftX: number;
  shiftY: number;
  roll: number;
  /** 0..1, how much mouse parallax this shot allows. */
  parallax: number;
}

const plunge = gsap.parseEase("power3.in");

export function CameraDirector() {
  const s = useMemo(
    () => ({
      orbit: orbit(),
      pull: orbit(),
      crane: orbit(),
      blend: orbit(),
      frame: { pos: new Vector3(), target: new Vector3(), fov: 30, shiftX: 0, shiftY: 0, roll: 0, parallax: 1 } as Frame,
      parallax: new Vector3(),
      right: new Vector3(),
      up: new Vector3(),
      near: new Vector3(),
      tmp: new Vector3(),
    }),
    [],
  );

  useFrame((state) => {
    const camera = state.camera as PerspectiveCamera;
    const { width, height } = state.size;
    const aspect = width / Math.max(1, height);
    // Portrait screens: pull back and push the subject into the upper half.
    const portrait = MathUtils.clamp((1.25 - aspect) / 0.8, 0, 1);
    // Tablet portrait keeps the side-by-side hero copy: lift the instrument clear of the title.
    const tablet = MathUtils.smoothstep(portrait, 0.2, 0.45) * (1 - MathUtils.smoothstep(portrait, 0.8, 0.95));
    const t = rig.time;
    const f = s.frame;

    /* ---- World 1 and the explode and World 2 (orbit, pull-back, crane) ---- */
    const o = s.orbit;
    const hero = ease.settle(rig.piano);
    const away = 1 - rig.arrival;
    // Portrait screens see the instrument more from the front, so it fits the width.
    o.angle = 0.62 - portrait * 0.5 + hero * 0.85 - away * 0.55 + (journey.reduced ? 0 : Math.sin(t * 0.13) * 0.1);
    o.radius = MathUtils.lerp(6.4, 9.0, portrait) * (1 - hero * 0.06) * (1 + tablet * TABLET_PULL) + away * 5.5;
    // High enough to look into the open case and catch the gold plate.
    o.height = MathUtils.lerp(1.95, 2.6, portrait) - hero * 0.45 + away * 2.4;
    o.target.set(0.02, 0.74 + hero * 0.22, -0.92);
    o.fov = MathUtils.lerp(30, 40, portrait);
    // As the hero copy leaves, the instrument moves to the centre of the frame.
    o.shiftX = MathUtils.lerp(-0.5, 0, portrait) * (1 - ease.settle(range(rig.piano, 0.25, 0.9)));
    o.shiftY = MathUtils.lerp(0, -0.4, portrait) - tablet * TABLET_LIFT;

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
    const out = mixOrbit(s.blend, o, p, ease.recoil(range(rig.explode, 0, 0.7)));
    mixOrbit(out, out, c, range(rig.explode, 0.4, 1));
    f.pos.set(out.target.x + Math.sin(out.angle) * out.radius, out.height, out.target.z + Math.cos(out.angle) * out.radius);
    f.target.copy(out.target);
    f.fov = out.fov;
    f.shiftX = out.shiftX;
    f.shiftY = out.shiftY;
    f.roll = 0;
    f.parallax = 1;

    /* ---- Dive: plunge into the floating keyboard, cut inside the dark ---- */
    if (rig.dive > 0 && !rig.show.corridor) {
      const a = plunge(range(rig.dive, 0, 0.5));
      // Close over the keys, approaching from where the camera already is.
      s.tmp.subVectors(f.pos, rig.keyboardPos).normalize();
      s.near.copy(rig.keyboardPos).addScaledVector(s.tmp, 0.32);
      s.near.y = rig.keyboardPos.y + 0.12;
      f.pos.lerp(s.near, a);
      f.target.lerp(rig.keyboardPos, a);
      f.fov = MathUtils.lerp(f.fov, 20, a);
      f.shiftX *= 1 - a;
      f.shiftY *= 1 - a;
      f.roll = a * 0.35;
      f.parallax = 1 - a;
    }

    /* ---- World 3: forward dolly down the endless key corridor ---- */
    if (rig.show.corridor) {
      // Inside the dark the camera is already over the unfolding keyboard, still moving.
      const enter = ease.settle(range(rig.dive, 0.5, 1));
      // The twist keeps the camera moving forward while it rolls a quarter turn.
      const twist = ease.recoil(range(rig.twist, 0, 0.5));
      const z = MathUtils.lerp(5.4, 0.6, enter) - rig.corridor * 62 - twist * 5;
      const y = CORRIDOR.centerY + Math.sin(z * 0.9) * 0.035;
      f.pos.set(Math.sin(t * 0.37) * 0.04, y, z);
      f.target.set(Math.sin(t * 0.21) * 0.08, CORRIDOR.centerY - 0.06, z - 6);
      f.fov = MathUtils.lerp(62, 78, portrait) + rig.velocity * 12 + (1 - enter) * 14;
      // Keep the vanishing point clear of the copy column on the left.
      f.shiftX = MathUtils.lerp(-0.22, 0, portrait);
      f.shiftY = MathUtils.lerp(0, -0.12, portrait);
      f.roll = (1 - enter) * -0.35 + Math.sin(rig.corridor * Math.PI * 3) * 0.05 + twist * Math.PI * 0.5;
      f.fov += twist * 18;
      f.parallax = 0.6;
    }

    /* ---- World 4: the roll unwinds into a slow barrel roll along the hammer row ---- */
    if (rig.show.hammers) {
      const land = ease.recoil(range(rig.twist, 0.5, 1));
      const x = MathUtils.lerp(-13.5, 13.5, ease.settle(rig.hammers));
      const lift = MathUtils.lerp(1.75, 2.2, portrait);
      f.pos.set(x - 1.3, lift + (1 - land) * 0.6, MathUtils.lerp(4.4, 6.2, portrait) + (1 - land) * 1.5);
      f.target.set(x + 0.6, 0.45, -0.8);
      // A quarter-turn arriving from the twist, then a slow roll that breathes as you read.
      f.roll = (1 - land) * Math.PI * 0.5 + Math.sin(rig.hammers * Math.PI * 2.2) * 0.16;
      f.fov = MathUtils.lerp(40, 54, portrait) + (1 - land) * 16;
      f.shiftX = 0;
      // The row runs through the lower part of the frame, below the section title.
      f.shiftY = MathUtils.lerp(0.32, 0.38, portrait);
      f.parallax = 0.8;

      // Portal: the camera flies into the iris that opens around the next strike.
      rig.portalPoint.set(x + 0.6, HAMMERS.stringY - 0.05, -0.15);
      if (rig.portal > 0) {
        const a = plunge(range(rig.portal, 0, 0.5));
        s.near.copy(rig.portalPoint).add(s.tmp.set(0, 0.16, 0.6));
        f.pos.lerp(s.near, a);
        f.target.lerp(rig.portalPoint, a);
        f.fov = MathUtils.lerp(f.fov, 18, a);
        f.roll *= 1 - a;
        f.shiftY *= 1 - a;
        f.parallax *= 1 - a;
      }
    }

    /* ---- World 5: flying low along the strings (the base shot of the whole stage) ---- */
    if (rig.show.board) {
      const out = ease.recoil(range(rig.portal, 0.5, 1));
      const glide = ease.settle(rig.strings);
      const z = MathUtils.lerp(STRINGS.z0 + 2.4, STRINGS.z0 - 0.4, out) - glide * 11;
      const weave = Math.sin(glide * Math.PI * 2) * 1.1;
      f.pos.set(weave, STRINGS.y + MathUtils.lerp(0.5, 0.72, portrait) + (1 - out) * 0.25, z);
      f.target.set(weave * 0.55, STRINGS.y - 0.08, z - 4.2);
      f.fov = MathUtils.lerp(50, 66, portrait) + (1 - out) * 22;
      f.roll = -Math.cos(glide * Math.PI * 2) * 0.1 * out;
      f.shiftX = MathUtils.lerp(-0.12, 0, portrait);
      // The horizon sits low; the concerts read over the dark above it.
      f.shiftY = MathUtils.lerp(0.4, 0.42, portrait);
      f.parallax = 0.5;

      /* ---- Dissolve, then World 6: rise into an overhead view and spiral down over the board ---- */
      if (rig.dissolve > 0) {
        const rise = ease.recoil(range(rig.dissolve, 0, 0.75));
        const tilt = ease.settle(range(rig.dissolve, 0, 0.35));
        const descend = ease.settle(rig.soundboard);
        const zc = MathUtils.lerp(1.6, -1.8, descend);
        const h = MathUtils.lerp(9.5, 4.4, descend) * MathUtils.lerp(1, 1.35, portrait);
        s.tmp.set(0, BOARD.y + h, zc + 0.45);
        f.pos.lerp(s.tmp, rise);
        s.near.set(0, BOARD.y, zc);
        f.target.lerp(s.near, rise);
        f.fov = MathUtils.lerp(f.fov, MathUtils.lerp(42, 56, portrait), rise);
        // Looking straight down, the slow turn of the descent is a roll of the view.
        f.roll = MathUtils.lerp(f.roll, 0.35 + descend * 1.15, rise);
        f.shiftX = MathUtils.lerp(f.shiftX, MathUtils.lerp(-0.2, 0, portrait), rise);
        f.shiftY = MathUtils.lerp(f.shiftY, 0, tilt);
        f.parallax = MathUtils.lerp(f.parallax, 0.4, rise);
      }

      /* ---- Morph, then World 7: tilt up from the board to face the name, then a dolly zoom ---- */
      if (rig.morph > 0) {
        const face = ease.recoil(range(rig.morph, 0, 0.85));
        // Dolly zoom: pull back while the lens narrows, holding the name's size (Vertigo).
        const d = MathUtils.lerp(6, 13, ease.settle(rig.name)) * nameDistance(portrait);
        const keep = nameKeep(portrait, aspect);
        const fov = MathUtils.radToDeg(2 * Math.atan(keep / d));
        s.tmp.set(Math.sin(t * 0.1) * 0.12, NAME.y + 0.1, NAME.z + d);
        s.near.set(0, NAME.y, NAME.z);
        f.pos.lerp(s.tmp, face);
        f.target.lerp(s.near, face);
        f.fov = MathUtils.lerp(f.fov, fov, face);
        f.roll *= 1 - face;
        f.shiftX = MathUtils.lerp(f.shiftX, 0, face);
        f.shiftY = MathUtils.lerp(f.shiftY, MathUtils.lerp(-0.12, -0.3, portrait), face);
        f.parallax = MathUtils.lerp(f.parallax, 0.7, face);
      }
    }

    /* ---- Reassemble and outro: a wide arc swing round the rebuilt piano, then a slow pendulum ---- */
    if (rig.reassemble > 0) {
      const a = ease.recoil(range(rig.reassemble, 0, 0.9));
      const o2 = s.orbit;
      const dz = NAME.z + 13 * nameDistance(portrait) - PIANO_TARGET.z;
      const swing = MathUtils.lerp(0, 2.15, a) - ease.settle(rig.outro) * 1.55;
      o2.angle = swing + (journey.reduced ? 0 : Math.sin(t * 0.15) * 0.05);
      o2.radius = MathUtils.lerp(dz, MathUtils.lerp(7.6, 10.5, portrait), a);
      o2.height = MathUtils.lerp(NAME.y + 0.1, 2.0, a);
      o2.target.lerpVectors(s.near.set(0, NAME.y, NAME.z), PIANO_TARGET, a);
      const pos = s.tmp.set(o2.target.x + Math.sin(o2.angle) * o2.radius, o2.height, o2.target.z + Math.cos(o2.angle) * o2.radius);
      const from = Math.min(1, rig.reassemble * 12);
      f.pos.lerp(pos, from);
      f.target.lerp(o2.target, from);
      const nameFov = MathUtils.radToDeg(2 * Math.atan(nameKeep(portrait, aspect) / (13 * nameDistance(portrait))));
      f.fov = MathUtils.lerp(nameFov, MathUtils.lerp(32, 42, portrait), a);
      f.roll = 0;
      f.shiftX = 0;
      f.shiftY = MathUtils.lerp(-0.12, MathUtils.lerp(0.05, -0.3, portrait), a);
      f.parallax = 1;
    }

    /* ---- apply ---- */
    camera.position.copy(f.pos);
    camera.lookAt(f.target);
    camera.updateMatrix();

    // Mouse parallax in the camera's own plane, and the burst shake.
    s.right.setFromMatrixColumn(camera.matrix, 0);
    s.up.setFromMatrixColumn(camera.matrix, 1);
    const mouse = journey.pointer.mouse && !journey.reduced ? f.parallax : 0;
    s.parallax.lerp(s.right.multiplyScalar(journey.pointer.x * 0.22 * mouse).add(s.up.multiplyScalar(journey.pointer.y * 0.12 * mouse)), 0.05);
    camera.position.add(s.parallax);
    if (rig.burst > 0.01) {
      // The shock always lands; fast scrolling makes it harder.
      const shake = rig.burst * (0.03 + rig.velocity * 0.03);
      camera.position.x += Math.sin(t * 41) * shake;
      camera.position.y += Math.sin(t * 37 + 1.3) * shake;
    }
    camera.lookAt(f.target);
    if (f.roll) camera.rotateZ(f.roll);
    camera.updateMatrixWorld();

    if (Math.abs(camera.fov - f.fov) > 0.001) camera.fov = f.fov;
    camera.updateProjectionMatrix();
    // Off-axis lens shift: composition without moving the subject in 3D.
    camera.projectionMatrix.elements[8] = f.shiftX;
    camera.projectionMatrix.elements[9] = f.shiftY;
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();

    rig.focus.copy(f.target);
  }, -2);

  return null;
}
