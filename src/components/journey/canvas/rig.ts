import gsap from "gsap";
import { MathUtils, Vector3 } from "three";
import { SEGMENTS } from "../config";
import { journey, range } from "../store";

/**
 * The choreography state for the whole canvas. Scroll progress arrives raw
 * (and may jump on touch flings or anchor jumps); here it is integrated with
 * frame-rate independent damping so every world moves with physical inertia,
 * and scrolling backwards replays everything in reverse.
 */
export const rig = {
  time: 0,
  /** First-load choreography, time based. */
  assemble: 0,
  materialize: 0,
  /** Damped segment progress. */
  piano: 0,
  explode: 0,
  exploded: 0,
  after: 0,
  /** Derived beats. */
  anticipation: 0,
  burst: 0,
  snap: 0,
  orbit: 0,
  free: 0,
  spread: 0,
  wave: 0,
  reveal: 0,
  /** World 1: lid opening angle (rad), pre-burst tremble, camera arrival. */
  lid: 0,
  tremble: 0,
  arrival: 0,
  /** World 2: the whole constellation turns as you read. */
  spin: 0,
  /** Worlds 3 to 7: damped progress of every later segment. */
  dive: 0,
  corridor: 0,
  twist: 0,
  hammers: 0,
  portal: 0,
  strings: 0,
  dissolve: 0,
  soundboard: 0,
  morph: 0,
  name: 0,
  reassemble: 0,
  outro: 0,
  /**
   * Particle chain: one value walks every mote through its forms.
   * 0 piano, 1 corridor motes, 2 strings, 3 soundboard sand, 4 waveform, 5 name, 6 piano.
   */
  chain: 0,
  /** How much studio light reaches the current stage (1 open studio, ~0 closed tunnel). */
  studio: 1,
  /** World position of the floating keyboard, the target of the dive. */
  keyboardPos: new Vector3(0, 1, 1),
  /** Full-frame gold flash that masks the cut between two stages (0..1). */
  flash: 0,
  /** Which stage is drawn. Exactly one is true outside a cut. */
  show: { piano: true, corridor: false, hammers: false, strings: false, board: false },
  /** Where the last hammer strikes: the iris of the portal opens around it. */
  portalPoint: new Vector3(),
  /** Corridor keys swing up off their pivots into blades during the twist (0..1). */
  fin: 0,
  /** Hammer-world time scale: 1 normal slow motion, ~0 bullet time while a performance is hovered. */
  timeScale: 1,
  /** Accumulated hammer-world time, advanced by timeScale. */
  hammerTime: 0,
  /** Shared with post-processing. */
  focus: new Vector3(0, 0.9, -0.95),
  dof: 0,
  velocity: 0,
};

export const ease = {
  burst: gsap.parseEase("expo.out"),
  tumble: gsap.parseEase("power3.out"),
  camera: gsap.parseEase("power2.inOut"),
  recoil: gsap.parseEase("power3.inOut"),
  settle: gsap.parseEase("sine.inOut"),
};

const damp = (current: number, target: number, lambda: number, dt: number) =>
  current + (target - current) * (1 - Math.exp(-lambda * dt));

const bell = (v: number) => Math.sin(Math.PI * Math.min(1, Math.max(0, v))) ** 2;

/** Smooth up-plateau-down window. */
const windowed = (v: number, a: number, b: number, c: number, d: number) => {
  const up = ease.settle(range(v, a, b));
  const down = ease.settle(range(v, c, d));
  return up * (1 - down);
};

let introStart = -1;

type LaterId = "dive" | "corridor" | "twist" | "hammers" | "portal" | "strings" | "dissolve" | "soundboard" | "morph" | "name" | "reassemble" | "outro";
const LATER: LaterId[] = ["dive", "corridor", "twist", "hammers", "portal", "strings", "dissolve", "soundboard", "morph", "name", "reassemble", "outro"];
const TRANSITIONS = new Set(SEGMENTS.filter((s) => s.kind === "transition").map((s) => s.id));
/** The first world not built yet: the canvas recedes as its content arrives. */
const UNBUILT = SEGMENTS.find((s) => s.kind === "world" && !s.built)?.id ?? "";

export function stepRig(elapsed: number, dt: number) {
  const r = journey.raw;
  rig.time = elapsed;
  if (introStart < 0) introStart = elapsed;
  const intro = elapsed - introStart;

  if (journey.reduced) {
    // Still frames: each world shows its resting pose, transitions cut at their midpoint.
    rig.assemble = rig.materialize = 1;
    rig.piano = 0.3;
    rig.explode = r.explode > 0.5 ? 1 : 0;
    rig.exploded = 0.5;
    for (const id of LATER) rig[id] = TRANSITIONS.has(id) ? (r[id] > 0.5 ? 1 : 0) : r[id] > 0.02 ? 0.5 : 0;
    rig.after = r[UNBUILT] > 0.04 ? 1 : 0;
  } else {
    rig.assemble = Math.min(1, intro / 3.4);
    // On arrival the lacquer burns in; at the end it burns in again as the piano reassembles.
    rig.materialize = rig.dive >= 0.5 ? ease.settle(range(rig.reassemble, 0.22, 0.88)) : range(intro, 1.5, 4.4);
    rig.piano = damp(rig.piano, r.piano, 6, dt);
    rig.explode = damp(rig.explode, r.explode, 7, dt);
    rig.exploded = damp(rig.exploded, r.exploded, 6, dt);
    for (const id of LATER) rig[id] = damp(rig[id], r[id], 6.5, dt);
    rig.after = UNBUILT ? damp(rig.after, r[UNBUILT], 4, dt) : 0;
  }

  // Dive (World 2 -> 3): approach the keyboard, flash, cut, then the keyboard folds into a tunnel.
  const cutDive = rig.dive >= 0.5;
  // Twist (World 3 -> 4): the keys swing up into blades as the camera rolls, cut, the hammers rise.
  const cutTwist = rig.twist >= 0.5;
  // Portal (World 4 -> 5): into the iris of a hammer strike, out flying along the strings.
  const cutPortal = rig.portal >= 0.5;
  // Reassemble (World 7): the piano comes back, built out of the name.
  rig.show.piano = !cutDive || rig.reassemble > 0.02;
  rig.show.corridor = cutDive && !cutTwist;
  rig.show.hammers = cutTwist && !cutPortal;
  // Dissolve (World 5 -> 6): one stage, no cut. Strings break into dust that rains onto the board.
  rig.show.strings = cutPortal && rig.dissolve < 0.9;
  rig.show.board = cutPortal;
  rig.fin = journey.reduced ? 0 : ease.recoil(range(rig.twist, 0.05, 0.5));
  const flash = (v: number) => (journey.reduced ? 0 : bell(range(v, 0.4, 0.6)) * 0.95);
  rig.flash = Math.max(flash(rig.dive), flash(rig.twist), flash(rig.portal));
  rig.chain =
    ease.settle(range(rig.dive, 0.28, 0.82)) +
    ease.settle(range(rig.portal, 0.3, 0.85)) +
    ease.settle(range(rig.dissolve, 0.12, 0.85)) +
    // Morph: sand lifts into a waveform, then the waveform becomes the name.
    ease.settle(range(rig.morph, 0.04, 0.5)) +
    ease.settle(range(rig.morph, 0.5, 0.95)) +
    ease.settle(range(rig.reassemble, 0.06, 0.72));

  // Slow-motion hammers; hovering a performance freezes them (bullet time).
  rig.timeScale = damp(rig.timeScale, journey.bullet ? 0.03 : 1, 5, dt);
  rig.hammerTime += dt * rig.timeScale * (journey.reduced ? 0 : 1);

  const e = rig.explode;
  // World 1: the camera arrives (time), the lid opens on arrival then wide with scroll.
  rig.arrival = journey.reduced ? 1 : ease.recoil(range(intro, 0.3, 4.2));
  rig.lid = 0.05 + ease.settle(range(intro, 1.8, 4.6)) * 0.5 + ease.settle(rig.piano) * 0.42;
  rig.tremble = journey.reduced ? 0 : ease.settle(range(rig.piano, 0.6, 1)) * (1 - range(e, 0.02, 0.08));
  rig.anticipation = bell(range(e, 0, 0.09));
  rig.burst = journey.reduced ? 0 : bell(range(e, 0.02, 0.32));
  rig.snap = journey.reduced ? 0 : windowed(rig.exploded, 0.38, 0.5, 0.62, 0.74);
  const out = ease.burst(range(e, 0.03, 0.6));
  rig.orbit = out * (1 - rig.snap);
  rig.spin = ease.settle(range(rig.exploded, 0.05, 1)) * 2.4;
  // The nebula gathers back onto the parts as World 2 ends.
  rig.free = out * (1 - rig.snap * 0.85) * (1 - range(rig.exploded, 0.78, 1) * 0.75) * (1 - range(rig.dive, 0.05, 0.45));
  rig.spread = 0.42 * ease.burst(range(e, 0.15, 0.7));
  rig.wave = 0.035 * out * (1 - rig.snap);
  rig.dof = out;
  // Reassembly settles the constellation before the parts dock.
  if (rig.reassemble > 0) {
    const calm = 1 - ease.settle(range(rig.reassemble, 0, 0.4));
    rig.spin *= calm;
    rig.orbit *= calm;
    rig.spread *= calm;
    rig.wave *= calm;
    rig.snap = 0;
    rig.free = 0;
    rig.lid = MathUtils.lerp(rig.lid, 0.66, ease.settle(range(rig.reassemble, 0.5, 1)));
  }

  // World 1 surprise: only while the piano is whole and a real mouse is present.
  const revealTarget = journey.pointer.mouse && !journey.reduced ? (1 - range(e, 0, 0.04)) * rig.materialize : 0;
  rig.reveal = damp(rig.reveal, revealTarget, 6, dt);
  rig.velocity = damp(rig.velocity, Math.min(1, Math.abs(journey.velocity) / 60), 8, dt);
}

/**
 * How far a part has docked back during the reassembly. The burst order is
 * reversed: legs and lyre first, the lid last, the way a piano is built.
 */
function docked(delay: number) {
  const start = 0.18 + (0.26 - delay) * 0.9;
  return ease.recoil(range(rig.reassemble, start, start + 0.45));
}

/** Explode progress of one part, with its stagger (undone again by the reassembly). */
export function partProgress(delay: number) {
  return ease.burst(range(rig.explode, 0.02 + delay * 0.7, 0.02 + delay * 0.7 + 0.45)) * (1 - docked(delay));
}
export function partTumble(delay: number) {
  return ease.tumble(range(rig.explode, 0.02 + delay * 0.7, 0.02 + delay * 0.7 + 0.55)) * (1 - docked(delay));
}
