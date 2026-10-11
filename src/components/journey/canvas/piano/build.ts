import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  CylinderGeometry,
  Euler,
  ExtrudeGeometry,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  Quaternion,
  ShapeGeometry,
  SphereGeometry,
  TubeGeometry,
  Vector3,
  type Material,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
import { createMaterial, type FxMaterial, type MaterialKind } from "./materials";
import { depthAt, ellipse, planShape, RIM, RIM_TOP, rimPoints } from "./outline";

/** Spread channels let the particle shader follow keys and hammers as they fan apart. */
export const CHANNEL = { none: 0, keys: 1, hammers: 2 } as const;

export interface SpreadSet {
  mesh: InstancedMesh;
  /** Absolute instance matrices of the assembled piano. */
  base: Matrix4[];
  /** Absolute x of each instance, the spread and wave key. */
  xs: number[];
  channel: 1 | 2;
}

export interface PartSamples {
  /** xyz in the part's local space. */
  local: Float32Array;
  /** channel, aux (absolute x for spread channels). */
  meta: Float32Array;
}

export interface Pose {
  pos: Vector3;
  rot: Euler;
}

export interface PianoPart {
  id: string;
  label: string;
  /** Note played when the part is hovered (sound on). */
  midi: number;
  group: Group;
  assembled: Pose;
  exploded: Pose;
  /** Axis-aligned "technical drawing" pose used by the World 2 snap. */
  drawing: Pose;
  /** Explode stagger, 0..~0.3 of the transition. */
  delay: number;
  weight: number;
  materials: FxMaterial[];
  spread: SpreadSet[];
  sample(count: number, random: () => number): PartSamples;
  /** Where the label leader line attaches, in part-local space. */
  anchor: Vector3;
  /** Hinged parts (the lid): assembled pose for a given opening angle. */
  hingePose?: (angle: number, out: Pose) => void;
}

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ helpers */

const KEY_TOP = 0.745;
const STRING_Y = 0.885;

function stripGeometry(a: Vector3[], b: Vector3[], flip: boolean) {
  const positions = new Float32Array(a.length * 2 * 3);
  a.forEach((p, i) => {
    positions.set([p.x, p.y, p.z], i * 6);
    positions.set([b[i].x, b[i].y, b[i].z], i * 6 + 3);
  });
  const index: number[] = [];
  for (let i = 0; i < a.length - 1; i++) {
    const a0 = i * 2, b0 = i * 2 + 1, a1 = i * 2 + 2, b1 = i * 2 + 3;
    if (flip) index.push(a0, b1, a1, a0, b0, b1);
    else index.push(a0, a1, b1, a0, b1, b0);
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(positions, 3));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

/** Thick wall following the rim outline: outer, inner, top and bottom faces. */
function rimWall(bottom: number, top: number, thickness: number, outset = 0) {
  const pts = rimPoints(220);
  const to3 = (x: number, d: number, y: number) => new Vector3(x, y, -d);
  const outer = (y: number) => pts.map(({ p, n }) => to3(p.x - n.x * outset, p.y - n.y * outset, y));
  const inner = (y: number) => pts.map(({ p, n }) => to3(p.x + n.x * thickness, p.y + n.y * thickness, y));
  return mergeGeometries([
    stripGeometry(outer(bottom), outer(top), false),
    stripGeometry(inner(bottom), inner(top), true),
    stripGeometry(outer(top), inner(top), false),
    stripGeometry(outer(bottom), inner(bottom), true),
  ]);
}

function flatShape(inset: number, y: number, holes: Parameters<typeof planShape>[1] = []) {
  const g = new ShapeGeometry(planShape(inset, holes), 1);
  // Faces +z before the rotation, so it faces up afterwards.
  g.rotateX(-Math.PI / 2);
  g.translate(0, y, 0);
  return g;
}

function slab(inset: number, y: number, depth: number, holes: Parameters<typeof planShape>[1] = []) {
  const g = new ExtrudeGeometry(planShape(inset, holes), {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
    curveSegments: 2,
  });
  g.rotateX(-Math.PI / 2);
  g.translate(0, y, 0);
  return g;
}

function box(w: number, h: number, d: number, x: number, y: number, z: number, rx = 0) {
  const g = new BoxGeometry(w, h, d);
  if (rx) g.rotateX(rx);
  g.translate(x, y, z);
  return g;
}

/** Only position + normal survive, so heterogeneous geometries can merge for sampling. */
function bare(g: BufferGeometry) {
  const out = g.index ? g.toNonIndexed() : g.clone();
  for (const name of Object.keys(out.attributes)) if (name !== "position" && name !== "normal") out.deleteAttribute(name);
  if (!out.attributes.normal) out.computeVertexNormals();
  return out;
}

function surfaceSampler(geometries: BufferGeometry[]) {
  const merged = mergeGeometries(geometries.map(bare));
  const sampler = new MeshSurfaceSampler(new Mesh(merged)).build();
  const p = new Vector3();
  const n = new Vector3();
  // setRandomGenerator exists at runtime but is missing from @types/three.
  const seeded = sampler as unknown as { setRandomGenerator(fn: () => number): void };
  return (random: () => number) => {
    seeded.setRandomGenerator(random);
    sampler.sample(p, n);
    // Sit just proud of the surface so dust reads on top of the lacquer.
    return p.addScaledVector(n, 0.0035);
  };
}

/** Random point on a box instance's visible faces (top favoured). */
function boxSampler(size: Vector3, matrices: Matrix4[]) {
  const v = new Vector3();
  return (random: () => number) => {
    const m = matrices[Math.floor(random() * matrices.length)];
    const r = random();
    const u = random() - 0.5, w = random() - 0.5;
    if (r < 0.7) v.set(u * size.x, size.y / 2 + 0.002, w * size.z);
    else if (r < 0.88) v.set(u * size.x, w * size.y, size.z / 2 + 0.002);
    else v.set((r < 0.94 ? -0.5 : 0.5) * size.x, u * size.y, w * size.z);
    return { point: v.applyMatrix4(m), index: matrices.indexOf(m) };
  };
}

interface Build {
  meshes: Mesh[];
  materials: FxMaterial[];
  spread: SpreadSet[];
}

function makeMesh(build: Build, geometry: BufferGeometry, kind: MaterialKind, reveal = false) {
  const fx = createMaterial(kind, { reveal });
  build.materials.push(fx);
  const mesh = new Mesh(geometry, fx.material);
  build.meshes.push(mesh);
  return mesh;
}

function makeInstanced(build: Build, geometry: BufferGeometry, kind: MaterialKind, matrices: Matrix4[]) {
  const fx = createMaterial(kind);
  build.materials.push(fx);
  const mesh = new InstancedMesh(geometry, fx.material as Material, matrices.length);
  matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();
  // Instances fan apart in World 2; a stale bounding sphere would cull them.
  mesh.frustumCulled = false;
  build.meshes.push(mesh);
  return mesh;
}

const compose = (x: number, y: number, z: number, q = new Quaternion(), s = new Vector3(1, 1, 1)) =>
  new Matrix4().compose(new Vector3(x, y, z), q, s);

/* -------------------------------------------------------------- the keyboard */

export interface KeyLayout {
  midi: number;
  black: boolean;
  x: number;
}

/** 88 keys, A0 (21) to C8 (108). White pitch 23.5 mm; black keys offset per real layout. */
export function keyLayout(): KeyLayout[] {
  const keys: KeyLayout[] = [];
  const pitch = 0.0235;
  const whiteCount = 52;
  const left = -((whiteCount - 1) * pitch) / 2;
  const offsets: Record<number, number> = { 1: -0.15, 3: 0.15, 6: -0.18, 8: 0, 10: 0.18 };
  let white = 0;
  for (let midi = 21; midi <= 108; midi++) {
    const pc = midi % 12;
    const black = pc in offsets;
    if (black) {
      keys.push({ midi, black, x: left + (white - 0.5 + offsets[pc]) * pitch });
    } else {
      keys.push({ midi, black, x: left + white * pitch });
      white++;
    }
  }
  return keys;
}

/* ----------------------------------------------------------------- the parts */

interface PartInit {
  id: string;
  label: string;
  midi: number;
  delay: number;
  weight: number;
  build: Build;
  /** Sampler in absolute space, returning the spread channel and aux. */
  sampleAbs: (random: () => number) => { p: Vector3; channel: number; aux: number };
  explodeOffset: [number, number, number];
  explodeRot: [number, number, number];
  drawingOffset?: [number, number, number];
  /** Assembled pose other than "identity at its own centre" (the open lid). */
  assembledPose?: (center: Vector3) => Pose;
  hingePose?: (center: Vector3) => (angle: number, out: Pose) => void;
  anchor?: Vector3;
}

function finalize(init: PartInit): PianoPart {
  const { build } = init;
  // Bounds from what is actually drawn: mesh transforms applied, and the
  // per-frame-scaled lid prop left out so it cannot drag the pivot.
  const solids = build.meshes.filter((m) => !(m instanceof InstancedMesh) && !m.userData.prop);
  const bounds = solids.length
    ? mergeGeometries(
        solids.map((m) => {
          m.updateMatrix();
          return bare(m.geometry).applyMatrix4(m.matrix);
        }),
      )
    : null;
  const center = new Vector3();
  if (bounds) {
    bounds.computeBoundingBox();
    bounds.boundingBox!.getCenter(center);
  }
  for (const s of build.spread) {
    const c = new Vector3();
    s.base.forEach((m) => c.add(new Vector3().setFromMatrixPosition(m)));
    if (!bounds) center.copy(c.divideScalar(s.base.length));
  }
  if (!bounds && !build.spread.length) {
    // Instanced-only parts without spread (strings): centre from the first mesh.
    const mesh = build.meshes[0] as InstancedMesh;
    mesh.computeBoundingBox();
    mesh.boundingBox!.getCenter(center);
  }

  const group = new Group();
  group.name = init.id;
  const inner = new Group();
  inner.position.copy(center).negate();
  build.meshes.forEach((m) => {
    m.layers.enable(1);
    m.userData.part = init.id;
    inner.add(m);
  });
  group.add(inner);

  const assembled = init.assembledPose?.(center) ?? { pos: center.clone(), rot: new Euler() };
  const exploded: Pose = {
    pos: center.clone().add(new Vector3(...init.explodeOffset)),
    rot: new Euler(...init.explodeRot),
  };
  const drawing: Pose = {
    pos: center.clone().add(new Vector3(...(init.drawingOffset ?? init.explodeOffset))),
    rot: new Euler(),
  };
  group.position.copy(assembled.pos);
  group.rotation.copy(assembled.rot);

  return {
    id: init.id,
    label: init.label,
    midi: init.midi,
    group,
    assembled,
    exploded,
    drawing,
    delay: init.delay,
    weight: init.weight,
    materials: build.materials,
    spread: build.spread,
    anchor: init.anchor ?? new Vector3(),
    hingePose: init.hingePose?.(center),
    sample(count, random) {
      const local = new Float32Array(count * 3);
      const meta = new Float32Array(count * 2);
      for (let i = 0; i < count; i++) {
        const s = init.sampleAbs(random);
        s.p.sub(center);
        local.set([s.p.x, s.p.y, s.p.z], i * 3);
        meta.set([s.channel, s.aux], i * 2);
      }
      return { local, meta };
    },
  };
}

const newBuild = (): Build => ({ meshes: [], materials: [], spread: [] });

export function buildPiano(): PianoPart[] {
  const parts: PianoPart[] = [];
  const keys = keyLayout();

  /* Lid, hinged on the straight bass side, propped open. */
  {
    const b = newBuild();
    const lidY = RIM_TOP + 0.006;
    const lid = slab(-0.012, lidY, 0.02);
    makeMesh(b, lid, "lacquer", true);
    // Prop stick hangs from the lid underside on the treble side; unit length,
    // scaled and counter-rotated per frame so it stays vertical on the rim.
    const propGeo = new CylinderGeometry(0.011, 0.011, 1, 8);
    propGeo.translate(0, -0.5, 0);
    const prop = makeMesh(b, propGeo, "lacquer");
    prop.position.set(0.5, lidY, -0.9);
    prop.userData.prop = { reach: 0.5 + RIM.halfWidth };
    const sample = surfaceSampler([lid]);
    const angle = 0.62;
    parts.push(
      finalize({
        id: "lid",
        label: "Lid",
        midi: 37,
        delay: 0,
        weight: 0.15,
        build: b,
        sampleAbs: (r) => ({ p: sample(r), channel: 0, aux: 0 }),
        explodeOffset: [0.05, 1.7, -0.25],
        explodeRot: [0.16, 0, -0.08],
        drawingOffset: [0, 1.62, 0],
        assembledPose: (center) => {
          const hinge = new Vector3(-RIM.halfWidth, lidY, center.z);
          const pos = center.clone().sub(hinge).applyAxisAngle(new Vector3(0, 0, 1), angle).add(hinge);
          return { pos, rot: new Euler(0, 0, angle) };
        },
        // The lid swings on its hinge: closed on arrival, wide open before the burst.
        hingePose: (center) => {
          const hinge = new Vector3(-RIM.halfWidth, lidY, center.z);
          const axis = new Vector3(0, 0, 1);
          return (a, out) => {
            out.pos.copy(center).sub(hinge).applyAxisAngle(axis, a).add(hinge);
            out.rot.set(0, 0, a);
          };
        },
        anchor: new Vector3(0.6, 0.02, 0.2),
      }),
    );
  }

  /* Music desk. */
  {
    const b = newBuild();
    const desk = box(0.95, 0.3, 0.016, 0, 1.12, -0.17, -0.22);
    const ledge = box(0.95, 0.012, 0.05, 0, 0.98, -0.13);
    makeMesh(b, desk, "lacquer");
    makeMesh(b, ledge, "lacquer");
    const sample = surfaceSampler([desk, ledge]);
    parts.push(
      finalize({
        id: "desk", label: "Music desk", midi: 75, delay: 0.04, weight: 0.03, build: b,
        sampleAbs: (r) => ({ p: sample(r), channel: 0, aux: 0 }),
        explodeOffset: [0, 1.2, 0.45], explodeRot: [-0.12, 0.08, 0], anchor: new Vector3(0.47, 0.1, 0),
      }),
    );
  }

  /* Fallboard. */
  {
    const b = newBuild();
    const board = box(1.26, 0.075, 0.014, 0, 0.79, -0.035, -0.25);
    makeMesh(b, board, "lacquer");
    const sample = surfaceSampler([board]);
    parts.push(
      finalize({
        id: "fallboard", label: "Fallboard", midi: 72, delay: 0.06, weight: 0.02, build: b,
        sampleAbs: (r) => ({ p: sample(r), channel: 0, aux: 0 }),
        explodeOffset: [0, 0.78, 0.78], explodeRot: [0.3, 0, 0], anchor: new Vector3(0.63, 0, 0),
      }),
    );
  }

  /* Strings: 120 instanced, overstrung bass crossing the tenor. */
  {
    const b = newBuild();
    const outline = rimPoints(240);
    const count = 120;
    const matrices: Matrix4[] = [];
    const segments: [Vector3, Vector3][] = [];
    const up = new Vector3(0, 1, 0);
    for (let i = 0; i < count; i++) {
      const u = i / (count - 1);
      const x = -0.64 + u * 1.28;
      const bass = u < 0.24;
      const endX = bass ? x + 0.3 * (1 - u / 0.24) : x;
      const y = bass ? STRING_Y + 0.012 : STRING_Y;
      const start = new Vector3(x, y, -0.07);
      const end = new Vector3(endX, y, -(depthAt(endX, outline) - 0.05));
      const dir = new Vector3().subVectors(end, start);
      const len = dir.length();
      const radius = 0.65 + (1 - u) * 0.9;
      const q = new Quaternion().setFromUnitVectors(up, dir.normalize());
      const mid = start.clone().add(end).multiplyScalar(0.5);
      matrices.push(compose(mid.x, mid.y, mid.z, q, new Vector3(radius, len, radius)));
      segments.push([start, end]);
    }
    makeInstanced(b, new CylinderGeometry(0.0018, 0.0018, 1, 5, 1, true), "string", matrices);
    parts.push(
      finalize({
        id: "strings", label: "Strings", midi: 79, delay: 0.1, weight: 0.1, build: b,
        sampleAbs: (r) => {
          const [s, e] = segments[Math.floor(r() * segments.length)];
          return { p: s.clone().lerp(e, r()).add(new Vector3(0, 0.003, 0)), channel: 0, aux: 0 };
        },
        explodeOffset: [0, 0.98, 0], explodeRot: [0.06, 0, 0], anchor: new Vector3(0.62, 0, 0.2),
      }),
    );
  }

  /* Cast-iron plate, gold, with its cast openings. */
  {
    const b = newBuild();
    const holes = [
      ellipse(0.4, 0.66, 0.12, 0.17, 0.3),
      ellipse(0.06, 0.8, 0.11, 0.2, 0.25),
      ellipse(-0.33, 0.9, 0.15, 0.25, 0.1),
      ellipse(0.1, 1.28, 0.08, 0.15, 0.4),
      ellipse(-0.3, 1.62, 0.14, 0.2, 0.2),
    ];
    const plate = slab(0.045, 0.845, 0.022, holes);
    makeMesh(b, plate, "gold");
    const sample = surfaceSampler([plate]);
    parts.push(
      finalize({
        id: "plate", label: "Cast-iron plate", midi: 49, delay: 0.12, weight: 0.12, build: b,
        sampleAbs: (r) => ({ p: sample(r), channel: 0, aux: 0 }),
        explodeOffset: [0, 0.58, 0], explodeRot: [0.04, 0.05, 0], anchor: new Vector3(0.6, 0.02, 0.1),
      }),
    );
  }

  /* Action: hammers, shanks, dampers and rails. */
  {
    const b = newBuild();
    const hammerXs = keys.map((k) => k.x * 1.06);
    const headSize = new Vector3(0.016, 0.034, 0.03);
    const heads = hammerXs.map((x) => compose(x, STRING_Y - 0.027, -0.25));
    const shankQ = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);
    const shanks = hammerXs.map((x) => compose(x, STRING_Y - 0.04, -0.185, shankQ));
    const damperXs = hammerXs.slice(0, 70);
    const damperSize = new Vector3(0.014, 0.028, 0.03);
    const dampers = damperXs.map((x) => compose(x, STRING_Y + 0.02, -0.42));
    const headMesh = makeInstanced(b, new BoxGeometry(headSize.x, headSize.y, headSize.z), "felt", heads);
    const shankMesh = makeInstanced(b, new CylinderGeometry(0.0032, 0.0032, 0.13, 5), "keywood", shanks);
    const damperMesh = makeInstanced(b, new BoxGeometry(damperSize.x, damperSize.y, damperSize.z), "darkFelt", dampers);
    b.spread.push(
      { mesh: headMesh, base: heads, xs: hammerXs, channel: 2 },
      { mesh: shankMesh, base: shanks, xs: hammerXs, channel: 2 },
      { mesh: damperMesh, base: dampers, xs: damperXs, channel: 2 },
    );
    const rails = [box(1.32, 0.02, 0.02, 0, 0.81, -0.12), box(1.32, 0.02, 0.02, 0, 0.79, -0.22)];
    for (let i = 0; i < 7; i++) rails.push(box(0.012, 0.09, 0.2, -0.6 + i * 0.2, 0.79, -0.18));
    rails.forEach((g) => makeMesh(b, g, "gold"));
    const railSample = surfaceSampler(rails);
    const headSample = boxSampler(headSize, heads);
    const damperSample = boxSampler(damperSize, dampers);
    parts.push(
      finalize({
        id: "action", label: "Action", midi: 56, delay: 0.14, weight: 0.08, build: b,
        sampleAbs: (r) => {
          const pick = r();
          if (pick < 0.55) {
            const s = headSample(r);
            return { p: s.point.clone(), channel: CHANNEL.hammers, aux: hammerXs[s.index] };
          }
          if (pick < 0.75) {
            const s = damperSample(r);
            return { p: s.point.clone(), channel: CHANNEL.hammers, aux: damperXs[s.index] };
          }
          return { p: railSample(r), channel: 0, aux: 0 };
        },
        explodeOffset: [0, 0.5, 0.72], explodeRot: [0.14, 0, 0], anchor: new Vector3(0.7, 0.03, 0),
      }),
    );
  }

  /* Soundboard with its bridges. */
  {
    const b = newBuild();
    const board = flatShape(0.036, 0.8);
    makeMesh(b, board, "spruce");
    const bridge = new TubeGeometry(
      new CatmullRomCurve3([
        new Vector3(0.62, 0.815, -0.55), new Vector3(0.3, 0.815, -0.88),
        new Vector3(-0.1, 0.815, -1.3), new Vector3(-0.42, 0.815, -1.74),
      ]),
      48, 0.011, 4,
    );
    const bassBridge = new TubeGeometry(
      new CatmullRomCurve3([new Vector3(-0.64, 0.815, -1.2), new Vector3(-0.5, 0.815, -1.5), new Vector3(-0.36, 0.815, -1.82)]),
      24, 0.011, 4,
    );
    makeMesh(b, bridge, "keywood");
    makeMesh(b, bassBridge, "keywood");
    const sample = surfaceSampler([board, bridge, bassBridge]);
    parts.push(
      finalize({
        id: "soundboard", label: "Soundboard", midi: 41, delay: 0.18, weight: 0.07, build: b,
        sampleAbs: (r) => ({ p: sample(r), channel: 0, aux: 0 }),
        explodeOffset: [0, 0.18, -0.05], explodeRot: [-0.03, 0, 0], anchor: new Vector3(0.62, 0, 0.3),
      }),
    );
  }

  /* Rim with gold inlay line and bottom board. */
  {
    const b = newBuild();
    const wall = rimWall(RIM.bottom, RIM_TOP, RIM.thickness);
    makeMesh(b, wall, "lacquer", true);
    const inlay = rimWall(RIM_TOP - 0.03, RIM_TOP - 0.024, 0.002, 0.0012);
    makeMesh(b, inlay, "gold");
    const bottom = flatShape(0.01, RIM.bottom + 0.004);
    makeMesh(b, bottom, "lacquer", true);
    const cheeks = [box(0.12, 0.11, 0.3, -0.68, 0.74, 0.0), box(0.12, 0.11, 0.3, 0.68, 0.74, 0.0)];
    cheeks.forEach((g) => makeMesh(b, g, "lacquer"));
    const sample = surfaceSampler([wall, wall, wall, ...cheeks]);
    parts.push(
      finalize({
        id: "rim", label: "Rim", midi: 32, delay: 0.2, weight: 0.17, build: b,
        sampleAbs: (r) => ({ p: sample(r), channel: 0, aux: 0 }),
        explodeOffset: [0, -0.28, -0.1], explodeRot: [0, 0, 0], drawingOffset: [0, -0.28, 0],
        anchor: new Vector3(0.74, 0.1, 0.4),
      }),
    );
  }

  /* Keyboard: 52 ivory and 36 ebony keys on their keybed. */
  {
    const b = newBuild();
    const whites = keys.filter((k) => !k.black);
    const blacks = keys.filter((k) => k.black);
    const capSize = new Vector3(0.0222, 0.005, 0.148);
    const blackSize = new Vector3(0.0122, 0.024, 0.13);
    const caps = whites.map((k) => compose(k.x, KEY_TOP - 0.0025, 0.056));
    const sticks = whites.map((k) => compose(k.x, KEY_TOP - 0.014, -0.08));
    const ebony = blacks.map((k) => compose(k.x, KEY_TOP + 0.004, 0.005));
    const capMesh = makeInstanced(b, new BoxGeometry(capSize.x, capSize.y, capSize.z), "ivory", caps);
    const stickMesh = makeInstanced(b, new BoxGeometry(0.0222, 0.018, 0.42), "keywood", sticks);
    const blackMesh = makeInstanced(b, new BoxGeometry(blackSize.x, blackSize.y, blackSize.z), "ebony", ebony);
    const whiteXs = whites.map((k) => k.x);
    const blackXs = blacks.map((k) => k.x);
    b.spread.push(
      { mesh: capMesh, base: caps, xs: whiteXs, channel: 1 },
      { mesh: stickMesh, base: sticks, xs: whiteXs, channel: 1 },
      { mesh: blackMesh, base: ebony, xs: blackXs, channel: 1 },
    );
    const bed = [box(1.48, 0.03, 0.5, 0, 0.705, -0.1), box(1.25, 0.03, 0.02, 0, 0.722, 0.14)];
    bed.forEach((g) => makeMesh(b, g, "lacquer"));
    const bedSample = surfaceSampler(bed);
    const capSample = boxSampler(capSize, caps);
    const blackSample = boxSampler(blackSize, ebony);
    parts.push(
      finalize({
        id: "keyboard", label: "Keyboard", midi: 60, delay: 0.16, weight: 0.14, build: b,
        sampleAbs: (r) => {
          const pick = r();
          if (pick < 0.55) {
            const s = capSample(r);
            return { p: s.point.clone(), channel: CHANNEL.keys, aux: whiteXs[s.index] };
          }
          if (pick < 0.8) {
            const s = blackSample(r);
            return { p: s.point.clone(), channel: CHANNEL.keys, aux: blackXs[s.index] };
          }
          return { p: bedSample(r), channel: 0, aux: 0 };
        },
        explodeOffset: [0, 0.3, 1.12], explodeRot: [0.18, 0, 0], anchor: new Vector3(0.74, 0.04, 0.1),
      }),
    );
  }

  /* Legs with brass ferrules and casters. */
  const legs: [string, number, number, [number, number, number], [number, number, number], number][] = [
    ["legBass", -0.62, -0.12, [-0.32, -0.78, 0.5], [0, 0, 0.45], 0.22],
    ["legTreble", 0.62, -0.12, [0.36, -0.82, 0.55], [0, 0, -0.42], 0.24],
    ["legTail", -0.3, -1.84, [-0.18, -0.86, -0.62], [-0.48, 0, 0], 0.26],
  ];
  for (const [id, x, z, offset, rot, delay] of legs) {
    const b = newBuild();
    const shaft = new CylinderGeometry(0.056, 0.038, 0.58, 18);
    shaft.translate(x, RIM.bottom - 0.29, z);
    const ferrule = new CylinderGeometry(0.041, 0.041, 0.04, 18);
    ferrule.translate(x, 0.07, z);
    const caster = new SphereGeometry(0.028, 14, 10);
    caster.translate(x, 0.03, z);
    makeMesh(b, shaft, "lacquer");
    makeMesh(b, ferrule, "gold");
    makeMesh(b, caster, "gold");
    const sample = surfaceSampler([shaft, ferrule]);
    parts.push(
      finalize({
        id, label: "Leg", midi: id === "legTail" ? 29 : 34, delay, weight: 0.025, build: b,
        sampleAbs: (r) => ({ p: sample(r), channel: 0, aux: 0 }),
        explodeOffset: offset, explodeRot: rot, drawingOffset: [offset[0] * 0.4, offset[1], offset[2]],
        anchor: new Vector3(0.06, 0.2, 0),
      }),
    );
  }

  /* Pedal lyre with three gold pedals. */
  {
    const b = newBuild();
    const lacquer = [
      box(0.03, 0.5, 0.03, -0.09, 0.4, -0.32),
      box(0.03, 0.5, 0.03, 0.09, 0.4, -0.32),
      box(0.24, 0.04, 0.05, 0, 0.64, -0.32),
      box(0.34, 0.06, 0.14, 0, 0.12, -0.3),
    ];
    lacquer.forEach((g) => makeMesh(b, g, "lacquer"));
    const pedals = [-0.07, 0, 0.07].map((x) => box(0.022, 0.012, 0.11, x, 0.1, -0.2));
    pedals.forEach((g) => makeMesh(b, g, "gold"));
    const sample = surfaceSampler([...lacquer, ...pedals]);
    parts.push(
      finalize({
        id: "lyre", label: "Pedal lyre", midi: 25, delay: 0.24, weight: 0.035, build: b,
        sampleAbs: (r) => ({ p: sample(r), channel: 0, aux: 0 }),
        explodeOffset: [0, -0.98, 0.55], explodeRot: [0.32, 0, 0], anchor: new Vector3(0.17, 0.1, 0),
      }),
    );
  }

  return parts;
}

/** Shared scratch objects for per-frame spread updates. */
const _m = new Matrix4();
const _p = new Vector3();
const _q = new Quaternion();
const _s = new Vector3();

/**
 * Fan keys and hammers apart and ripple them. The particle velocity shader
 * runs the same function, so dust stays glued to every key.
 */
export function applySpread(set: SpreadSet, spread: number, wave: number, time: number) {
  const phase = set.channel === CHANNEL.hammers ? 1.2 : 0;
  const amp = set.channel === CHANNEL.hammers ? 0.8 : 1;
  for (let i = 0; i < set.base.length; i++) {
    set.base[i].decompose(_p, _q, _s);
    const x = set.xs[i];
    _p.x += x * spread;
    _p.y += Math.sin(x * 9 + time * 1.6 + phase) * wave * amp;
    _m.compose(_p, _q, _s);
    set.mesh.setMatrixAt(i, _m);
  }
  set.mesh.instanceMatrix.needsUpdate = true;
}
