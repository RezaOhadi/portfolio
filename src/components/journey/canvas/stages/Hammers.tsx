"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  Group,
  InstancedBufferAttribute,
  InstancedMesh,
  MeshStandardMaterial,
  Matrix4,
  Points,
  Quaternion,
  ShaderMaterial,
  Vector3,
  type Material,
  type PerspectiveCamera,
  type SpotLight,
  type WebGLProgramParametersWithUniforms,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { PALETTE } from "../../config";
import { playNote } from "../../audio";
import { journey, range } from "../../store";
import { createMaterial, type FxMaterial } from "../piano/materials";
import { ease, rig } from "../rig";

/**
 * World 4, the Hammer World. 88 felt hammers on a gold rail, each under a
 * unison of three gold strings. They strike in slow motion, a wave rolling
 * along the row, and only the tones of one chord strike, so with sound on the
 * row plays an arpeggio rather than noise. Every impact throws felt fibres
 * and sets its strings ringing. Hovering a performance drops into bullet time.
 */

export const HAMMERS = { count: 88, spacing: 0.36, pivotZ: 1.5, stringY: 0.92, shank: 1.5 } as const;
const HEAD = new Vector3(0.2, 0.44, 0.34);
/** Db major 7: Db, F, Ab, C. */
const CHORD = new Set([1, 5, 8, 0]);
const CONTACT = 0.16;
const STRIKE_ANGLE = 0.42;
const FIBRES = 1400;

const xOf = (i: number) => (i - (HAMMERS.count - 1) / 2) * HAMMERS.spacing;

const _m = new Matrix4();
const _q = new Quaternion();
const _p = new Vector3();
const _s = new Vector3(1, 1, 1);
const _head = new Vector3();
const X_AXIS = new Vector3(1, 0, 0);

/** Rise fast to the string, fall back slowly: the hammer's arc as a function of its cycle phase. */
function arc(phase: number) {
  if (phase < CONTACT) {
    const u = phase / CONTACT;
    return u * u;
  }
  if (phase < 0.55) return 1 - ease.settle((phase - CONTACT) / (0.55 - CONTACT));
  return 0;
}

/** Strings ring as a standing wave: displaced in the vertex shader, glowing while they move. */
function ringingStrings(fx: FxMaterial, time: { value: number }) {
  const base = fx.material.onBeforeCompile;
  fx.material.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms, renderer) => {
    base.call(fx.material, shader, renderer);
    shader.uniforms.uRing = time;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nuniform float uRing;")
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        #ifdef FX_PRESS
          float ringU = position.y + 0.5;
          transformed.z += sin(3.14159 * ringU) * sin(uRing * 38.0 + float(gl_InstanceID) * 1.7) * aPress * 0.045;
        #endif`,
      );
  };
  fx.material.customProgramCacheKey = () => "fx-press-ring";
}

export function Hammers() {
  const root = useRef<Group>(null);
  const lamp = useRef<SpotLight>(null);
  const ringTime = useMemo(() => ({ value: 0 }), []);

  const built = useMemo(() => {
    const felt = createMaterial("felt", { press: true, rim: 0.35 });
    (felt.material as MeshStandardMaterial).color.set("#bdb3a0");
    const under = createMaterial("darkFelt", { rim: 0.2 });
    const wood = createMaterial("keywood", { rim: 0.25 });
    const gold = createMaterial("gold");
    const strings = createMaterial("string", { press: true });
    ringingStrings(strings, ringTime);

    const heads = new InstancedMesh(new RoundedBoxGeometry(HEAD.x, HEAD.y, HEAD.z, 3, 0.085), felt.material as Material, HAMMERS.count);
    heads.geometry.setAttribute("aPress", new InstancedBufferAttribute(new Float32Array(HAMMERS.count), 1));
    const underGeo = new BoxGeometry(HEAD.x * 0.92, 0.1, HEAD.z * 0.92);
    const unders = new InstancedMesh(underGeo, under.material as Material, HAMMERS.count);
    const shankGeo = new CylinderGeometry(0.026, 0.03, HAMMERS.shank, 8);
    shankGeo.rotateX(Math.PI / 2);
    const shanks = new InstancedMesh(shankGeo, wood.material as Material, HAMMERS.count);
    const stringGeo = new CylinderGeometry(0.0065, 0.0065, 1, 6, 24, true);
    const stringCount = HAMMERS.count * 3;
    const stringMesh = new InstancedMesh(stringGeo, strings.material as Material, stringCount);
    stringMesh.geometry.setAttribute("aPress", new InstancedBufferAttribute(new Float32Array(stringCount), 1));
    const length = 7.5;
    _q.setFromAxisAngle(X_AXIS, Math.PI / 2);
    for (let i = 0; i < HAMMERS.count; i++) {
      for (let k = 0; k < 3; k++) {
        _p.set(xOf(i) + (k - 1) * 0.055, HAMMERS.stringY, -0.6);
        _m.compose(_p, _q, _s.set(1, length, 1));
        stringMesh.setMatrixAt(i * 3 + k, _m);
      }
    }
    _s.set(1, 1, 1);
    const rail = new BoxGeometry(HAMMERS.count * HAMMERS.spacing + 1, 0.08, 0.16);
    rail.translate(0, -0.02, HAMMERS.pivotZ);
    [heads, unders, shanks, stringMesh].forEach((m) => (m.frustumCulled = false));

    // Felt fibres thrown off each impact.
    const fibre = {
      position: new Float32Array(FIBRES * 3),
      velocity: new Float32Array(FIBRES * 3),
      life: new Float32Array(FIBRES),
      cursor: 0,
    };
    const fibreGeo = new BufferGeometry();
    fibreGeo.setAttribute("position", new BufferAttribute(fibre.position, 3));
    fibreGeo.setAttribute("life", new BufferAttribute(fibre.life, 1));
    const fibreMat = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: { uScale: { value: 1 }, uColor: { value: new Color(PALETTE.goldHot).convertSRGBToLinear() } },
      vertexShader: /* glsl */ `
        attribute float life;
        uniform float uScale;
        varying float vLife;
        void main(){
          vLife = life;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = life > 0.0 ? clamp(0.022 * uScale * (0.5 + life) / -mv.z, 1.0, 10.0) : 0.0;
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        varying float vLife;
        void main(){
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5 || vLife <= 0.0) discard;
          float a = smoothstep(0.5, 0.0, d) * smoothstep(0.0, 0.3, vLife);
          vec3 c = mix(vec3(1.0, 0.97, 0.9), uColor, 0.5) * (1.2 + vLife * 1.8);
          gl_FragColor = vec4(c * a, a);
        }`,
    });
    const fibres = new Points(fibreGeo, fibreMat);
    fibres.frustumCulled = false;

    const hammers = Array.from({ length: HAMMERS.count }, (_, i) => ({
      x: xOf(i),
      midi: 21 + i,
      chord: CHORD.has((21 + i) % 12),
      phase: 0,
      glow: 0,
    }));
    return { felt, under, wood, gold, strings, heads, unders, shanks, stringMesh, rail, fibres, fibre, fibreGeo, fibreMat, hammers, materials: [felt, under, wood, gold, strings] };
  }, [ringTime]);

  useEffect(
    () => () => {
      built.materials.forEach((m) => m.material.dispose());
      [built.heads, built.unders, built.shanks, built.stringMesh].forEach((m) => m.geometry.dispose());
      built.rail.dispose();
      built.fibreGeo.dispose();
      built.fibreMat.dispose();
    },
    [built],
  );

  useFrame((state, delta) => {
    const group = root.current;
    if (!group) return;
    group.visible = rig.show.hammers;
    if (!group.visible) return;
    const dt = Math.min(delta, 1 / 30);
    const camX = state.camera.position.x;
    const t = rig.hammerTime;
    ringTime.value = t;
    // The row rises out of the dark as the twist lands.
    const rise = journey.reduced ? 1 : ease.recoil(range(rig.twist, 0.5, 1));
    const headPress = built.heads.geometry.getAttribute("aPress") as InstancedBufferAttribute;
    const ring = built.stringMesh.geometry.getAttribute("aPress") as InstancedBufferAttribute;
    const sound = journey.sound && rig.hammers > 0.02;

    for (let i = 0; i < built.hammers.length; i++) {
      const h = built.hammers[i];
      const wake = Math.min(1, Math.max(0, rise * 1.6 - Math.abs(h.x - camX) * 0.05));
      const drop = (1 - ease.burst(wake)) * -2.4;
      let theta = Math.sin(t * 0.7 + i * 0.5) * 0.015;
      if (h.chord && !journey.reduced) {
        const phase = (t * 0.18 - h.x * 0.035 + 10) % 1;
        if (h.phase < CONTACT && phase >= CONTACT && wake > 0.9) {
          // Impact: felt fibres fly, the unison rings, and nearby strikes sound.
          for (let k = 0; k < 3; k++) ring.setX(i * 3 + k, 1);
          h.glow = 1;
          _head.set(h.x, HAMMERS.stringY - 0.06, 0);
          for (let n = 0; n < 22; n++) {
            const j = built.fibre.cursor;
            built.fibre.cursor = (j + 1) % FIBRES;
            built.fibre.position.set([_head.x + (Math.random() - 0.5) * 0.12, _head.y, _head.z + (Math.random() - 0.5) * 0.2], j * 3);
            built.fibre.velocity.set([(Math.random() - 0.5) * 0.9, 0.4 + Math.random() * 1.1, (Math.random() - 0.5) * 0.9], j * 3);
            built.fibre.life[j] = 1;
          }
          if (sound && Math.abs(h.x - camX) < 3.6) playNote(h.midi, 0.3, 3.2);
        }
        h.phase = phase;
        theta += arc(phase) * STRIKE_ANGLE;
      }
      h.glow *= Math.exp(-dt * 2.2);
      headPress.setX(i, h.glow * 0.8);

      // Hammer about its flange pivot: shank, felt head, underfelt.
      _q.setFromAxisAngle(X_AXIS, theta);
      _p.set(0, 0, -HAMMERS.shank / 2).applyQuaternion(_q);
      _p.x += h.x;
      _p.y += drop;
      _p.z += HAMMERS.pivotZ;
      _m.compose(_p, _q, _s);
      built.shanks.setMatrixAt(i, _m);
      _p.set(0, HEAD.y / 2 + 0.02, -HAMMERS.shank).applyQuaternion(_q);
      _p.x += h.x;
      _p.y += drop;
      _p.z += HAMMERS.pivotZ;
      _m.compose(_p, _q, _s);
      built.heads.setMatrixAt(i, _m);
      _p.set(0, -0.01, -HAMMERS.shank).applyQuaternion(_q);
      _p.x += h.x;
      _p.y += drop;
      _p.z += HAMMERS.pivotZ;
      _m.compose(_p, _q, _s);
      built.unders.setMatrixAt(i, _m);
    }
    for (let j = 0; j < ring.count; j++) ring.setX(j, ring.getX(j) * Math.exp(-dt * 0.8 * rig.timeScale) * (rise > 0.5 ? 1 : 0));
    [built.heads, built.unders, built.shanks].forEach((m) => (m.instanceMatrix.needsUpdate = true));
    headPress.needsUpdate = true;
    ring.needsUpdate = true;

    // Fibres: drift up, slow, fall, fade; frozen with everything else in bullet time.
    const f = built.fibre;
    const step = dt * rig.timeScale;
    for (let j = 0; j < FIBRES; j++) {
      if (f.life[j] <= 0) continue;
      f.life[j] -= step * 0.55;
      f.velocity[j * 3 + 1] -= step * 0.9;
      for (let a = 0; a < 3; a++) {
        f.velocity[j * 3 + a] *= Math.exp(-step * 1.6);
        f.position[j * 3 + a] += f.velocity[j * 3 + a] * step;
      }
    }
    built.fibreGeo.attributes.position.needsUpdate = true;
    built.fibreGeo.attributes.life.needsUpdate = true;
    const cam = state.camera as PerspectiveCamera;
    built.fibreMat.uniforms.uScale.value = (state.size.height * state.gl.getPixelRatio()) / 2 / Math.tan((cam.fov * Math.PI) / 360);

    if (lamp.current) {
      lamp.current.position.set(camX + 0.6, 4.2, 1.6);
      lamp.current.target.position.set(camX + 0.8, 0.4, 0);
      lamp.current.target.updateMatrixWorld();
    }
  }, -1);

  return (
    <group ref={root} visible={false}>
      <primitive object={built.heads} />
      <primitive object={built.unders} />
      <primitive object={built.shanks} />
      <primitive object={built.stringMesh} />
      <mesh geometry={built.rail} material={built.gold.material} />
      <primitive object={built.fibres} />
      <spotLight ref={lamp} color={PALETTE.goldHot} intensity={42} angle={0.5} penumbra={0.85} distance={14} decay={1.6} />
    </group>
  );
}
