/** Homepage-only art direction. Coordinates are shared by every chapter. */
export const universeConfig = {
  chapters: [
    { id: "home", label: "Entry", number: "00" },
    { id: "about", label: "Biography", number: "01" },
    { id: "music", label: "Music", number: "02" },
  ],
  maxWorks: 3,
  camera: { startZ: 12, endZ: -32, fov: 40, damping: 12.5 }, // 80ms response, independent of frame rate.
  desktop: { dpr: 1.5, strings: 64, particles: 420 },
  mobile: { dpr: 1.0, strings: 14, particles: 64 },
} as const;
