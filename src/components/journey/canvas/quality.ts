/**
 * Live quality for the touch tier, stepped down by the governor (JourneyCanvas)
 * and read every frame by the parts it affects. It only ever goes down: a
 * phone that struggled once keeps the lighter setting for the visit, so the
 * picture never shifts back and forth in the middle of a scroll.
 */
export const touchQuality = {
  /** Fraction of the particles drawn. */
  particles: 1,
  /** Half-resolution bloom; off on weak GPUs or after the last step down. */
  bloom: true,
};

/** Desktop tiers keep the full materials; the touch tier swaps clearcoat for standard. */
export const materialOptions = { lite: false };
