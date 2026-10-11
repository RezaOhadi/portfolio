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
  /** Built segments get their full runway; unbuilt ones collapse until their world lands. */
  built: boolean;
}

export const SEGMENTS: SegmentDef[] = [
  { id: "piano", kind: "world", motion: "orbit", built: true },
  { id: "explode", kind: "transition", motion: "explode", runway: 1.25, built: true },
  { id: "exploded", kind: "world", motion: "pull-back crane", built: true },
  { id: "dive", kind: "transition", motion: "camera dive", runway: 1.2, built: true },
  { id: "corridor", kind: "world", motion: "dive", built: true },
  { id: "twist", kind: "transition", motion: "twist 90°", runway: 1.1, built: true },
  { id: "hammers", kind: "world", motion: "barrel roll", built: true },
  { id: "portal", kind: "transition", motion: "portal", runway: 1, built: true },
  { id: "strings", kind: "world", motion: "fly-along", built: true },
  { id: "dissolve", kind: "transition", motion: "dissolve", runway: 1.2, built: true },
  { id: "soundboard", kind: "world", motion: "overhead descent", built: true },
  { id: "morph", kind: "transition", motion: "morph", runway: 1.2, built: false },
  { id: "name", kind: "world", motion: "dolly zoom", built: false },
  { id: "reassemble", kind: "transition", motion: "reassemble + swing", runway: 1.3, built: false },
  { id: "outro", kind: "world", motion: "arc swing", built: false },
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

export type QualityTier = "high" | "mid" | "low";

export interface QualityProfile {
  /** Particle simulation texture edge: count = size². */
  particles: number;
  dpr: [number, number];
  dof: boolean;
  multisampling: number;
  envResolution: number;
}

export const QUALITY: Record<QualityTier, QualityProfile> = {
  high: { particles: 256, dpr: [1, 1.75], dof: true, multisampling: 4, envResolution: 256 },
  mid: { particles: 180, dpr: [1, 1.5], dof: false, multisampling: 0, envResolution: 128 },
  low: { particles: 128, dpr: [1, 1.25], dof: false, multisampling: 0, envResolution: 64 },
};

/** Matches the site's existing "mobile" query (PianoUniverse) so tiers agree sitewide. */
export const MOBILE_QUERY = "(max-width: 1024px), (any-pointer: coarse)";
