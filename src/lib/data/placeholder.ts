/**
 * Built-in placeholder content. The site renders entirely from this when
 * Supabase is not configured, so it builds and demos with zero setup.
 *
 * NOTE — this is refined *temporary* copy. It is intentionally neutral and
 * invents no biographical facts. Replace everything here with real content via
 * the admin dashboard or database. See README "Replacing placeholders".
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
      "Nocturne in Ash unfolds like a memory at the edge of sleep — a single phrase returning, each time a little more worn. Written for solo piano, it favours restraint over display: long pedals, quiet inner voices, and a melody that never quite resolves. The score includes detailed pedalling and dynamic markings.",
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
      "Veil of Snow is a study in stillness and shimmer. Cascading right-hand figures float over a slow, hymn-like left hand. The piece is approachable for the developing pianist while leaving room for rubato and colour.",
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
      "The Quiet Hour sits between waking and dreaming. Built on open fifths and gentle suspensions, it asks the performer to listen as much as to play — a piece that rewards patience and a soft touch.",
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
      "Letters to the Sea is the most expansive piece in the collection — a wave-like accompaniment carrying a melody that rises and recedes. Recommended for advanced players comfortable with wide voicing and sustained phrasing.",
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
      "Elegy for a Still Room is grief rendered quietly. Three independent voices weave and part across the keyboard, never raising their voice — a study in counterpoint and emotional restraint.",
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
      "Northern Light glows and fades like an aurora — a steady ostinato grounding slow harmonic drift above. Its layered textures and shifting modes ask for control, stamina and a fine ear for balance.",
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
  { id: "g1", imageUrl: ph("gallery-1.svg"), caption: "Rehearsal, late evening", location: "Studio", eventDate: null, sortOrder: 1, width: 1000, height: 1300 },
  { id: "g2", imageUrl: ph("gallery-2.svg"), caption: "Soundcheck", location: "Concert hall", eventDate: null, sortOrder: 2, width: 1300, height: 950 },
  { id: "g3", imageUrl: ph("gallery-3.svg"), caption: "Hands at rest", location: null, eventDate: null, sortOrder: 3, width: 1100, height: 1100 },
  { id: "g4", imageUrl: ph("gallery-4.svg"), caption: "Before the recital", location: "Recital hall", eventDate: null, sortOrder: 4, width: 1000, height: 1300 },
  { id: "g5", imageUrl: ph("gallery-5.svg"), caption: "The instrument", location: null, eventDate: null, sortOrder: 5, width: 1300, height: 950 },
  { id: "g6", imageUrl: ph("gallery-6.svg"), caption: "Encore", location: "Concert hall", eventDate: null, sortOrder: 6, width: 1100, height: 1100 },
  { id: "g7", imageUrl: ph("gallery-7.svg"), caption: "Portrait study", location: "Studio", eventDate: null, sortOrder: 7, width: 1000, height: 1300 },
  { id: "g8", imageUrl: ph("gallery-8.svg"), caption: "Open lid", location: null, eventDate: null, sortOrder: 8, width: 1300, height: 950 },
];

/* -------------------------------------------------------------------------- */
/*  Media                                                                       */
/* -------------------------------------------------------------------------- */

export const placeholderMedia: MediaItem[] = [
  { id: "m1", title: "Nocturne in Ash — Live", type: "youtube", category: "Performance", youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", audioUrl: null, instagramUrl: null, poster: ph("gallery-2.svg"), description: "A live performance of an original work for solo piano.", featured: true },
  { id: "m2", title: "Letters to the Sea — Studio", type: "youtube", category: "Performance", youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", audioUrl: null, instagramUrl: null, poster: ph("gallery-5.svg"), description: "A studio session, captured in a single take.", featured: false },
  { id: "m3", title: "The Quiet Hour", type: "youtube", category: "Original", youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", audioUrl: null, instagramUrl: null, poster: ph("gallery-8.svg"), description: "An original composition for solo piano.", featured: false },
  { id: "m4", title: "Improvisation no. 4", type: "audio", category: "Improvisation", youtubeUrl: null, audioUrl: null, instagramUrl: null, poster: ph("gallery-3.svg"), description: "A short improvisation — audio only.", featured: false },
  { id: "m5", title: "Behind the score", type: "instagram", category: "Reel", youtubeUrl: null, audioUrl: null, instagramUrl: "https://www.instagram.com/reza_ohadi/", poster: ph("gallery-6.svg"), description: "A short reel from behind the scenes.", featured: false },
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
      "I write for the piano the way one writes letters never meant to be sent — quietly, and only when there is something that cannot be said any other way. Each piece begins with a single sound and the patience to follow where it leads.",
    featuredProductSlug: "nocturne-in-ash",
    performances: [
      { title: "Solo Recital — Original Works", venue: "Concert Hall", location: "City to be announced", date: "2026-09-21" },
      { title: "An Evening of Nocturnes", venue: "Recital Hall", location: "City to be announced", date: "2026-11-08" },
      { title: "Cinematic Piano — A Première", venue: "Arts Centre", location: "City to be announced", date: "2027-02-14" },
    ],
  },
  bio: {
    intro:
      "Reza Ohadi is a pianist and composer working where classical tradition meets cinematic stillness. This biography is a short living draft — refined detail will follow; for now, let the music lead.",
    portraitImage: ph("portrait.svg"),
    wideImage: ph("bio-wide.svg"),
    statement:
      "My aim is to hold a single feeling long enough to understand it. I am drawn to atmosphere over display — to the resonance after a note as much as the note itself.",
    philosophy:
      "A piece of music should feel like a room you can walk into. The goal is never to impress, but to invite — to offer the listener somewhere quiet to stand for a few minutes.",
    education: [
      { year: "—", title: "Classical piano", description: "Years of dedicated study in the classical tradition." },
      { year: "—", title: "Composition & theory", description: "Continued study in composition, harmony and orchestration." },
    ],
    timeline: [
      { year: "—", title: "At the piano", description: "Formative years immersed in the classical repertoire." },
      { year: "—", title: "Toward composition", description: "A gradual turn from interpretation to writing original works." },
      { year: "—", title: "On the stage", description: "Bringing the compositions to live audiences." },
      { year: "2026", title: "A digital catalogue", description: "Opening a curated library of original sheet music." },
    ],
    performances: [
      { title: "Solo Recital", venue: "Concert Hall", location: "City to be announced", date: "2026-05-10" },
      { title: "Chamber Evening", venue: "Recital Hall", location: "City to be announced", date: "2026-10-02" },
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
