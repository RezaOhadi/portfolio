"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, Points, ShaderMaterial, Vector3, type PerspectiveCamera } from "three";
import { PALETTE } from "../config";
import { sparkQueue } from "../store";
import { rig } from "./rig";

const POOL = 1600;

/**
 * Text that leaves the page does not vanish: the DOM queues a burst at its
 * screen rectangle, and here each burst becomes gold sparks born in 3D on the
 * camera rays behind those letters, drawn into the scene's focus and fading.
 */
export function Sparks() {
  const sim = useMemo(() => {
    const position = new Float32Array(POOL * 3);
    const life = new Float32Array(POOL);
    const velocity = new Float32Array(POOL * 3);
    const span = new Float32Array(POOL);
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(position, 3));
    geometry.setAttribute("life", new BufferAttribute(life, 1));
    const material = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: { uColor: { value: new Color(PALETTE.goldHot).convertSRGBToLinear() }, uScale: { value: 1 } },
      vertexShader: /* glsl */ `
        attribute float life;
        uniform float uScale;
        varying float vLife;
        void main(){
          vLife = life;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = life > 0.0 ? clamp(0.03 * uScale * (0.4 + life) / -mv.z, 1.0, 14.0) : 0.0;
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        varying float vLife;
        void main(){
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5 || vLife <= 0.0) discard;
          float a = smoothstep(0.5, 0.0, d) * smoothstep(0.0, 0.35, vLife);
          gl_FragColor = vec4(uColor * (1.5 + vLife * 2.5) * a, a);
        }`,
    });
    const points = new Points(geometry, material);
    points.frustumCulled = false;
    return { position, life, velocity, span, geometry, material, points, cursor: 0, alive: 0, ray: new Vector3(), origin: new Vector3() };
  }, []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const camera = state.camera as PerspectiveCamera;
    const { position, life, velocity, span } = sim;

    while (sparkQueue.length) {
      const burst = sparkQueue.shift()!;
      sim.origin.setFromMatrixPosition(camera.matrixWorld);
      for (let n = 0; n < burst.count; n++) {
        const i = sim.cursor;
        sim.cursor = (sim.cursor + 1) % POOL;
        const sx = burst.x + (Math.random() - 0.5) * burst.w;
        const sy = burst.y + (Math.random() - 0.5) * burst.h;
        sim.ray.set((sx / state.size.width) * 2 - 1, -(sy / state.size.height) * 2 + 1, 0.5).unproject(camera).sub(sim.origin).normalize();
        const depth = 3 + Math.random() * 2.5;
        position[i * 3] = sim.origin.x + sim.ray.x * depth;
        position[i * 3 + 1] = sim.origin.y + sim.ray.y * depth;
        position[i * 3 + 2] = sim.origin.z + sim.ray.z * depth;
        // Drawn towards the world's focus, lifting as they go.
        const tx = rig.focus.x - position[i * 3], ty = rig.focus.y - position[i * 3 + 1], tz = rig.focus.z - position[i * 3 + 2];
        const len = Math.hypot(tx, ty, tz) || 1;
        const pull = 0.6 + Math.random() * 1.2;
        velocity[i * 3] = (tx / len) * pull + (Math.random() - 0.5) * 0.5;
        velocity[i * 3 + 1] = (ty / len) * pull + 0.35 + Math.random() * 0.4;
        velocity[i * 3 + 2] = (tz / len) * pull + (Math.random() - 0.5) * 0.5;
        span[i] = 1.4 + Math.random() * 1.4;
        life[i] = 1;
      }
      sim.alive = POOL;
    }
    if (!sim.alive) return;

    let alive = 0;
    for (let i = 0; i < POOL; i++) {
      if (life[i] <= 0) continue;
      life[i] -= dt / span[i];
      position[i * 3] += velocity[i * 3] * dt;
      position[i * 3 + 1] += velocity[i * 3 + 1] * dt;
      position[i * 3 + 2] += velocity[i * 3 + 2] * dt;
      velocity[i * 3] *= 0.985;
      velocity[i * 3 + 1] *= 0.985;
      velocity[i * 3 + 2] *= 0.985;
      alive++;
    }
    sim.alive = alive;
    sim.geometry.attributes.position.needsUpdate = true;
    sim.geometry.attributes.life.needsUpdate = true;
    sim.material.uniforms.uScale.value = (state.size.height * state.gl.getPixelRatio()) / 2 / Math.tan((camera.fov * Math.PI) / 360);
  });

  return <primitive object={sim.points} />;
}
