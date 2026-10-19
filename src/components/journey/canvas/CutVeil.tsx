"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Color, NormalBlending, ShaderMaterial, Vector3, type Mesh } from "three";
import { PALETTE } from "../config";
import { rig } from "./rig";

const _dir = new Vector3();

/**
 * The cut between two stages, as a piece of lighting rather than a jump: a
 * warm gold bloom gathers in the middle of the frame while the dark closes in
 * from the corners like an iris, until the old stage is gone and only the
 * ember of the bloom and a little gold dust remain. The stage switches inside
 * that dark; then the iris opens again on the new one and the bloom fades.
 * Nothing in it is ever brighter than gold.
 *
 * One plane just in front of the lens, premultiplied over the scene:
 * rgb is added (the bloom), alpha covers (the dark).
 */
const vertexShader = /* glsl */ `
  varying vec4 vClip;
  void main() {
    // The plane is far larger than the view: shape everything in screen space.
    vClip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position = vClip;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uDark;
  uniform float uGlow;
  uniform float uTime;
  uniform float uAspect;
  uniform vec3 uGold;
  uniform vec3 uEmber;
  varying vec4 vClip;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    // Screen position, -1..1 on both axes.
    vec2 ndc = vClip.xy / vClip.w;
    vec2 q = ndc * vec2(uAspect, 1.0);
    // 0 in the middle of the frame, 1 in its corners.
    float r = length(q) / length(vec2(uAspect, 1.0));

    // Iris: the opening shrinks from beyond the corners to nothing, with a
    // wide, soft feather; the last stretch fills the middle completely.
    float opening = 1.25 * (1.0 - uDark);
    float iris = smoothstep(opening - 0.5, opening + 0.1, r);
    iris = max(iris, smoothstep(0.72, 1.0, uDark));

    // The bloom: a soft gold disc in the middle, warmer and wider underneath.
    float halo = exp(-r * r * 9.0);
    float wide = exp(-r * r * 3.0);
    // Gentle while the stage still shows through; full only over the dark,
    // so the frame never adds gold to ivory and turns white.
    float lift = mix(0.22, 1.0, iris * iris);
    vec3 bloom = (uGold * halo * 0.78 + uEmber * wide * 0.22) * uGlow * lift;

    // Gold dust rising through the dark: sparse motes that breathe.
    vec2 g = (ndc * 0.5 + 0.5) * vec2(uAspect, 1.0) * 26.0;
    g.y -= uTime * 0.28;
    vec2 cell = floor(g);
    float h = hash(cell);
    vec2 c = vec2(hash(cell + 1.3), hash(cell + 7.1)) * 0.7 + 0.15;
    float d = length(fract(g) - c);
    float breath = 0.55 + 0.45 * sin(uTime * (1.6 + 3.0 * h) + h * 6.2832);
    float mote = step(0.84, h) * smoothstep(0.07, 0.0, d) * breath;
    float dust = smoothstep(0.35, 0.9, uDark) * uGlow;
    vec3 motes = mix(uEmber, uGold, h) * mote * dust * 0.9;

    gl_FragColor = vec4(bloom + motes, iris);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function CutVeil() {
  const mesh = useRef<Mesh>(null);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uDark: { value: 0 },
          uGlow: { value: 0 },
          uTime: { value: 0 },
          uAspect: { value: 1 },
          uGold: { value: new Color(PALETTE.goldHot) },
          uEmber: { value: new Color(PALETTE.goldDeep) },
        },
        transparent: true,
        premultipliedAlpha: true,
        blending: NormalBlending,
        depthTest: false,
        depthWrite: false,
        fog: false,
      }),
    [],
  );
  useFrame(({ camera, size }) => {
    const m = mesh.current;
    if (!m) return;
    m.visible = rig.dark > 0.002 || rig.glow > 0.002;
    if (!m.visible) return;
    camera.getWorldDirection(_dir);
    m.position.copy(camera.position).addScaledVector(_dir, 0.3);
    m.quaternion.copy(camera.quaternion);
    material.uniforms.uDark.value = rig.dark;
    material.uniforms.uGlow.value = rig.glow;
    material.uniforms.uTime.value = rig.time;
    material.uniforms.uAspect.value = size.width / Math.max(1, size.height);
  });
  return (
    <mesh ref={mesh} material={material} renderOrder={999} frustumCulled={false} visible={false}>
      <planeGeometry args={[4, 4]} />
    </mesh>
  );
}
