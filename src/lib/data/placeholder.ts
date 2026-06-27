/**
 * Built-in placeholder content. The site renders entirely from this when
 * Supabase is not configured, so it builds and demos with zero setup.
 *
 * ⚠️  PLACEHOLDER — replace via the admin dashboard or by editing the database.
 * Every string/image here is safe to overwrite. See README "Replacing placeholders".
 */
import type {
  GalleryImage,
  MediaItem,
  Product,
  SiteContent,
} from "@/lib/types";

const ph = (file: string) => `/placeholders/${file}`;

/* -------------------------------------------------------------------------- */
/*  Catalogue                                                                  */
/* -------------------------------------------------------------------------- */

export const placeholderProducts: Product[] = [
  {
    id: "demo-nocturne-in-ash",
    slug: "nocturne-in-ash",
    title: "Nocturne in Ash",
    composer: "Reza Ohadi",
    shortDescription:
      "A slow nocturne built from a single recurring motif, dissolving into silence.",
    longDescription:
      "Nocturne in Ash unfolds like a memory at the edge of sleep — a single phrase returning, each time a little more worn. Written for solo piano, it favours restraint over display: long pedals, quiet inner voices, and a melody that never quite resolves. The score includes detailed pedalling and dynamic markings drawn from the composer's own performances.\n\n[PLACEHOLDER program note — replace with the real description.]",
    priceCents: 999,
    currency: "usd",
    difficulty: "Intermediate",
    instrument: "Solo Piano",
    genre: "Contemporary Classical",
    mood: "Introspective · Nocturnal",
    durationSeconds: 245,
    pages: 6,
    coverImage: ph("cover-1.svg"),
    previewImages: [ph("preview-1.svg"), ph("preview-2.svg"), ph("preview-3.svg")],
    audioPreviewUrl: null,
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    instagramUrl: "https://www.instagram.com/reza_ohadi/",
    pdfPath: null,
    published: true,
    featured: true,
    relatedSlugs: ["veil-of-snow", "elegy-for-a-still-room", "the-quiet-hour"],
    createdAt: "2026-01-12T10:00:00.000Z",
  },
  {
    id: "demo-veil-of-snow",
    slug: "veil-of-snow",
    title: "Veil of Snow",
    composer: "Reza Ohadi",
    shortDescription:
      "Crystalline arpeggios and suspended harmonies evoking first snowfall.",
    longDescription:
      "Veil of Snow is a study in stillness and shimmer. Cascading right-hand figures float over a slow, hymn-like left hand. The piece is approachable for the developing pianist while leaving room for rubato and colour.\n\n[PLACEHOLDER program note — replace with the real description.]",
    priceCents: 799,
    currency: "usd",
    difficulty: "Beginner",
    instrument: "Solo Piano",
    genre: "Contemporary Classical",
    mood: "Serene · Luminous",
    durationSeconds: 198,
    pages: 4,
    coverImage: ph("cover-2.svg"),
    previewImages: [ph("preview-2.svg"), ph("preview-1.svg")],
    audioPreviewUrl: null,
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    instagramUrl: null,
    pdfPath: null,
    published: true,
    featured: false,
    relatedSlugs: ["nocturne-in-ash", "northern-light"],
    createdAt: "2026-01-20T10:00:00.000Z",
  },
  {
    id: "demo-the-quiet-hour",
    slug: "the-quiet-hour",
    title: "The Quiet Hour",
    composer: "Reza Ohadi",
    shortDescription:
      "An intimate meditation for the hour before dawn — sparse, warm, unhurried.",
    longDescription:
      "The Quiet Hour sits between waking and dreaming. Built on open fifths and gentle suspensions, it asks the performer to listen as much as to play.\n\n[PLACEHOLDER program note — replace with the real description.]",
    priceCents: 899,
    currency: "usd",
    difficulty: "Intermediate",
    instrument: "Solo Piano",
    genre: "Cinematic",
    mood: "Tender · Still",
    durationSeconds: 222,
    pages: 5,
    coverImage: ph("cover-3.svg"),
    previewImages: [ph("preview-3.svg"), ph("preview-1.svg")],
    audioPreviewUrl: null,
    youtubeUrl: null,
    instagramUrl: null,
    pdfPath: null,
    published: true,
    featured: false,
    relatedSlugs: ["nocturne-in-ash", "letters-to-the-sea"],
    createdAt: "2026-02-02T10:00:00.000Z",
  },
  {
    id: "demo-letters-to-the-sea",
    slug: "letters-to-the-sea",
    title: "Letters to the Sea",
    composer: "Reza Ohadi",
    shortDescription:
      "Rolling left-hand swells beneath a long, singing melodic line.",
    longDescription:
      "Letters to the Sea is the most expansive piece in the collection — a wave-like accompaniment carrying a melody that rises and recedes. Recommended for advanced players comfortable with wide voicing and sustained phrasing.\n\n[PLACEHOLDER program note — replace with the real description.]",
    priceCents: 1299,
    currency: "usd",
    difficulty: "Advanced",
    instrument: "Solo Piano",
    genre: "Contemporary Classical",
    mood: "Sweeping · Romantic",
    durationSeconds: 312,
    pages: 9,
    coverImage: ph("cover-4.svg"),
    previewImages: [ph("preview-1.svg"), ph("preview-2.svg"), ph("preview-3.svg")],
    audioPreviewUrl: null,
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    instagramUrl: "https://www.instagram.com/reza_ohadi/",
    pdfPath: null,
    published: true,
    featured: true,
    relatedSlugs: ["the-quiet-hour", "northern-light", "nocturne-in-ash"],
    createdAt: "2026-02-15T10:00:00.000Z",
  },
  {
    id: "demo-elegy-for-a-still-room",
    slug: "elegy-for-a-still-room",
    title: "Elegy for a Still Room",
    composer: "Reza Ohadi",
    shortDescription: "A spare elegy in three voices, written in a single sitting.",
    longDescription:
      "Elegy for a Still Room is grief rendered quietly. Three independent voices weave and part across the keyboard.\n\n[PLACEHOLDER program note — replace with the real description.]",
    priceCents: 999,
    currency: "usd",
    difficulty: "Advanced",
    instrument: "Solo Piano",
    genre: "Contemporary Classical",
    mood: "Mournful · Intimate",
    durationSeconds: 268,
    pages: 7,
    coverImage: ph("cover-5.svg"),
    previewImages: [ph("preview-2.svg"), ph("preview-3.svg")],
    audioPreviewUrl: null,
    youtubeUrl: null,
    instagramUrl: null,
    pdfPath: null,
    published: true,
    featured: false,
    relatedSlugs: ["nocturne-in-ash", "the-quiet-hour"],
    createdAt: "2026-03-01T10:00:00.000Z",
  },
  {
    id: "demo-northern-light",
    slug: "northern-light",
    title: "Northern Light",
    composer: "Reza Ohadi",
    shortDescription:
      "Shifting modal colours and a hypnotic ostinato beneath a distant melody.",
    longDescription:
      "Northern Light glows and fades like an aurora — a steady ostinato grounding slow harmonic drift above.\n\n[PLACEHOLDER program note — replace with the real description.]",
    priceCents: 1099,
    currency: "usd",
    difficulty: "Virtuoso",
    instrument: "Solo Piano",
    genre: "Cinematic",
    mood: "Expansive · Hypnotic",
    durationSeconds: 351,
    pages: 11,
    coverImage: ph("cover-6.svg"),
    previewImages: [ph("preview-3.svg"), ph("preview-1.svg"), ph("preview-2.svg")],
    audioPreviewUrl: null,
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    instagramUrl: null,
    pdfPath: null,
    published: true,
    featured: false,
    relatedSlugs: ["letters-to-the-sea", "veil-of-snow"],
    createdAt: "2026-03-18T10:00:00.000Z",
  },
];

/* -------------------------------------------------------------------------- */
/*  Gallery                                                                     */
/* -------------------------------------------------------------------------- */

export const placeholderGallery: GalleryImage[] = [
  { id: "g1", imageUrl: ph("gallery-1.svg"), caption: "Rehearsal, late evening", location: "Studio A", eventDate: "2026-01-04", sortOrder: 1, width: 1000, height: 1300 },
  { id: "g2", imageUrl: ph("gallery-2.svg"), caption: "Soundcheck", location: "Concert Hall", eventDate: "2025-11-22", sortOrder: 2, width: 1300, height: 950 },
  { id: "g3", imageUrl: ph("gallery-3.svg"), caption: "Hands at rest", location: null, eventDate: null, sortOrder: 3, width: 1100, height: 1100 },
  { id: "g4", imageUrl: ph("gallery-4.svg"), caption: "Before the recital", location: "Recital Hall", eventDate: "2025-10-09", sortOrder: 4, width: 1000, height: 1300 },
  { id: "g5", imageUrl: ph("gallery-5.svg"), caption: "The instrument", location: null, eventDate: null, sortOrder: 5, width: 1300, height: 950 },
  { id: "g6", imageUrl: ph("gallery-6.svg"), caption: "Encore", location: "Concert Hall", eventDate: "2025-09-15", sortOrder: 6, width: 1100, height: 1100 },
  { id: "g7", imageUrl: ph("gallery-7.svg"), caption: "Portrait study", location: "Studio", eventDate: null, sortOrder: 7, width: 1000, height: 1300 },
  { id: "g8", imageUrl: ph("gallery-8.svg"), caption: "Open lid", location: null, eventDate: null, sortOrder: 8, width: 1300, height: 950 },
];

/* -------------------------------------------------------------------------- */
/*  Media                                                                       */
/* -------------------------------------------------------------------------- */

export const placeholderMedia: MediaItem[] = [
  { id: "m1", title: "Nocturne in Ash — Live", type: "youtube", category: "Performance", youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", audioUrl: null, instagramUrl: null, poster: ph("gallery-2.svg"), description: "[PLACEHOLDER] Live performance — replace with a real YouTube link.", featured: true },
  { id: "m2", title: "Letters to the Sea — Studio", type: "youtube", category: "Performance", youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", audioUrl: null, instagramUrl: null, poster: ph("gallery-5.svg"), description: "[PLACEHOLDER] Studio session.", featured: false },
  { id: "m3", title: "The Quiet Hour", type: "youtube", category: "Original", youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", audioUrl: null, instagramUrl: null, poster: ph("gallery-8.svg"), description: "[PLACEHOLDER] Original composition.", featured: false },
  { id: "m4", title: "Improvisation no. 4", type: "audio", category: "Improvisation", youtubeUrl: null, audioUrl: null, instagramUrl: null, poster: ph("gallery-3.svg"), description: "[PLACEHOLDER] Audio-only — add an MP3/WAV URL.", featured: false },
  { id: "m5", title: "Behind the score", type: "instagram", category: "Reel", youtubeUrl: null, audioUrl: null, instagramUrl: "https://www.instagram.com/reza_ohadi/", poster: ph("gallery-6.svg"), description: "[PLACEHOLDER] Instagram reel.", featured: false },
];

/* -------------------------------------------------------------------------- */
/*  Site content (hero, bio, social, home)                                     */
/* -------------------------------------------------------------------------- */

export const defaultContent: SiteContent = {
  social: {
    instagram: "https://www.instagram.com/reza_ohadi/",
    youtube: "https://www.youtube.com/channel/UCtC_REvBHwkt6FNmxk6cEUQ",
    soundcloud: "https://soundcloud.com/rezaohadi",
    email: "rezaohadi.music@gmail.com",
  },
  hero: {
    headline: "Reza Ohadi",
    subtitle: "Pianist. Composer. Storyteller.",
    supporting: "Music shaped by memory, silence, and emotion.",
    image: ph("hero.svg"),
  },
  home: {
    artistStatement:
      "I write for the piano the way one writes letters never meant to be sent — quietly, and only when there is something that cannot be said any other way. Each piece begins with a single sound and the patience to follow it. [PLACEHOLDER artist statement.]",
    featuredProductSlug: "nocturne-in-ash",
    performances: [
      { title: "Solo Recital — Original Works", venue: "Concert Hall", location: "Toronto, CA", date: "2026-09-21" },
      { title: "An Evening of Nocturnes", venue: "Recital Hall", location: "Montréal, CA", date: "2026-11-08" },
      { title: "Cinematic Piano — Première", venue: "Arts Centre", location: "Vancouver, CA", date: "2027-02-14" },
    ],
  },
  bio: {
    intro:
      "Reza Ohadi is a pianist and composer whose work lives in the space between classical tradition and cinematic stillness. [PLACEHOLDER biography intro — replace with the real text.]",
    portraitImage: ph("portrait.svg"),
    wideImage: ph("bio-wide.svg"),
    statement:
      "My music is an attempt to hold a single feeling long enough to understand it. I am less interested in virtuosity than in atmosphere — in the resonance after a note, the silence that frames a phrase. [PLACEHOLDER composer statement.]",
    philosophy:
      "I believe a piece of music should feel like a room you can walk into. The goal is never to impress, but to invite — to give the listener somewhere quiet to stand for a few minutes. [PLACEHOLDER personal philosophy.]",
    education: [
      { year: "20XX", title: "Conservatory of Music", description: "[PLACEHOLDER] Advanced performance studies." },
      { year: "20XX", title: "Composition Studies", description: "[PLACEHOLDER] Private study in composition and orchestration." },
    ],
    timeline: [
      { year: "20XX", title: "First public recital", description: "[PLACEHOLDER milestone.]" },
      { year: "20XX", title: "Début collection of original works", description: "[PLACEHOLDER milestone.]" },
      { year: "20XX", title: "First commissioned film score", description: "[PLACEHOLDER milestone.]" },
      { year: "2026", title: "Digital sheet-music catalogue launches", description: "[PLACEHOLDER milestone.]" },
    ],
    performances: [
      { title: "Solo Recital", venue: "Concert Hall", location: "Toronto, CA", date: "2025-05-10" },
      { title: "Chamber Evening", venue: "Recital Hall", location: "Ottawa, CA", date: "2024-10-02" },
    ],
    pullQuotes: [
      "Music shaped by memory, silence, and emotion.",
      "The resonance after a note matters as much as the note.",
    ],
    signatureImage: ph("signature.svg"),
    listenWhileReadingUrl: null,
  },
  media: placeholderMedia,
};
