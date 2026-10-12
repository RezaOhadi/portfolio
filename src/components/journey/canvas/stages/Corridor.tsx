"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  BoxGeometry,
  Color,
  MathUtils,
  Group,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
  type Material,
  type PointLight,
} from "three";
import { PALETTE } from "../../config";
import { playNote } from "../../audio";
import { journey, range } from "../../store";
import { createMaterial, type FxMaterial } from "../piano/materials";
import { pointerRay } from "../PianoParts";
import { ease, rig } from "../rig";

/**
 * World 3, the Keyboard Corridor. A keyboard unfolds into a square tunnel
 * lined with keys on all four sides (floor, walls, ceiling), endless along
 * -z: the stage snaps forward one octave at a time behind the camera. Keys
 * sit on springs; a wave presses them ahead of the camera (harder when you
 * scroll fast, so a fast scroll is a glissando) and the cursor presses the
 * keys it touches. Pressed keys glow gold and, with sound on, sound.
 */

export const CORRIDOR = { half: 0.9, centerY: 1, pitch: 0.235, start: 4, whites: 128 } as const;
const OCTAVE = CORRIDOR.pitch * 7;
const WHITE = new Vector3(CORRIDOR.half * 2 * 0.985, 0.18, CORRIDOR.pitch - 0.014);
const BLACK = new Vector3(1.04, 0.13, 0.135);
/** Black keys follow whites 0, 1, 3, 4, 5 of each octave (C#, D#, F#, G#, A#). */
const BLACK_AFTER = [0, 1, 3, 4, 5];
const BLACK_NUDGE = [-0.15, 0.15, -0.18, 0, 0.18];
const SCALE = [0, 2, 4, 5, 7, 9, 11];

interface Key {
  z: number;
  black: boolean;
  midi: number;
  p: number;
  v: number;
  sounded: boolean;
}

interface Side {
  pivot: Group;
  child: Group;
  whites: InstancedMesh;
  blacks: InstancedMesh;
  white: Key[];
  black: Key[];
  /** Local inward normal and the axis keys run along, to find cursor hits. */
  index: number;
}

function layout(): { white: Omit<Key, "p" | "v" | "sounded">[]; black: Omit<Key, "p" | "v" | "sounded">[] } {
  const white = [];
  const black = [];
  for (let i = 0; i < CORRIDOR.whites; i++) {
    const z = CORRIDOR.start - i * CORRIDOR.pitch;
    const octave = Math.floor(i / 7);
    const degree = i % 7;
    white.push({ z, black: false, midi: 36 + (octave % 5) * 12 + SCALE[degree] });
    const b = BLACK_AFTER.indexOf(degree);
    if (b >= 0 && i < CORRIDOR.whites - 1) {
      black.push({ z: z - CORRIDOR.pitch * (0.5 + BLACK_NUDGE[b]), black: true, midi: 37 + (octave % 5) * 12 + SCALE[degree] });
    }
  }
  return { white, black };
}

const _m = new Matrix4();
const _q = new Quaternion();
const _p = new Vector3();
const _s = new Vector3(1, 1, 1);
const _gone = new Vector3(0, 0, 0);
const Z_AXIS = new Vector3(0, 0, 1);

export function Corridor() {
  const root = useRef<Group>(null);
  const light = useRef<PointLight>(null);
  // The brightest key glow of the last moments, eased: the twist never lets the corridor fall below 60% of it.
  const glowPeak = useRef(0);
  const beacon = useRef<Group>(null);

  const built = useMemo(() => {
    const { white, black } = layout();
    const whiteGeo = new BoxGeometry(WHITE.x, WHITE.y, WHITE.z);
    whiteGeo.translate(0, -WHITE.y / 2, 0);
    const blackGeo = new BoxGeometry(BLACK.x, BLACK.y, BLACK.z);
    blackGeo.translate(0, BLACK.y / 2 - 0.02, 0);
    const materials: FxMaterial[] = [];
    // Keys in the tunnel sit in shadow; only the lamp and pressed keys bring them up.
    const ivory = createMaterial("ivory", { press: true, rim: 0.35 });
    (ivory.material as MeshStandardMaterial).color.set("#4f4a42");
    (ivory.material as MeshStandardMaterial).envMapIntensity = 0.35;
    const ebony = createMaterial("ebony", { press: true, rim: 0.55 });
    materials.push(ivory, ebony);
    const sides: Side[] = [];
    const h = CORRIDOR.half;
    // Floor, right wall, ceiling, left wall. Walls hinge on the floor's edges; the ceiling on the right wall.
    for (let index = 0; index < 4; index++) {
      const pivot = new Group();
      const child = new Group();
      pivot.add(child);
      const make = (keys: typeof white, geo: BoxGeometry, mat: FxMaterial) => {
        const mesh = new InstancedMesh(geo.clone(), mat.material as Material, keys.length);
        mesh.geometry.setAttribute("aPress", new InstancedBufferAttribute(new Float32Array(keys.length), 1));
        mesh.frustumCulled = false;
        child.add(mesh);
        return mesh;
      };
      const side: Side = {
        pivot,
        child,
        whites: make(white, whiteGeo, ivory),
        blacks: make(black, blackGeo, ebony),
        white: white.map((k) => ({ ...k, p: 0, v: 0, sounded: false })),
        black: black.map((k) => ({ ...k, p: 0, v: 0, sounded: false })),
        index,
      };
      sides.push(side);
    }
    // Hinges: floor flat at the base; walls pivot on its edges; ceiling on the right wall's far edge.
    sides[0].pivot.position.set(0, CORRIDOR.centerY - h, 0);
    sides[1].pivot.position.set(h, CORRIDOR.centerY - h, 0);
    sides[1].child.position.set(h, 0, 0);
    sides[3].pivot.position.set(-h, CORRIDOR.centerY - h, 0);
    sides[3].child.position.set(-h, 0, 0);
    sides[1].child.add(sides[2].pivot);
    sides[2].pivot.position.set(h, 0, 0);
    sides[2].child.position.set(h, 0, 0);
    // Black keys sit at the +x end of every side, so they spiral round the tunnel.
    const blackX = h - BLACK.x / 2 - 0.02;
    return { sides, materials, blackX };
  }, []);

  const beaconMaterial = useMemo(() => new MeshBasicMaterial({ color: new Color(PALETTE.goldHot).multiplyScalar(6), toneMapped: false, fog: false }), []);

  useEffect(
    () => () => {
      built.materials.forEach((m) => m.material.dispose());
      built.sides.forEach((s) => {
        s.whites.geometry.dispose();
        s.blacks.geometry.dispose();
      });
      beaconMaterial.dispose();
    },
    [built, beaconMaterial],
  );

  useFrame((state, delta) => {
    const group = root.current;
    if (!group) return;
    group.visible = rig.show.corridor;
    // The lamp lives outside the group and only goes dark: a light leaving the scene
    // changes every lit shader, and they would all recompile in the middle of the cut.
    // Light changes crossfade instead of switching.
    const fade = Math.min(delta, 1 / 20);
    if (!group.visible) {
      if (light.current) light.current.intensity = MathUtils.damp(light.current.intensity, 0, 14, fade);
      return;
    }
    const dt = Math.min(delta, 1 / 30);
    // As the keys swing up into blades their lit faces turn away and their glow settles:
    // during the twist each key keeps most of the recent peak glow, eased in with the swing, and the
    // lamp lifts to make up for the faces turning away, so the corridor never falls below 60%.
    const swing = MathUtils.smoothstep(rig.fin, 0, 0.6);
    const floor = glowPeak.current * 0.9 * swing;
    let peak = 0;
    const cam = state.camera.position;

    // Endless: the stage advances an octave at a time, invisibly, behind the camera.
    group.position.z = Math.floor(cam.z / OCTAVE) * OCTAVE;

    // The keyboard folds into a tunnel: walls rise off the floor, then the ceiling closes.
    const walls = journey.reduced ? 1 : ease.recoil(range(rig.dive, 0.5, 0.8));
    const roof = journey.reduced ? 1 : ease.recoil(range(rig.dive, 0.62, 0.95));
    built.sides[1].pivot.rotation.z = walls * Math.PI * 0.5;
    built.sides[3].pivot.rotation.z = -walls * Math.PI * 0.5;
    built.sides[2].pivot.rotation.z = roof * Math.PI * 0.5;
    // Twist (World 3 -> 4) is handled by the hammer stage; the corridor fades with it.

    // Cursor hit on the tunnel: nearest wall plane in front of the ray.
    let hitSide = -1;
    let hitZ = 0;
    if (journey.pointer.mouse) {
      const o = pointerRay.origin, d = pointerRay.direction, h = CORRIDOR.half, cy = CORRIDOR.centerY;
      let best = Infinity;
      const planes: [number, number, number][] = [
        [1, cy - h, 0], // floor: y = cy - h
        [0, h, 1], // right wall: x = +h
        [1, cy + h, 2], // ceiling
        [0, -h, 3], // left wall
      ];
      for (const [axis, value, side] of planes) {
        const dc = axis === 1 ? d.y : d.x;
        const oc = axis === 1 ? o.y : o.x;
        if (Math.abs(dc) < 1e-4) continue;
        const t = (value - oc) / dc;
        if (t > 0.05 && t < best) {
          best = t;
          hitSide = side;
          hitZ = o.z + d.z * t - group.position.z;
        }
      }
    }

    // Scrolling fast drives a harder wave: a glissando down the corridor.
    const drive = 0.24 + rig.velocity * 0.76;
    const ahead = cam.z - group.position.z;
    const k = 240;
    const c = 2 * Math.sqrt(k) * 0.55;
    const sound = journey.sound && rig.corridor > 0.02;

    for (const side of built.sides) {
      const update = (keys: Key[], mesh: InstancedMesh, black: boolean) => {
        const attr = mesh.geometry.getAttribute("aPress") as InstancedBufferAttribute;
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          const dist = ahead - key.z;
          let target = 0;
          if (!journey.reduced) {
            const window = Math.max(0, 1 - Math.abs(dist - 2.6) / 1.6);
            const ripple = Math.max(0, Math.sin(key.z * 2.7 - rig.time * 4.2 + side.index * 1.3));
            target = window * ripple * drive;
            if (side.index === hitSide && Math.abs(key.z - hitZ) < 0.42) target = Math.max(target, 1 - Math.abs(key.z - hitZ) / 0.42);
          }
          key.v += (k * (target - key.p) - c * key.v) * dt;
          key.p += key.v * dt;
          const p = Math.max(0, key.p);
          if (sound && side.index === 0 && !key.sounded && p > 0.55) {
            playNote(key.midi, 0.28 + p * 0.25, 1.6);
            key.sounded = true;
          } else if (key.sounded && p < 0.2) key.sounded = false;
          // Keys pivot at their black-key end, so the near end dips into the wall.
          // The twist swings every key up off its pivot into a standing blade.
          const theta = 0.075 * p - rig.fin * 1.2;
          const pivotX = CORRIDOR.half;
          const x = black ? built.blackX : 0;
          _q.setFromAxisAngle(Z_AXIS, theta);
          _p.set(x - pivotX, 0, 0).applyQuaternion(_q);
          _p.x += pivotX;
          _p.z = key.z;
          // A blade swinging up level with the camera would sweep across the lens and black out
          // the frame for a moment: during the twist, the keys beside the lens step aside.
          const atLens = rig.fin > 0.02 && Math.abs(dist) < 0.55;
          _m.compose(_p, _q, atLens ? _gone : _s);
          mesh.setMatrixAt(i, _m);
          peak = Math.max(peak, p);
          attr.setX(i, Math.max(p, floor) * (black ? 0.8 : 0.55));
        }
        mesh.instanceMatrix.needsUpdate = true;
        attr.needsUpdate = true;
      };
      update(side.white, side.whites, false);
      update(side.black, side.blacks, true);
    }

    // The peak is held through the twist and only tracked while the keys lie flat.
    if (rig.fin < 0.02) glowPeak.current = MathUtils.damp(glowPeak.current, peak, 3, dt);

    // A travelling gold lamp, and a light at the far end of the corridor.
    if (light.current) {
      light.current.position.set(0, CORRIDOR.centerY + 0.2, cam.z - 1.6);
      light.current.intensity = MathUtils.damp(light.current.intensity, (2.6 + rig.velocity * 3) * (1 + swing * 0.9), 14, fade);
    }
    if (beacon.current) beacon.current.position.set(0, CORRIDOR.centerY, cam.z - 24 - group.position.z);
  }, -1);

  return (
    <>
    <pointLight ref={light} color={PALETTE.goldHot} intensity={0} distance={9} decay={1.4} />
    <group ref={root} visible={false}>
      {built.sides.map((side, i) => (i === 2 ? null : <primitive key={i} object={side.pivot} />))}
      <group ref={beacon}>
        <mesh material={beaconMaterial}>
          <sphereGeometry args={[0.16, 24, 16]} />
        </mesh>
      </group>
    </group>
    </>
  );
}

