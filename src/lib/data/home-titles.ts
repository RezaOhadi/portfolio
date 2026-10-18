import type { HomeContent, HomeTitles, SectionTitle } from "@/lib/types";

/**
 * The home page's section titles. These defaults are the exact copy the page
 * shipped with; the admin "Section titles" form overrides them per key, and a
 * blank saved title falls back to the default rather than rendering empty.
 */
export const DEFAULT_HOME_TITLES: HomeTitles = {
  about: { text: "A life at", accent: "the piano." },
  music: { text: "Where silence", accent: "takes shape." },
  scores: { text: "New to the catalogue." },
  media: { text: "Music, in the moment." },
  concerts: { text: "Upcoming & recent." },
  gallery: { text: "Beyond the notes." },
  contact: { text: "Let’s make\nsomething resonant." },
};

export const HOME_TITLE_KEYS = Object.keys(DEFAULT_HOME_TITLES) as (keyof HomeTitles)[];

/** Where each title appears, for the admin form. */
export const HOME_TITLE_LABELS: Record<keyof HomeTitles, string> = {
  about: "01 / The artist (beside the exploded piano)",
  music: "02 / The music",
  scores: "The catalogue",
  media: "02 / Listen & watch",
  concerts: "03 / On stage",
  gallery: "04 / In frame",
  contact: "05 / Get in touch",
};

export function resolveHomeTitles(home: HomeContent): HomeTitles {
  const saved = home.titles ?? {};
  const out = {} as HomeTitles;
  for (const key of HOME_TITLE_KEYS) {
    const s: SectionTitle | undefined = saved[key];
    out[key] =
      s && s.text?.trim()
        ? { text: s.text.trim(), accent: s.accent?.trim() || undefined }
        : DEFAULT_HOME_TITLES[key];
  }
  return out;
}
