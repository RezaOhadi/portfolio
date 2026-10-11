"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DataTexture,
  FloatType,
  HalfFloatType,
  Matrix4,
  NearestFilter,
  Points,
  RGBAFormat,
  ShaderMaterial,
  Vector3,
  type PerspectiveCamera,
} from "three";
import { GPUComputationRenderer } from "three/examples/jsm/misc/GPUComputationRenderer.js";
import { PALETTE } from "../../config";
import { journey } from "../../store";
import { mulberry32, type PianoPart } from "../piano/build";
import { pointerRay } from "../PianoParts";
import { rig } from "../rig";
import { PART_COUNT, positionShader, renderFragment, renderVertex, velocityShader } from "./shaders";
import { stringAmp, stringTime } from "../stages/stringLayout";
import { boardSamples, boardShared } from "../stages/boardLayout";
import { rimPoints } from "../piano/outline";

const CENTER = new Vector3(0, 0.82, -0.95);

function dataTexture(data: Float32Array, size: number) {
  const t = new DataTexture(data, size, size, RGBAFormat, FloatType);
  t.minFilter = t.magFilter = NearestFilter;
  t.needsUpdate = true;
  return t;
}

/** Distribute size² particles over the parts by weight and sample their surfaces. */
function sampleParts(parts: PianoPart[], size: number) {
  const total = size * size;
  const random = mulberry32(7);
  const local = new Float32Array(total * 4);
  const meta = new Float32Array(total * 4);
  const weightSum = parts.reduce((s, p) => s + p.weight, 0);
  let cursor = 0;
  parts.forEach((part, index) => {
    const count = index === parts.length - 1 ? total - cursor : Math.round((part.weight / weightSum) * total);
    const s = part.sample(count, random);
    for (let i = 0; i < count && cursor < total; i++, cursor++) {
      local.set([s.local[i * 3], s.local[i * 3 + 1], s.local[i * 3 + 2], index], cursor * 4);
      meta.set([random(), random(), s.meta[i * 2], s.meta[i * 2 + 1]], cursor * 4);
    }
  });
  // Shuffle so neighbouring texels (and thus draw order) mix parts evenly.
  for (let i = total - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    for (let k = 0; k < 4; k++) {
      const a = local[i * 4 + k]; local[i * 4 + k] = local[j * 4 + k]; local[j * 4 + k] = a;
      const b = meta[i * 4 + k]; meta[i * 4 + k] = meta[j * 4 + k]; meta[j * 4 + k] = b;
    }
  }
  return { local, meta };
}

export function ParticleField({ parts, size }: { parts: PianoPart[]; size: number }) {
  const gl = useThree((s) => s.gl);

  const sim = useMemo(() => {
    if (parts.length > PART_COUNT) throw new Error("Raise PART_COUNT for the particle shader");
    const t0 = performance.now();
    const { local, meta } = sampleParts(parts, size);
    performance.measure("journey:sample", { start: t0, end: performance.now() });
    const gpu = new GPUComputationRenderer(size, size, gl);
    const floatTargets = gl.capabilities.isWebGL2 && gl.extensions.has("EXT_color_buffer_float");
    gpu.setDataType(floatTargets ? FloatType : HalfFloatType);

    const pos0 = gpu.createTexture();
    const vel0 = gpu.createTexture();
    const random = mulberry32(11);
    const p = pos0.image.data as Float32Array;
    for (let i = 0; i < size * size; i++) {
      // Start far out in the dark; the assemble shell pulls them in.
      const u = random() * 2 - 1, a = random() * Math.PI * 2, r = 6 + random() * 6;
      const s = Math.sqrt(1 - u * u);
      p.set([CENTER.x + Math.cos(a) * s * r, CENTER.y + u * r, CENTER.z + Math.sin(a) * s * r, 1], i * 4);
    }
    const posVar = gpu.addVariable("texturePosition", positionShader, pos0);
    const velVar = gpu.addVariable("textureVelocity", velocityShader, vel0);
    gpu.setVariableDependencies(posVar, [posVar, velVar]);
    gpu.setVariableDependencies(velVar, [posVar, velVar]);

    const tLocal = dataTexture(local, size);
    // Chain step 3: every mote's resting place on the soundboard (inside the piano's outline).
    const outline = rimPoints(200).map(({ p }) => ({ x: p.x, d: p.y }));
    outline.push({ x: 0.74, d: 0 }, { x: -0.74, d: 0 });
    const xz = boardSamples(size * size, mulberry32(23), outline);
    const board = new Float32Array(size * size * 4);
    for (let i = 0; i < size * size; i++) board.set([xz[i * 2], xz[i * 2 + 1], 0, 1], i * 4);
    const tBoard = dataTexture(board, size);
    const tMeta = dataTexture(meta, size);
    const parts16 = Array.from({ length: PART_COUNT }, () => new Matrix4());
    const shared = {
      uParts: { value: parts16 },
      tLocal: { value: tLocal },
      tMeta: { value: tMeta },
      uTime: { value: 0 },
      uAssemble: { value: 0 },
      uFree: { value: 0 },
      uKeySpread: { value: 0 },
      uWave: { value: 0 },
      uCenter: { value: CENTER },
      uDelta: { value: 0 },
      uSnapAll: { value: 0 },
      uChain: { value: 0 },
      uStagger: { value: 0.65 },
      uCam: { value: new Vector3() },
      tStrAmp: { value: stringAmp.texture },
      tBoard: { value: tBoard },
      ...boardShared,
      uStrTime: stringTime,
    };
    Object.assign(posVar.material.uniforms, shared);
    Object.assign(velVar.material.uniforms, shared, {
      uBurst: { value: 0 },
      uMouse: { value: 0 },
      uMouseRadius: { value: 0.32 },
      uMouseStrength: { value: 26 },
      uRayO: { value: new Vector3() },
      uRayD: { value: new Vector3(0, 0, -1) },
    });
    const t1 = performance.now();
    const error = gpu.init();
    performance.measure("journey:gpgpuInit", { start: t1, end: performance.now() });
    if (error) throw new Error(error);

    const geometry = new BufferGeometry();
    const refs = new Float32Array(size * size * 2);
    for (let i = 0; i < size * size; i++) refs.set([((i % size) + 0.5) / size, (Math.floor(i / size) + 0.5) / size], i * 2);
    geometry.setAttribute("ref", new BufferAttribute(refs, 2));
    // three requires a position attribute for draw counts; the shader ignores it.
    geometry.setAttribute("position", new BufferAttribute(new Float32Array(size * size * 3), 3));
    const material = new ShaderMaterial({
      vertexShader: renderVertex,
      fragmentShader: renderFragment,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        tPosition: { value: null },
        tVelocity: { value: null },
        uSize: { value: 0.0078 },
        uScale: { value: 1 },
        uOpacity: { value: 0.55 },
        uFree: { value: 0 },
        uMaxSize: { value: 9 },
        uGold: { value: new Color(PALETTE.gold).convertSRGBToLinear() },
        uHot: { value: new Color(PALETTE.goldHot).convertSRGBToLinear() },
      },
    });
    const points = new Points(geometry, material);
    points.frustumCulled = false;
    return { gpu, posVar, velVar, shared, points, material, geometry, tLocal, tMeta, tBoard, settleFrames: 0 };
  }, [parts, size, gl]);

  useEffect(
    () => () => {
      sim.gpu.dispose();
      sim.geometry.dispose();
      sim.material.dispose();
      sim.tLocal.dispose();
      sim.tMeta.dispose();
      sim.tBoard.dispose();
    },
    [sim],
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const { shared, velVar, gpu, material } = sim;
    parts.forEach((part, i) => shared.uParts.value[i].copy(part.group.matrixWorld));
    shared.uTime.value = rig.time;
    shared.uAssemble.value = rig.assemble;
    shared.uFree.value = rig.free;
    shared.uKeySpread.value = rig.spread * (1 - rig.snap * 0.35);
    shared.uWave.value = rig.wave;
    shared.uChain.value = rig.chain;
    shared.uCam.value.copy(state.camera.position);
    shared.uDelta.value = dt;
    // Reduced motion renders the resting pose directly, no simulation.
    shared.uSnapAll.value = journey.reduced ? 1 : 0;
    const v = velVar.material.uniforms;
    v.uBurst.value = rig.burst;
    v.uMouse.value = journey.pointer.mouse ? 1 : 0;
    v.uMouseRadius.value = 0.22 + rig.orbit * 0.25;
    (v.uRayO.value as Vector3).copy(pointerRay.origin);
    (v.uRayD.value as Vector3).copy(pointerRay.direction);
    gpu.compute();

    const camera = state.camera as PerspectiveCamera;
    material.uniforms.tPosition.value = gpu.getCurrentRenderTarget(sim.posVar).texture;
    material.uniforms.tVelocity.value = gpu.getCurrentRenderTarget(velVar).texture;
    material.uniforms.uScale.value = (state.size.height * state.gl.getPixelRatio()) / 2 / Math.tan((camera.fov * Math.PI) / 360);
    material.uniforms.uOpacity.value = 0.55 * (1 - rig.after * 0.9);
    material.uniforms.uFree.value = rig.free;
    material.uniforms.uMaxSize.value = 9 * state.gl.getPixelRatio();
  });

  return <primitive object={sim.points} />;
}
