/**
 * "A Journey Through the Piano" — one scroll-scrubbed 3D world behind the
 * home page. The DOM is a sequence of segments: worlds carry the existing
 * content as overlays, transitions are empty scroll runways where the piano
 * changes form. Every world owns a different camera motion.
 */

export type SegmentKind = "world" | "transition";

export interface SegmentDef {
  id: string;
  kind: SegmentKind;
  /** Camera motion owned by this segment (worlds) or the effect it performs (transitions). */
  motion: string;
  /** Runway length for transitions, in viewport heights of pure transition. */
  runway?: number;
  /** Phones (copy stacked under the piano, STACKED_QUERY): a shorter runway the morph fills. */
  runwayStacked?: number;
  /** Built segments get their full runway; unbuilt ones collapse until their world lands. */
  built: boolean;
}

export const SEGMENTS: SegmentDef[] = [
  { id: "piano", kind: "world", motion: "orbit", built: true },
  { id: "explode", kind: "transition", motion: "explode", runway: 1.25, runwayStacked: 0.85, built: true },
  { id: "exploded", kind: "world", motion: "pull-back crane", built: true },
  { id: "dive", kind: "transition", motion: "camera dive", runway: 1.2, runwayStacked: 0.95, built: true },
  { id: "corridor", kind: "world", motion: "dive", built: true },
  { id: "twist", kind: "transition", motion: "twist 90°", runway: 1.1, runwayStacked: 0.8, built: true },
  { id: "hammers", kind: "world", motion: "barrel roll", built: true },
  { id: "portal", kind: "transition", motion: "portal", runway: 1, built: true },
  { id: "strings", kind: "world", motion: "fly-along", built: true },
  { id: "dissolve", kind: "transition", motion: "dissolve", runway: 1.2, runwayStacked: 1, built: true },
  { id: "soundboard", kind: "world", motion: "overhead descent", built: true },
  { id: "morph", kind: "transition", motion: "morph", runway: 1.4, runwayStacked: 1.2, built: true },
  { id: "name", kind: "world", motion: "dolly zoom", built: true },
  { id: "reassemble", kind: "transition", motion: "reassemble + swing", runway: 1.5, runwayStacked: 1.15, built: true },
  { id: "outro", kind: "world", motion: "arc swing", built: true },
];

export type SegmentId = (typeof SEGMENTS)[number]["id"];

/** Gold, ink and ivory from the site's own tokens (tailwind.config.ts, portfolio.css). */
export const PALETTE = {
  ink: "#060608",
  inkSoft: "#0a0a0c",
  ivory: "#f2eee6",
  gold: "#d5ae88",
  goldDeep: "#b48a5a",
  goldHot: "#f3d6ae",
} as const;

/**
 * "touch" is phones and tablets: a lighter render path that desktop never takes.
 * "lite" is any device whose first three seconds ran under LITE_FPS: fewer
 * particles, no post-processing, native resolution, the lighter materials.
 */
export type QualityTier = "high" | "mid" | "low" | "touch" | "lite";

export interface QualityProfile {
  /** Particle simulation texture edge: count = size². */
  particles: number;
  dpr: [number, number];
  dof: boolean;
  multisampling: number;
  envResolution: number;
  /** The post-processing chain (bloom, grain, vignette, tone mapping). Off only on the lite tier. */
  post: boolean;
}

// The pixel ratio is capped at 1.5 on desktop and 1 on phones and tablets: above
// that the extra pixels cost a full tier of frame time and are not visible.
export const QUALITY: Record<QualityTier, QualityProfile> = {
  high: { particles: 256, dpr: [1, 1.5], dof: true, multisampling: 4, envResolution: 256, post: true },
  mid: { particles: 180, dpr: [1, 1.5], dof: false, multisampling: 0, envResolution: 128, post: true },
  low: { particles: 128, dpr: [1, 1.25], dof: false, multisampling: 0, envResolution: 64, post: true },
  // About 8k particles (90²) at native resolution.
  touch: { particles: 90, dpr: [1, 1], dof: false, multisampling: 0, envResolution: 64, post: true },
  // The step down after a slow first three seconds, on any device.
  lite: { particles: 96, dpr: [1, 1], dof: false, multisampling: 0, envResolution: 64, post: false },
};

/**
 * The quality probe is a safety net for genuinely weak devices, nothing more.
 * Rendering is measured once per visit: the first PROBE_WARMUP seconds of
 * drawing are ignored (shader compilation, chunk arrival, the intro), then a
 * PROBE_SECONDS window is taken as a median, and a slow window only counts
 * when a second one agrees. Under LITE_FPS the scene steps down to the lite
 * tier and is measured again; under POSTER_FPS the still poster takes over.
 * A strong device (isStrongDevice) is never stepped down, and only shows the
 * poster when the scene cannot run at all (POSTER_FPS_STRONG).
 */
export const PROBE_WARMUP = 2.5;
export const PROBE_SECONDS = 4;
export const LITE_FPS = 30;
export const POSTER_FPS = 18;
export const POSTER_FPS_STRONG = 12;

/** Phones: the biography copy sits under the piano, not beside it (journey.module.css). */
export const STACKED_QUERY = "(max-width: 760px)";

/**
 * A flagship-class device: plenty of cores and memory and a current GPU, or a
 * GPU family known to be fast. Such a device keeps the full picture whatever
 * the first seconds looked like.
 */
export function isStrongDevice() {
  if (typeof window === "undefined") return false;
  if (isWeakGpu()) return false;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency ?? 0;
  const memory = nav.deviceMemory ?? 0;
  if (cores >= 8 && memory >= 6) return true;
  try {
    const gl = document.createElement("canvas").getContext("webgl");
    const info = gl?.getExtension("WEBGL_debug_renderer_info");
    const name = info ? String(gl!.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return /Adreno \(TM\) [6-9][0-9]{2}|Xclipse|Immortalis|Mali-G[7-9][0-9]|Apple (A1[3-9]|A[2-9][0-9]|M[1-9])/i.test(name);
  } catch {
    return false;
  }
}

/** What the probe decided, kept for the session so a revisit skips straight to it. */
export type QualityVerdict = "full" | "lite" | "poster";

/** Test-only: `?quality=lite` or `?quality=poster` forces a verdict; inert without the parameter. */
export function forcedQuality(): QualityVerdict | null {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("quality");
  return value === "lite" || value === "poster" || value === "full" ? value : null;
}

/**
 * A phone or tablet: a coarse primary pointer with real touch points and a
 * handheld-sized screen. Width alone is not enough (a narrow desktop window
 * is still a desktop GPU).
 */
/**
 * Test-only flags, inert without the query parameter:
 * - freeze: time and the intro stand still, nothing random fires, so a frame is
 *   deterministic and screenshots can be compared pixel for pixel;
 * - probe: the scene is exposed on window for measurements, as in development.
 */
export function testFlag(name: "freeze" | "probe") {
  return typeof window !== "undefined" && new URLSearchParams(window.location.search).has(name);
}

export function isTouchDevice() {
  if (typeof window === "undefined") return false;
  const touch = window.matchMedia("(pointer: coarse)").matches && navigator.maxTouchPoints > 0;
  const handheld = Math.min(window.screen.width, window.screen.height) <= 1024;
  return touch && handheld;
}

/** Older or low-end mobile GPUs, where even half-resolution bloom costs too much. */
export function isWeakGpu() {
  const nav = navigator as Navigator & { deviceMemory?: number };
  if ((nav.deviceMemory ?? 8) <= 3 || (nav.hardwareConcurrency ?? 8) <= 4) return true;
  try {
    const gl = document.createElement("canvas").getContext("webgl");
    const info = gl?.getExtension("WEBGL_debug_renderer_info");
    const name = info ? String(gl!.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return /Mali-(4|T[0-9]|G(3|5)[0-9])|Adreno \(TM\) [3-5][0-9]{2}|PowerVR|SwiftShader|Apple A(9|10|11)\b/i.test(name);
  } catch {
    return false;
  }
}

/** Matches the site's existing "mobile" query (PianoUniverse) so tiers agree sitewide. */
export const MOBILE_QUERY = "(max-width: 1024px), (any-pointer: coarse)";
