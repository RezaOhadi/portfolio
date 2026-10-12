import {
  Color,
  DoubleSide,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Vector2,
  type Material,
  type WebGLProgramParametersWithUniforms,
} from "three";
import { PALETTE } from "../../config";
import { materialOptions } from "../quality";

/**
 * Uniforms shared by every solid part:
 * - uMaterialize: 0..1 dissolve-in on first load, with a burning gold edge.
 * - uCursor/uReveal*: World 1 surprise, the lacquer burns open around the
 *   cursor and shows the gold mechanism inside.
 */
export const fxShared = {
  uTime: { value: 0 },
  uMaterialize: { value: 0 },
  uCursor: { value: new Vector2(-9999, -9999) },
  uRevealRadius: { value: 140 },
  uRevealAmount: { value: 0 },
};

const NOISE = /* glsl */ `
float fxHash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float fxNoise(vec3 x){
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(fxHash(i), fxHash(i + vec3(1,0,0)), f.x), mix(fxHash(i + vec3(0,1,0)), fxHash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(fxHash(i + vec3(0,0,1)), fxHash(i + vec3(1,0,1)), f.x), mix(fxHash(i + vec3(0,1,1)), fxHash(i + vec3(1,1,1)), f.x), f.y), f.z);
}`;

interface FxOptions {
  /** Lacquer shell that burns open under the cursor in World 1. */
  reveal?: boolean;
  /** Constant gold fresnel rim, the "rim light" that outlines black lacquer. */
  rim?: number;
  /** The piano's own parts burn in and out with uMaterialize; stage materials never do. */
  materialize?: boolean;
  /** Per-instance `aPress` attribute (0..1) glows gold: pressed corridor keys, struck hammers. */
  press?: boolean;
}

export interface FxMaterial {
  material: Material;
  /** Per-part fresnel highlight (0..1), driven by a spring on hover. */
  highlight: { value: number };
}

function inject(material: Material, options: FxOptions): FxMaterial {
  const highlight = { value: 0 };
  const gold = new Color(PALETTE.goldHot).convertSRGBToLinear();
  material.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms) => {
    Object.assign(shader.uniforms, fxShared, { uHighlight: highlight, uGold: { value: gold }, uRim: { value: options.rim ?? 0 } });
    shader.defines = { ...shader.defines, ...(options.reveal ? { FX_REVEAL: "" } : {}), ...(options.press ? { FX_PRESS: "" } : {}), ...(options.materialize ? { FX_MATERIALIZE: "" } : {}) };
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 vFxWorld;
        varying float vFxPress;
        #ifdef FX_PRESS
          attribute float aPress;
        #endif`,
      )
      .replace(
        "#include <project_vertex>",
        `#include <project_vertex>
        vec4 fxW = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          fxW = instanceMatrix * fxW;
        #endif
        vFxWorld = (modelMatrix * fxW).xyz;
        #ifdef FX_PRESS
          vFxPress = aPress;
        #else
          vFxPress = 0.0;
        #endif`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 vFxWorld;
        varying float vFxPress;
        uniform float uTime, uMaterialize, uRevealRadius, uRevealAmount, uHighlight, uRim;
        uniform vec2 uCursor;
        uniform vec3 uGold;
        ${NOISE}`,
      )
      .replace(
        "#include <clipping_planes_fragment>",
        `#include <clipping_planes_fragment>
        // The noise field is only read while materializing or revealing: evaluated inside those
        // branches (the same expression), it costs nothing the rest of the time.
        #define FX_N (fxNoise(vFxWorld * 7.0) * 0.65 + fxNoise(vFxWorld * 23.0) * 0.35)
        // Materialize: fragments appear as uMaterialize sweeps through the noise field.
        float fxEdge = 0.0;
        #ifdef FX_MATERIALIZE
        if (uMaterialize < 1.0) {
          float fxN = FX_N;
          float m = uMaterialize * 1.25 - 0.12;
          if (fxN > m) discard;
          fxEdge = 1.0 - smoothstep(0.0, 0.07, m - fxN);
        }
        #endif
        #ifdef FX_REVEAL
          if (uRevealAmount > 0.001) {
            float fxN = FX_N;
            float r = uRevealRadius * uRevealAmount;
            float d = distance(gl_FragCoord.xy, uCursor) + (fxN - 0.5) * uRevealRadius * 0.22;
            if (d < r) discard;
            fxEdge = max(fxEdge, (1.0 - smoothstep(0.0, 5.0, d - r)) * step(0.02, uRevealAmount));
          }
        #endif`,
      )
      .replace(
        "#include <dithering_fragment>",
        `#include <dithering_fragment>
        // Clamped: a face square to the lens rounds |dot| just past 1.0, and pow() of a
        // negative base is NaN; bloom then spreads one NaN pixel over the whole frame as black.
        float fxFacing = clamp(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 0.0, 1.0);
        float fxFres = pow(fxFacing, 2.4);
        // The constant rim is kept to true silhouettes so lacquer stays black.
        float fxRim = pow(fxFacing, 6.0);
        gl_FragColor.rgb += uGold * (fxEdge * 7.0 + fxFres * uHighlight * 2.2 + fxRim * uRim + uHighlight * 0.06 + vFxPress * (0.9 + fxFres * 2.5));`,
      );
  };
  // Distinct cache keys so reveal and plain variants compile separately.
  material.customProgramCacheKey = () => `fx${options.reveal ? "-reveal" : ""}${options.press ? "-press" : ""}${options.materialize ? "-mat" : ""}`;
  // Lacquer always carries a faint gold rim; other materials only on hover.
  if (options.rim === undefined && material instanceof MeshPhysicalMaterial && material.clearcoat === 1) options.rim = 0.9;
  return { material, highlight };
}

export type MaterialKind = "lacquer" | "gold" | "string" | "ivory" | "ebony" | "spruce" | "keywood" | "felt" | "darkFelt" | "iron";

export function createMaterial(kind: MaterialKind, options: FxOptions = {}): FxMaterial {
  switch (kind) {
    case "lacquer":
      // Phones: no clearcoat (a second lighting pass per pixel). A smoother standard
      // surface with a stronger reflection reads as the same black lacquer; the gold rim stays.
      if (materialOptions.lite)
        return inject(
          new MeshStandardMaterial({ color: "#050507", roughness: 0.1, metalness: 0.05, envMapIntensity: 1.35, ...(options.reveal ? { side: DoubleSide } : {}) }),
          { rim: 0.9, ...options },
        );
      return inject(
        new MeshPhysicalMaterial({
          color: "#050507",
          roughness: 0.16,
          metalness: 0.05,
          clearcoat: 1,
          clearcoatRoughness: 0.06,
          envMapIntensity: 1.1,
          // The burned-open shell shows its inside face through the hole.
          ...(options.reveal ? { side: DoubleSide } : {}),
        }),
        options,
      );
    case "gold":
      return inject(new MeshStandardMaterial({ color: "#c79d66", metalness: 1, roughness: 0.3, envMapIntensity: 1.2 }), options);
    case "string":
      return inject(new MeshStandardMaterial({ color: "#e2c08e", metalness: 1, roughness: 0.22, envMapIntensity: 1.4 }), options);
    case "iron":
      return inject(new MeshStandardMaterial({ color: "#2a2620", metalness: 0.8, roughness: 0.45 }), options);
    case "ivory":
      return inject(new MeshStandardMaterial({ color: "#efe8d9", roughness: 0.32, metalness: 0 }), options);
    case "ebony":
      if (materialOptions.lite) return inject(new MeshStandardMaterial({ color: "#0b0b0d", roughness: 0.22, envMapIntensity: 1.1 }), options);
      return inject(new MeshPhysicalMaterial({ color: "#0b0b0d", roughness: 0.28, clearcoat: 0.6, clearcoatRoughness: 0.2 }), options);
    case "spruce":
      return inject(new MeshStandardMaterial({ color: "#5e4226", roughness: 0.72, metalness: 0, envMapIntensity: 0.45 }), options);
    case "keywood":
      return inject(new MeshStandardMaterial({ color: "#c9a874", roughness: 0.7, metalness: 0 }), options);
    case "felt":
      return inject(new MeshStandardMaterial({ color: "#e6dece", roughness: 1, metalness: 0 }), options);
    case "darkFelt":
      return inject(new MeshStandardMaterial({ color: "#1a1714", roughness: 1, metalness: 0 }), options);
  }
}
