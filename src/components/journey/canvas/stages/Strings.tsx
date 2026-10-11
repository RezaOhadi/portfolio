"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  BoxGeometry,
  Color,
  CylinderGeometry,
  Group,
  InstancedBufferAttribute,
  InstancedMesh,
  MeshStandardMaterial,
  Matrix4,
  Plane,
  Quaternion,
  Vector3,
  type Material,
  type WebGLProgramParametersWithUniforms,
} from "three";
import { playNote } from "../../audio";
import { journey, range } from "../../store";
import { createMaterial, type FxMaterial } from "../piano/materials";
import { pointerRay } from "../PianoParts";
import { ease, rig } from "../rig";
import { STRINGS, stringAmp, stringMidi, stringTime } from "./stringLayout";

/**
 * World 5, the Strings. 216 gold strings (copper-wound bass crossing over the
 * tenor), each a standing wave in the vertex shader that glows while it
 * rings. The cursor plucks the strings it crosses, like a harp, at each
 * string's own pitch; a damper over each pair lifts while it rings and drops
 * to silence it; hovering a concert strums a chord across the whole set.
 */

const _m = new Matrix4();
const _q = new Quaternion();
const _qy = new Quaternion();
const _p = new Vector3();
const _s = new Vector3();
const _hit = new Vector3();
const X_AXIS = new Vector3(1, 0, 0);
const Y_AXIS = new Vector3(0, 1, 0);
const PLANE = new Plane(new Vector3(0, 1, 0), -STRINGS.y);
/** Ab major add9, strummed low to high when a concert is hovered. */
const STRUM = [44, 51, 56, 60, 63, 68, 70, 75];
/** Dampers sit near the player end of the strings, where the camera arrives high. */
const DAMPER_Z = 5.9;

export const stringX = (i: number) => STRINGS.x0 + i * STRINGS.dx;

/** Standing wave: two modes, displaced in the strings' local z (world y after the rotation). */
function standingWave(fx: FxMaterial) {
  const base = fx.material.onBeforeCompile;
  fx.material.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms, renderer) => {
    base.call(fx.material, shader, renderer);
    shader.uniforms.uRing = stringTime;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nuniform float uRing;")
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        #ifdef FX_PRESS
          float u = position.y + 0.5;
          float ph = float(gl_InstanceID) * 1.71;
          transformed.z += aPress * 0.05 * (sin(3.14159 * u) * sin(uRing * 24.0 + ph) + 0.35 * sin(6.28318 * u) * sin(uRing * 48.0 + ph * 1.3));
        #endif`,
      );
  };
  fx.material.customProgramCacheKey = () => "fx-press-wave";
}

export function Strings() {
  const root = useRef<Group>(null);
  const state = useRef({ prev: new Vector3(), hasPrev: false, strum: 0, queue: [] as { at: number; i: number }[] });

  const built = useMemo(() => {
    const gold = createMaterial("string", { press: true });
    standingWave(gold);
    // At rest the strings are dark bronze; ringing lights them gold.
    (gold.material as MeshStandardMaterial).color.set("#8a6d47");
    (gold.material as MeshStandardMaterial).envMapIntensity = 0.75;
    const felt = createMaterial("darkFelt", { rim: 0.25 });
    const wood = createMaterial("keywood", { rim: 0.3 });
    const brass = createMaterial("gold");

    const mesh = new InstancedMesh(new CylinderGeometry(0.0055, 0.0055, 1, 5, 48, true), gold.material as Material, STRINGS.count);
    mesh.geometry.setAttribute("aPress", new InstancedBufferAttribute(new Float32Array(STRINGS.count), 1));
    const base: Matrix4[] = [];
    const bassTint = new Color("#b77a48");
    const white = new Color(1, 1, 1);
    for (let i = 0; i < STRINGS.count; i++) {
      const bass = i < STRINGS.bass;
      _q.setFromAxisAngle(X_AXIS, Math.PI / 2);
      if (bass) _q.premultiply(_qy.setFromAxisAngle(Y_AXIS, STRINGS.bassAngle));
      const thickness = bass ? 1.9 : i < STRINGS.count * 0.6 ? 1.1 : 0.8;
      _p.set(stringX(i) + (bass ? 0.55 : 0), STRINGS.y + (bass ? STRINGS.bassLift : 0), STRINGS.z0 - STRINGS.length / 2);
      _m.compose(_p, _q, _s.set(thickness, STRINGS.length, thickness));
      mesh.setMatrixAt(i, _m);
      base.push(_m.clone());
      mesh.setColorAt(i, bass ? bassTint : white);
    }
    mesh.frustumCulled = false;

    // A damper over each pair of strings, near the player's end.
    const pairs = Math.ceil(STRINGS.count / 2);
    const dampers = new InstancedMesh(new BoxGeometry(STRINGS.dx * 1.7, 0.03, 0.12), felt.material as Material, pairs);
    const heads = new InstancedMesh(new BoxGeometry(STRINGS.dx * 1.7, 0.045, 0.08), wood.material as Material, pairs);
    [dampers, heads].forEach((m) => (m.frustumCulled = false));
    const bars = [new BoxGeometry(9.4, 0.05, 0.12), new BoxGeometry(9.4, 0.06, 0.16)];
    bars[0].translate(0.15, STRINGS.y - 0.03, STRINGS.z0 - 0.15);
    bars[1].translate(0.15, STRINGS.y - 0.04, STRINGS.z0 - STRINGS.length + 0.2);

    const amp = new Float32Array(STRINGS.count);
    const lift = new Float32Array(pairs);
    return { gold, felt, wood, brass, mesh, base, dampers, heads, bars, amp, lift, pairs, broken: 0, materials: [gold, felt, wood, brass] };
  }, []);

  useEffect(
    () => () => {
      built.materials.forEach((m) => m.material.dispose());
      [built.mesh, built.dampers, built.heads].forEach((m) => m.geometry.dispose());
      built.bars.forEach((b) => b.dispose());
    },
    [built],
  );

  // Hovering a concert strums a chord across the strings.
  useEffect(() => {
    const onStrum = () => {
      const s = state.current;
      const now = rig.time;
      STRUM.forEach((midi, n) => {
        const i = Math.round(((midi - 24) / 72) * (STRINGS.count - 1));
        s.queue.push({ at: now + n * 0.07, i });
      });
    };
    window.addEventListener("journey:strum", onStrum);
    return () => window.removeEventListener("journey:strum", onStrum);
  }, []);

  useFrame((_, delta) => {
    const group = root.current;
    if (!group) return;
    group.visible = rig.show.strings;
    if (!group.visible) return;
    const dt = Math.min(delta, 1 / 30);
    const s = state.current;
    stringTime.value = rig.time;
    const sound = journey.sound && rig.strings > 0.01;
    const amp = built.amp;
    const pluck = (i: number, strength: number) => {
      if (i < 0 || i >= STRINGS.count) return;
      if (amp[i] < strength * 0.7 && sound) playNote(stringMidi(i), 0.25 + strength * 0.35, 3.5);
      amp[i] = Math.max(amp[i], strength);
    };

    // Harp: pluck every string the cursor crosses on the string plane.
    if (journey.pointer.mouse && !journey.reduced && pointerRay.intersectPlane(PLANE, _hit)) {
      const onStrings = _hit.z < STRINGS.z0 && _hit.z > STRINGS.z0 - STRINGS.length;
      if (s.hasPrev && onStrings) {
        // Every string whose line lies between the last cursor hit and this one.
        const a = Math.ceil((Math.min(s.prev.x, _hit.x) - STRINGS.x0) / STRINGS.dx);
        const b = Math.floor((Math.max(s.prev.x, _hit.x) - STRINGS.x0) / STRINGS.dx);
        for (let i = Math.max(0, a), n = 0; i <= Math.min(STRINGS.count - 1, b) && n < 10; i++, n++) pluck(i, 0.95);
      }
      s.prev.copy(_hit);
      s.hasPrev = onStrings;
    } else s.hasPrev = false;

    // Strums queued by concert hovers.
    for (let q = s.queue.length - 1; q >= 0; q--) {
      if (rig.time >= s.queue[q].at) {
        pluck(s.queue[q].i, 1);
        s.queue.splice(q, 1);
      }
    }

    // The camera's passage stirs the strings ahead of it, harder when you scroll fast.
    if (!journey.reduced && Math.random() < 0.08 + rig.velocity * 0.6) {
      pluck(Math.floor(Math.random() * STRINGS.count), 0.18 + rig.velocity * 0.5);
    }

    const attr = built.mesh.geometry.getAttribute("aPress") as InstancedBufferAttribute;
    // The dissolve (World 5 -> 6) lets every string go slack as it breaks into dust.
    const slack = 1 - range(rig.dissolve, 0.1, 0.5);
    for (let i = 0; i < STRINGS.count; i++) {
      amp[i] *= Math.exp(-dt * 0.55);
      attr.setX(i, amp[i] * slack);
      stringAmp.data[i] = amp[i] * slack;
    }
    attr.needsUpdate = true;
    stringAmp.texture.needsUpdate = true;

    // Dissolve: strings break from the centre outwards, each thinning to nothing as its dust falls.
    if (rig.dissolve > 0.001 || built.broken > 0.001) {
      const centre = (STRINGS.count - 1) / 2;
      for (let i = 0; i < STRINGS.count; i++) {
        const delay = (Math.abs(i - centre) / centre) * 0.35;
        const k = Math.max(0.001, 1 - ease.recoil(range(rig.dissolve, 0.06 + delay, 0.26 + delay)));
        built.base[i].decompose(_p, _q, _s);
        _s.x *= k;
        _s.z *= k;
        _m.compose(_p, _q, _s);
        built.mesh.setMatrixAt(i, _m);
      }
      built.mesh.instanceMatrix.needsUpdate = true;
      built.broken = rig.dissolve;
    }

    // Dampers: lift while their pair rings, fall to silence it.
    for (let d = 0; d < built.pairs; d++) {
      const ringing = Math.max(amp[d * 2] ?? 0, amp[d * 2 + 1] ?? 0);
      const target = ringing > 0.08 ? 1 : 0;
      built.lift[d] += (target - built.lift[d]) * (1 - Math.exp(-dt * (target ? 14 : 6)));
      const x = stringX(d * 2) + STRINGS.dx / 2 + (d * 2 < STRINGS.bass ? 0.55 : 0);
      const y = STRINGS.y + 0.022 + built.lift[d] * 0.12;
      _m.compose(_p.set(x, y, DAMPER_Z), _q.identity(), _s.set(1, 1, 1));
      built.dampers.setMatrixAt(d, _m);
      _m.compose(_p.set(x, y + 0.036, DAMPER_Z), _q, _s);
      built.heads.setMatrixAt(d, _m);
    }
    built.dampers.instanceMatrix.needsUpdate = true;
    built.heads.instanceMatrix.needsUpdate = true;

    // Arrival from the portal: strings draw out from the near bar towards the far bridge.
    const draw = journey.reduced ? 1 : ease.recoil(range(rig.portal, 0.5, 0.95));
    group.scale.set(1, 1, Math.max(0.001, draw));
    group.position.z = STRINGS.z0 * (1 - draw);
  }, -1);

  return (
    <group ref={root} visible={false}>
      <primitive object={built.mesh} />
      <primitive object={built.dampers} />
      <primitive object={built.heads} />
      <mesh geometry={built.bars[0]} material={built.brass.material} />
      <mesh geometry={built.bars[1]} material={built.brass.material} />
    </group>
  );
}
