"use client";

import { useSprings } from "@react-spring/three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Euler, Quaternion, Ray, Vector3, type Object3D } from "three";
import { playNote } from "../audio";
import { emit, journey, range } from "../store";
import { labelNodes } from "./labels";
import { applySpread, type PianoPart, type Pose } from "./piano/build";
import { fxShared } from "./piano/materials";
import { partProgress, partTumble, rig } from "./rig";

export const pointerRay = new Ray(new Vector3(), new Vector3(0, 0, -1));
const PIANO_CENTER = new Vector3(0, 0.82, -0.95);
/** Labels shown together during the "technical drawing" snap (one per kind). */
const DRAWING_LABELS = new Set(["lid", "desk", "fallboard", "strings", "plate", "action", "soundboard", "rim", "keyboard", "legTreble", "lyre"]);

const _q = new Quaternion();
const _qa = new Quaternion();
const _qb = new Quaternion();
const _e = new Euler();
const _v = new Vector3();
const _w = new Vector3();
const _push = new Vector3();
const UP = new Vector3(0, 1, 0);

export function PianoParts({ parts }: { parts: PianoPart[] }) {
  const push = useMemo(() => parts.map(() => new Vector3()), [parts]);
  const seeds = useMemo(() => parts.map((_, i) => ({ a: Math.sin(i * 12.9898) * 0.5 + 0.5, b: Math.cos(i * 78.233) * 0.5 + 0.5 })), [parts]);
  const [springs, api] = useSprings(parts.length, () => ({ h: 0, config: { tension: 280, friction: 22 } }), [parts]);
  const spreadState = useRef({ spread: -1, wave: -1 });
  const visible = useMemo<{ node: HTMLElement; x: number; y: number }[]>(() => [], []);
  const textWidths = useMemo(() => new WeakMap<HTMLElement, number>(), []);
  const hinged = useMemo<Pose>(() => ({ pos: new Vector3(), rot: new Euler() }), []);
  const props = useMemo(() => {
    const map = new Map<string, Object3D>();
    parts.forEach((part) => part.group.traverse((o) => o.userData.prop && map.set(part.id, o)));
    return map;
  }, [parts]);

  useEffect(() => () => {
    journey.hovered = null;
  }, []);

  const setHover = (id: string | null) => {
    if (journey.hovered === id) return;
    journey.hovered = id;
    api.start((i) => ({ h: parts[i].id === id ? 1 : 0 }));
    const part = parts.find((p) => p.id === id);
    if (part) playNote(part.midi, 0.42, 3);
    emit();
  };

  const onOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    const id = event.object.userData.part as string | undefined;
    if (id) setHover(id);
  };
  const onOut = (event: ThreeEvent<PointerEvent>) => {
    if (event.object.userData.part === journey.hovered && event.intersections.length === 0) setHover(null);
  };

  useFrame((state) => {
    const { camera, raycaster, size } = state;
    // Pointer ray for dust repulsion and part push.
    pointerRay.origin.setFromMatrixPosition(camera.matrixWorld);
    pointerRay.direction.set(journey.pointer.x, journey.pointer.y, 0.5).unproject(camera).sub(pointerRay.origin).normalize();

    // Hover picking only exists in the exploded world.
    const exploded = rig.dof > 0.6 && rig.after < 0.5;
    raycaster.layers.set(exploded ? 1 : 31);
    if (!exploded && journey.hovered) setHover(null);

    fxShared.uTime.value = rig.time;
    fxShared.uMaterialize.value = rig.materialize;
    fxShared.uRevealAmount.value = rig.reveal;
    const dpr = state.gl.getPixelRatio();
    fxShared.uCursor.value.set(((journey.pointer.x + 1) / 2) * size.width * dpr, ((journey.pointer.y + 1) / 2) * size.height * dpr);
    fxShared.uRevealRadius.value = 150 * dpr;

    parts.forEach((part, i) => {
      const g = part.group;
      const e = partProgress(part.delay);
      const tum = partTumble(part.delay);
      const seed = seeds[i];
      let assembled = part.assembled;
      if (part.hingePose) {
        part.hingePose(rig.lid, hinged);
        assembled = hinged;
      }

      // Position: assembled -> exploded along an outward arc, then the drawing snap.
      _v.lerpVectors(assembled.pos, part.exploded.pos, e);
      _w.subVectors(part.exploded.pos, PIANO_CENTER).setY(0).normalize();
      _v.addScaledVector(_w, Math.sin(e * Math.PI) * 0.22);
      _v.y += Math.sin(e * Math.PI) * 0.12;
      _v.lerp(PIANO_CENTER, rig.anticipation * 0.018);
      _v.lerp(part.drawing.pos, rig.snap * e);

      // Orbit around the piano's vertical axis, with a slow bob.
      const angle = rig.orbit * 0.24 * Math.sin(rig.time * 0.11 + i * 1.7);
      _w.subVectors(_v, PIANO_CENTER).applyAxisAngle(UP, angle);
      _v.copy(PIANO_CENTER).add(_w);
      _v.y += rig.orbit * 0.04 * Math.sin(rig.time * 0.55 + i * 2.1);
      // World 2: the whole constellation turns as you read.
      if (rig.spin) _v.sub(PIANO_CENTER).applyAxisAngle(UP, rig.spin).add(PIANO_CENTER);
      // Before the burst the instrument trembles, building pressure.
      if (rig.tremble > 0.001) {
        _v.x += Math.sin(rig.time * 53 + i * 3.1) * 0.0035 * rig.tremble;
        _v.y += Math.sin(rig.time * 61 + i * 1.7) * 0.0045 * rig.tremble;
      }

      // Parts drift away from the cursor ray.
      _push.set(0, 0, 0);
      if (journey.pointer.mouse && rig.orbit > 0.01) {
        pointerRay.closestPointToPoint(_v, _w);
        const d = _w.distanceTo(_v);
        if (d < 0.9) _push.subVectors(_v, _w).normalize().multiplyScalar((0.9 - d) * 0.28 * rig.orbit);
      }
      push[i].lerp(_push, 0.08);
      g.position.copy(_v).add(push[i]);

      // Rotation: slerp to the exploded pose, mid-flight tumble, orbit wobble, snap to square.
      _qa.setFromEuler(assembled.rot);
      _qb.setFromEuler(part.exploded.rot);
      _q.slerpQuaternions(_qa, _qb, tum);
      const flight = Math.sin(tum * Math.PI);
      _e.set(
        flight * (seed.a - 0.5) * 0.9 + rig.orbit * 0.06 * Math.sin(rig.time * 0.21 + i),
        flight * (seed.b - 0.5) * 1.1 + rig.orbit * 0.12 * Math.sin(rig.time * 0.17 + i * 0.7),
        flight * (seed.a - seed.b) * 0.5,
      );
      _q.multiply(_qa.setFromEuler(_e));
      if (rig.snap > 0) _q.slerp(_qb.identity(), rig.snap * e);
      if (rig.spin) _q.premultiply(_qb.setFromAxisAngle(UP, rig.spin));
      g.quaternion.copy(_q);

      // The prop stays vertical on the rim while the lid swings, and retracts as it flies.
      if (part.hingePose) {
        const prop = props.get(part.id);
        if (prop) {
          prop.rotation.z = -rig.lid;
          prop.scale.y = Math.max(0.001, prop.userData.prop.reach * Math.sin(rig.lid) * (1 - e));
        }
      }

      const h = springs[i].h.get();
      g.scale.setScalar(1 + h * 0.035);
      // Exploded parts carry a fine gold edge light; the snap brightens it into a drawing.
      const glow = h + rig.anticipation * 0.55 + rig.burst * 0.25 + rig.dof * (0.16 + rig.snap * 0.22);
      part.materials.forEach((m) => (m.highlight.value = glow));
      g.updateMatrixWorld(true);

      // Labels: the hovered part, or every kind together during the snap.
      const node = labelNodes.get(part.id);
      if (node) {
        const drawing = DRAWING_LABELS.has(part.id) ? range(rig.snap, 0.55, 1) : 0;
        const opacity = Math.max(h, drawing) * (exploded ? 1 : 0);
        if (opacity > 0.01) {
          _v.set(0, 0, 0).applyMatrix4(g.matrixWorld).project(camera);
          visible.push({ node, x: ((_v.x + 1) / 2) * size.width, y: ((1 - _v.y) / 2) * size.height });
        }
        node.style.opacity = opacity.toFixed(3);
      }
    });

    // Diagram layout: one aligned column on the left, leaders run to each part,
    // rows pushed apart so no two labels ever overlap.
    if (visible.length) {
      const column = Math.max(16, size.width * 0.035);
      visible.sort((a, b) => a.y - b.y);
      let last = -Infinity;
      for (const entry of visible) {
        const y = Math.max(entry.y, last + 20);
        last = y;
        let width = textWidths.get(entry.node);
        if (width === undefined) {
          width = (entry.node.firstElementChild as HTMLElement | null)?.offsetWidth ?? 80;
          textWidths.set(entry.node, width);
        }
        // The leader angles up or down to meet its part when rows were pushed apart.
        const dx = Math.max(1, entry.x - column - width - 12);
        const dy = entry.y - y;
        entry.node.style.transform = `translate3d(${column.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
        entry.node.style.setProperty("--lead", `${Math.hypot(dx, dy).toFixed(1)}px`);
        const leader = entry.node.lastElementChild as HTMLElement | null;
        if (leader) leader.style.transform = `rotate(${Math.atan2(dy, dx).toFixed(4)}rad)`;
      }
      visible.length = 0;
    }

    // Fan the keys and hammers apart; skip the instance upload when nothing moved.
    const spread = rig.spread * (1 - rig.snap * 0.35);
    const s = spreadState.current;
    if (Math.abs(spread - s.spread) > 1e-5 || rig.wave > 1e-5 || s.wave > 1e-5) {
      for (const part of parts) for (const set of part.spread) applySpread(set, spread, rig.wave, rig.time);
      s.spread = spread;
      s.wave = rig.wave;
    }
  }, -1);

  return (
    <group onPointerOver={onOver} onPointerOut={onOut}>
      {parts.map((part) => (
        <primitive key={part.id} object={part.group} />
      ))}
    </group>
  );
}
