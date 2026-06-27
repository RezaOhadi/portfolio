/**
 * Domain types. These mirror the Supabase schema (see supabase/schema.sql) but
 * use camelCase for the app layer. Mapping happens in lib/data/*.
 */

export type Difficulty =
  | "Beginner"
  | "Intermediate"
  | "Advanced"
  | "Virtuoso";

export const DIFFICULTIES: Difficulty[] = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Virtuoso",
];

export interface Product {
  id: string;
  slug: string;
  title: string;
  composer: string;
  shortDescription: string;
  longDescription: string;
  priceCents: number;
  currency: string;
  difficulty: Difficulty;
  instrument: string;
  genre: string;
  mood: string;
  durationSeconds: number;
  pages: number;
  coverImage: string;
  /** Low-resolution / watermarked preview page images (public). */
  previewImages: string[];
  audioPreviewUrl: string | null;
  youtubeUrl: string | null;
  instagramUrl: string | null;
  /** Private storage path to the original PDF — never sent to the client. */
  pdfPath: string | null;
  published: boolean;
  featured: boolean;
  relatedSlugs: string[];
  createdAt: string;
}

export type PurchaseStatus = "pending" | "paid" | "refunded" | "failed";

export interface Purchase {
  id: string;
  productId: string;
  productSlug: string | null;
  productTitle: string | null;
  customerEmail: string;
  stripeSessionId: string | null;
  stripePaymentIntent: string | null;
  amountCents: number;
  currency: string;
  status: PurchaseStatus;
  /** Secret bearer token used to mint signed download URLs. */
  downloadToken: string;
  createdAt: string;
}

export interface GalleryImage {
  id: string;
  imageUrl: string;
  caption: string | null;
  location: string | null;
  eventDate: string | null;
  sortOrder: number;
  width: number;
  height: number;
}

/* ----------------------------- Site content ------------------------------ */

export interface SocialLinks {
  instagram: string;
  youtube: string;
  soundcloud: string;
  email: string;
}

export interface HeroContent {
  headline: string;
  subtitle: string;
  supporting: string;
  image: string;
}

export interface TimelineEntry {
  year: string;
  title: string;
  description: string;
}

export interface Performance {
  title: string;
  venue: string;
  location: string;
  date: string;
}

export interface BioContent {
  intro: string;
  portraitImage: string;
  wideImage: string;
  statement: string;
  philosophy: string;
  education: TimelineEntry[];
  timeline: TimelineEntry[];
  performances: Performance[];
  pullQuotes: string[];
  signatureImage: string | null;
  listenWhileReadingUrl: string | null;
}

export type MediaType = "youtube" | "audio" | "instagram";

export interface MediaItem {
  id: string;
  title: string;
  type: MediaType;
  category: string;
  youtubeUrl: string | null;
  audioUrl: string | null;
  instagramUrl: string | null;
  poster: string | null;
  description: string;
  featured: boolean;
}

export interface HomeContent {
  artistStatement: string;
  featuredProductSlug: string | null;
  performances: Performance[];
}

export interface SiteContent {
  social: SocialLinks;
  hero: HeroContent;
  home: HomeContent;
  bio: BioContent;
  media: MediaItem[];
}
