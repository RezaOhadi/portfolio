/**
 * The navigation octave, C4 to B4. Every key names its own pitch: the same key
 * always sounds the same note (equal temperament, A4 = 440 Hz; see
 * components/journey/audio.ts and scripts/pitch-test.mjs).
 */
export interface OctaveKey {
  /** Letter printed on the key. */
  note: string;
  /** Scientific pitch name the key plays. */
  pitch: string;
  id: string;
  label: string;
  /** Target on the home page (an anchor into the journey) and on other pages. */
  home: string;
  route: string;
}

export const WHITE_KEYS: OctaveKey[] = [
  { note: "C", pitch: "C4", id: "home", label: "Home", home: "#home", route: "/" },
  { note: "D", pitch: "D4", id: "about", label: "About", home: "#about", route: "/biography" },
  { note: "E", pitch: "E4", id: "media", label: "Listen & Watch", home: "#media", route: "/media" },
  { note: "F", pitch: "F4", id: "concerts", label: "Concerts", home: "#concerts", route: "/#concerts" },
  { note: "G", pitch: "G4", id: "gallery", label: "Gallery", home: "#gallery", route: "/gallery" },
  { note: "A", pitch: "A4", id: "contact", label: "Contact", home: "#contact", route: "/contact" },
  { note: "B", pitch: "B4", id: "store", label: "Sheet Music", home: "/store", route: "/store" },
];

/**
 * Decorative but playable. `after`: the white key each one sits behind.
 * `shift`: on a real keyboard the sharps sit slightly off the seam (C#, D# lean
 * apart; F#, A# lean apart around G#), as a fraction of the black key's width.
 */
export const BLACK_KEYS = [
  { pitch: "C#4", after: 0, shift: -0.12 },
  { pitch: "D#4", after: 1, shift: 0.12 },
  { pitch: "F#4", after: 3, shift: -0.16 },
  { pitch: "G#4", after: 4, shift: 0 },
  { pitch: "A#4", after: 5, shift: 0.16 },
] as const;
