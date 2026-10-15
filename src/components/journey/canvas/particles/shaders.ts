/**
 * GPGPU particle shaders. Every particle belongs to a part and sits at a
 * sampled point in that part's local space; the part matrices arrive as a
 * uniform array, so dust follows the real geometry through the explode.
 * Motion is a damped spring towards that target (stiffness varies per
 * particle, so dust trails behind fast parts), plus free-dust nebulae, the
 * burst impulse and cursor repulsion.
 */

import { STRINGS } from "../stages/stringLayout";
import { RIPPLE_GLSL } from "../stages/boardLayout";

/** Where the waveform and the name stand: above the board, facing the camera. */
export const NAME = { y: 1.25, z: -0.6, width: 7.4 } as const;

export const PART_COUNT = 13;

const COMMON = /* glsl */ `
uniform mat4 uParts[${PART_COUNT}];
uniform sampler2D tLocal;
uniform sampler2D tMeta;
uniform float uTime, uAssemble, uFree, uKeySpread, uWave;
uniform vec3 uCenter;

float h11(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

vec3 partTarget(vec2 uv, out float isFree, out vec3 radial){
  vec4 L = texture2D(tLocal, uv);
  vec4 M = texture2D(tMeta, uv);
  vec3 lp = L.xyz;
  if (M.z > 0.5) {
    float hammers = step(1.5, M.z);
    lp.x += M.w * uKeySpread;
    lp.y += sin(M.w * 9.0 + uTime * 1.6 + hammers * 1.2) * uWave * mix(1.0, 0.8, hammers);
  }
  vec3 t = (uParts[int(L.w + 0.5)] * vec4(lp, 1.0)).xyz;
  float h1 = h11(uv * 17.13), h2 = h11(uv * 31.7 + 3.1), h3 = h11(uv * 7.7 + 9.2);
  isFree = step(h1, 0.24);
  radial = normalize(t - uCenter + vec3(0.0001));
  vec3 swirl = vec3(
    sin(t.y * 2.1 + uTime * 0.35 + h2 * 6.283),
    sin(t.z * 1.7 + uTime * 0.31 + h3 * 6.283),
    sin(t.x * 1.9 + uTime * 0.27 + h1 * 6.283));
  t += isFree * uFree * (radial * (0.2 + h2 * 1.1) + swirl * (0.35 + h3 * 0.5));
  // First load: dust gathers from a wide shell into the piano.
  vec3 scatter = uCenter + normalize(vec3(h1 - 0.5, h2 - 0.5, h3 - 0.5) + 0.001) * (4.0 + h2 * 6.0);
  float a = clamp(uAssemble * 1.6 - h3 * 0.6, 0.0, 1.0);
  a = a * a * (3.0 - 2.0 * a);
  return mix(scatter, t, a);
}

/* ---- the particle chain: one uniform walks every mote through its forms ---- */
uniform float uChain, uStagger;
uniform vec3 uCam;

/** 1: motes streaming down the key corridor towards the camera. */
vec3 corridorTarget(vec2 uv){
  float h1 = h11(uv * 13.1 + 1.7), h2 = h11(uv * 29.3 + 4.4), h3 = h11(uv * 5.9 + 8.1);
  float z = uCam.z + 1.5 - fract(h3 + uTime * 0.035) * 28.0;
  vec2 xy = vec2(h1 - 0.5, h2 - 0.5) * 1.5;
  return vec3(uCam.x + xy.x * 1.3, uCam.y + xy.y - 0.08, z);
}

/** 2: motes riding the gold strings, with the strings' own standing waves. */
uniform sampler2D tStrAmp;
uniform float uStrTime;
vec3 stringsTarget(vec2 uv){
  float s = min(floor(uv.x * ${STRINGS.count}.0), ${STRINGS.count - 1}.0);
  float along = uv.y;
  float bass = step(s, ${STRINGS.bass - 1}.0);
  float a = bass * ${STRINGS.bassAngle.toFixed(4)};
  float t = along - 0.5;
  float x = ${STRINGS.x0.toFixed(4)} + s * ${STRINGS.dx.toFixed(4)} + bass * 0.55 + t * ${STRINGS.length}.0 * sin(a);
  float z = ${(STRINGS.z0 - STRINGS.length / 2).toFixed(4)} + t * ${STRINGS.length}.0 * cos(a);
  float amp = texture2D(tStrAmp, vec2((s + 0.5) / 256.0, 0.5)).r;
  float ph = s * 1.71;
  float wave = amp * 0.05 * (sin(3.14159 * along) * sin(uStrTime * 24.0 + ph) + 0.35 * sin(6.28318 * along) * sin(uStrTime * 48.0 + ph * 1.3));
  return vec3(x, ${STRINGS.y.toFixed(4)} + bass * ${STRINGS.bassLift.toFixed(4)} - wave + 0.007, z);
}

/** 3: sand on the soundboard, lifted and dropped by its resonance ripples. */
${RIPPLE_GLSL}
uniform sampler2D tBoard;
vec3 boardTarget(vec2 uv){
  vec2 xz = texture2D(tBoard, uv).xy;
  return vec3(xz.x, BOARD_Y + boardRipple(xz) + 0.012, xz.y);
}

/** 4: a living audio waveform, filled between its envelope, standing over the board. */
uniform float uWaveTime;
vec3 waveTarget(vec2 uv){
  float x = (uv.x - 0.5) * 8.6;
  float env = exp(-x * x * 0.07) * (0.55 + 0.45 * sin(x * 0.9 - uWaveTime * 0.7));
  float w = env * (0.62 * sin(x * 3.1 + uWaveTime * 1.3) + 0.3 * sin(x * 7.7 - uWaveTime * 2.1) + 0.14 * sin(x * 17.0 + uWaveTime * 4.0));
  float fill = uv.y * 2.0 - 1.0;
  return vec3(x, ${NAME.y.toFixed(3)} + w * fill * 0.95, ${NAME.z.toFixed(3)} + (h11(uv * 4.1) - 0.5) * 0.16);
}

/** 5: the artist's name, sampled from the site's own display face. */
uniform sampler2D tName;
vec3 nameTarget(vec2 uv){
  vec4 n = texture2D(tName, uv);
  return vec3(n.x, n.y, n.z + sin(uWaveTime * 0.6 + n.x * 1.3) * 0.03);
}

// Single exit throughout: ANGLE's HLSL backend warns on early returns here.
vec3 stageTarget(int i, vec2 uv, out float isFree, out vec3 radial){
  isFree = 0.0;
  radial = vec3(0.0, 1.0, 0.0);
  vec3 t = vec3(0.0);
  if (i == 0 || i >= 6) {
    t = partTarget(uv, isFree, radial);
  } else if (i == 5) {
    t = nameTarget(uv);
  } else if (i == 4) {
    t = waveTarget(uv);
  } else if (i == 3) {
    t = boardTarget(uv);
  } else if (i == 2) {
    t = stringsTarget(uv);
  } else {
    t = corridorTarget(uv);
    radial = normalize(t - uCam + vec3(0.0001));
  }
  return t;
}

/** Each step of the chain is staggered per mote so forms dissolve and gather organically. */
vec3 chainTarget(vec2 uv, out float isFree, out vec3 radial){
  isFree = 0.0;
  radial = vec3(0.0, 1.0, 0.0);
  float i = floor(uChain);
  float f = uChain - i;
  float s = uStagger;
  float fp = clamp(f * (1.0 + s) - h11(uv * 3.3 + 0.7) * s, 0.0, 1.0);
  fp = fp * fp * (3.0 - 2.0 * fp);
  float freeA = 0.0, freeB = 0.0;
  vec3 radA = radial, radB = radial;
  vec3 a = stageTarget(int(i), uv, freeA, radA);
  vec3 b = a;
  if (f >= 0.0001) b = stageTarget(int(i) + 1, uv, freeB, radB);
  else { freeB = freeA; radB = radA; fp = 0.0; }
  isFree = mix(freeA, freeB, fp);
  radial = normalize(mix(radA, radB, fp) + vec3(0.0001));
  return mix(a, b, fp);
}
`;

export const velocityShader = /* glsl */ `
${COMMON}
uniform float uDelta, uBurst, uSnapAll, uMouse, uMouseRadius, uMouseStrength;
uniform vec3 uRayO, uRayD;

void main(){
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec3 pos = texture2D(texturePosition, uv).xyz;
  vec3 vel = texture2D(textureVelocity, uv).xyz;
  if (uSnapAll > 0.5) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
  float isFree; vec3 radial;
  vec3 target = chainTarget(uv, isFree, radial);
  float stiff = texture2D(tMeta, uv).x;
  float k = mix(12.0, 48.0, stiff) * mix(1.0, 0.3, isFree * uFree);
  float c = 2.0 * sqrt(k) * 0.6;
  vec3 acc = (target - pos) * k - vel * c;
  acc += radial * uBurst * (5.0 + stiff * 16.0) * (0.4 + isFree);
  // Cursor: push away from the pointer ray.
  vec3 w = pos - uRayO;
  vec3 cp = uRayO + uRayD * max(dot(w, uRayD), 0.0);
  vec3 dv = pos - cp;
  float dist = length(dv);
  acc += (dv / (dist + 0.0001)) * uMouse * smoothstep(uMouseRadius, 0.0, dist) * uMouseStrength;
  vel += acc * uDelta;
  gl_FragColor = vec4(vel, 1.0);
}
`;

export const positionShader = /* glsl */ `
${COMMON}
uniform float uDelta, uSnapAll;

void main(){
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec3 pos = texture2D(texturePosition, uv).xyz;
  vec3 vel = texture2D(textureVelocity, uv).xyz;
  float isFree; vec3 radial;
  vec3 target = chainTarget(uv, isFree, radial);
  // Reduced motion draws the resting pose; a looping stream re-spawns instead of flying back.
  if (uSnapAll > 0.5 || (uChain > 0.5 && distance(target, pos) > 9.0 && uChain - floor(uChain) < 0.0001)) {
    gl_FragColor = vec4(target, 1.0);
    return;
  }
  gl_FragColor = vec4(pos + vel * uDelta, 1.0);
}
`;

export const renderVertex = /* glsl */ `
uniform sampler2D tPosition;
uniform sampler2D tVelocity;
uniform float uSize, uScale, uOpacity, uFree, uMaxSize;
attribute vec2 ref;
varying float vHeat;
varying float vAlpha;
varying float vName;

float h11(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

void main(){
  vec3 p = texture2D(tPosition, ref).xyz;
  float speed = length(texture2D(tVelocity, ref).xyz);
  vHeat = smoothstep(0.15, 2.6, speed);
  float r = h11(ref * 91.7);
  // Same hash as the simulation: free dust becomes a soft, larger, warmer haze.
  float haze = step(h11(ref * 17.13), 0.24) * uFree;
  vHeat = max(vHeat, haze * 0.45);
  vAlpha = uOpacity * (0.35 + r * 0.65) * (1.0 - haze * 0.45);
  // Dust that can carry the name's richer gold: everything but the free haze.
  vName = 1.0 - haze;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  // Close-up dust is capped so depth of field never turns it into screen-filling discs.
  gl_PointSize = clamp(uSize * (0.55 + r * 0.9) * (1.0 + vHeat * 0.8 + haze * 0.9) * uScale / -mv.z, 1.0, uMaxSize);
}
`;

export const renderFragment = /* glsl */ `
uniform vec3 uGold;
uniform vec3 uHot;
// The name's own gold: a richer, brighter pair than the dust (uNameMix rises as the name forms),
// lifted by uNameLift. The tier sets how far (ParticleField): phones go much stronger than desktop.
uniform vec3 uNameGold;
uniform vec3 uNameHot;
uniform float uNameMix;
uniform float uNameLift;
varying float vHeat;
varying float vAlpha;
varying float vName;

void main(){
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float core = smoothstep(0.5, 0.0, d);
  float name = uNameMix * vName;
  vec3 base = mix(mix(uGold, uHot, vHeat), mix(uNameGold, uNameHot, vHeat), name);
  vec3 col = base * (0.9 + vHeat * 3.2) * (1.0 + name * uNameLift);
  gl_FragColor = vec4(col * core, core * vAlpha);
}
`;
