/** Homepage-only art direction. Coordinates are shared by every chapter. */
export const universeConfig = {
  chapters: [
    { id: "home", label: "Entry", number: "00" },
    { id: "about", label: "Biography", number: "01" },
    { id: "music", label: "Music", number: "02" },
  ],
  maxWorks: 3,
  camera: { startZ: 12, endZ: -32, fov: 40, damping: 7 },
  desktop: { dpr: 1.5, strings: 64, particles: 420 },
  mobile: { dpr: 1.25, strings: 32, particles: 120 },
} as const;
