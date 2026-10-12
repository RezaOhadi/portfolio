import { Vector4 } from "three";

/**
 * The soundboard: one ripple function, shared by the board's vertex shader,
 * the sand of motes riding on it, and the gallery photographs floating
 * above it, so all three move with the same waves.
 */
/** The board takes the grand piano's own plan shape at stage scale: x = planX * scale, z = front - depth * scale. */
export const BOARD = { y: -0.8, scale: 6, front: 6.2, ripples: 8 } as const;

export const boardX = (planX: number) => planX * BOARD.scale;
export const boardZ = (planDepth: number) => BOARD.front - planDepth * BOARD.scale;

/** Each ripple: x, z, birth time, strength. */
export const boardShared = {
  uRipples: { value: Array.from({ length: BOARD.ripples }, () => new Vector4(0, 0, -100, 0)) },
  uBoardTime: { value: 0 },
  /** 1 while any ripple is live (age 0..9, strength > 0); 0 lets the board's vertex shader skip the ripple loops. */
  uLive: { value: 0 },
};

/** Called once per frame after uBoardTime is written: the same test the shader's loop makes. */
export function updateLive() {
  const now = boardShared.uBoardTime.value;
  boardShared.uLive.value = boardShared.uRipples.value.some((r) => { const age = now - r.z; return age >= 0 && age <= 9 && r.w > 0; }) ? 1 : 0;
}

const f = (n: number) => n.toFixed(4);

/** GLSL: board height offset at (x, z). Wavefronts expand, interfere and fade. */
export const RIPPLE_GLSL = /* glsl */ `
uniform vec4 uRipples[${BOARD.ripples}];
uniform float uBoardTime;
uniform float uLive;
float boardRipple(vec2 p){
  float h = 0.0;
  if (uLive < 0.5) return 0.0;
  for (int i = 0; i < ${BOARD.ripples}; i++) {
    vec4 r = uRipples[i];
    float age = uBoardTime - r.z;
    if (age < 0.0 || age > 9.0 || r.w <= 0.0) continue;
    float d = distance(p, r.xy);
    float front = age * 1.6;
    float env = (1.0 - smoothstep(front - 1.2, front + 0.4, d)) * exp(-age * 0.42) * exp(-d * 0.16);
    h += r.w * env * sin(d * 5.2 - age * 7.0);
  }
  return h * 0.07;
}
const float BOARD_Y = ${f(BOARD.y)};
`;

/** Same function on the CPU, for the floating photographs. */
export function boardRipple(x: number, z: number) {
  let h = 0;
  const now = boardShared.uBoardTime.value;
  for (const r of boardShared.uRipples.value) {
    const age = now - r.z;
    if (age < 0 || age > 9 || r.w <= 0) continue;
    const d = Math.hypot(x - r.x, z - r.y);
    const front = age * 1.6;
    const t = Math.min(1, Math.max(0, (front + 0.4 - d) / 1.6));
    const env = t * t * (3 - 2 * t) * Math.exp(-age * 0.42) * Math.exp(-d * 0.16);
    h += r.w * env * Math.sin(d * 5.2 - age * 7);
  }
  return h * 0.07;
}

let next = 0;
/** Drop a note into the board at (x, z). */
export function dropRipple(x: number, z: number, strength = 1) {
  const r = boardShared.uRipples.value[next];
  r.set(x, z, boardShared.uBoardTime.value, strength);
  next = (next + 1) % BOARD.ripples;
}

/** Uniform random points inside the board's outline (the piano's plan), as x, z pairs. */
export function boardSamples(count: number, random: () => number, outline: { x: number; d: number }[]) {
  const poly = outline.map((p) => [boardX(p.x), boardZ(p.d)] as const);
  const xs = poly.map((p) => p[0]), zs = poly.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
  const inside = (x: number, z: number) => {
    let hit = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, zi] = poly[i];
      const [xj, zj] = poly[j];
      if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) hit = !hit;
    }
    return hit;
  };
  const out = new Float32Array(count * 2);
  for (let n = 0; n < count; ) {
    const x = x0 + random() * (x1 - x0);
    const z = z0 + random() * (z1 - z0);
    if (!inside(x, z)) continue;
    out[n * 2] = x;
    out[n * 2 + 1] = z;
    n++;
  }
  return out;
}
