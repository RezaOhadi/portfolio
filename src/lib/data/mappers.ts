import type { Difficulty, GalleryImage, Product, Purchase } from "@/lib/types";

/* Map snake_case DB rows -> camelCase app types. Tolerant of missing columns. */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapProductRow(r: any): Product {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title ?? "",
    composer: r.composer ?? "Reza Ohadi",
    shortDescription: r.short_description ?? "",
    longDescription: r.long_description ?? "",
    priceCents: r.price_cents ?? 0,
    currency: r.currency ?? "usd",
    difficulty: (r.difficulty ?? "Intermediate") as Difficulty,
    instrument: r.instrument ?? "Solo Piano",
    genre: r.genre ?? "",
    mood: r.mood ?? "",
    durationSeconds: r.duration_seconds ?? 0,
    pages: r.pages ?? 0,
    coverImage: r.cover_image || "/placeholders/cover-1.svg",
    previewImages: Array.isArray(r.preview_images) ? r.preview_images : [],
    audioPreviewUrl: r.audio_preview_url ?? null,
    youtubeUrl: r.youtube_url ?? null,
    instagramUrl: r.instagram_url ?? null,
    pdfPath: r.pdf_path ?? null,
    published: Boolean(r.published),
    featured: Boolean(r.featured),
    relatedSlugs: Array.isArray(r.related_slugs) ? r.related_slugs : [],
    createdAt: r.created_at ?? new Date().toISOString(),
  };
}

/** Map an app Product to a DB row for insert/update (omits id/created_at). */
export function productToRow(p: Partial<Product>) {
  return {
    slug: p.slug,
    title: p.title,
    composer: p.composer,
    short_description: p.shortDescription,
    long_description: p.longDescription,
    price_cents: p.priceCents,
    currency: p.currency,
    difficulty: p.difficulty,
    instrument: p.instrument,
    genre: p.genre,
    mood: p.mood,
    duration_seconds: p.durationSeconds,
    pages: p.pages,
    cover_image: p.coverImage,
    preview_images: p.previewImages,
    audio_preview_url: p.audioPreviewUrl,
    youtube_url: p.youtubeUrl,
    instagram_url: p.instagramUrl,
    pdf_path: p.pdfPath,
    published: p.published,
    featured: p.featured,
    related_slugs: p.relatedSlugs,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapGalleryRow(r: any): GalleryImage {
  return {
    id: r.id,
    imageUrl: r.image_url,
    caption: r.caption ?? null,
    location: r.location ?? null,
    eventDate: r.event_date ?? null,
    sortOrder: r.sort_order ?? 0,
    width: r.width ?? 1000,
    height: r.height ?? 1000,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapPurchaseRow(r: any): Purchase {
  return {
    id: r.id,
    productId: r.product_id,
    productSlug: r.product_slug ?? null,
    productTitle: r.product_title ?? null,
    customerEmail: r.customer_email,
    stripeSessionId: r.stripe_session_id ?? null,
    stripePaymentIntent: r.stripe_payment_intent ?? null,
    amountCents: r.amount_cents ?? 0,
    currency: r.currency ?? "usd",
    status: r.status ?? "pending",
    downloadToken: r.download_token,
    createdAt: r.created_at ?? new Date().toISOString(),
  };
}
