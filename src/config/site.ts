/**
 * Static brand + navigation config. Business *content* lives in the data layer
 * (lib/data) and can be edited by the owner via the admin dashboard or DB.
 * This file only holds structural constants.
 */

export const siteConfig = {
  name: "Reza Ohadi",
  role: "Pianist · Composer",
  // Used as a fallback for SEO; the canonical URL comes from NEXT_PUBLIC_SITE_URL.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  description:
    "Reza Ohadi — pianist and composer. Cinematic original works and a curated catalogue of digital sheet music.",
  tagline: "Pianist. Composer. Storyteller.",
} as const;

/**
 * Editable hero portrait source — the single place to swap the homepage focal
 * image without touching a component.
 *
 * Accepts either a path under `public/` ("/assets/images/hero-portrait.jpg")
 * or a full `https://` URL. Leave it empty and the resolution order is:
 *
 *   1. an admin-uploaded hero image from the CMS/data layer
 *   2. `NEXT_PUBLIC_HERO_IMAGE`, if set at build time
 *   3. this constant
 *   4. `public/assets/images/hero-portrait.{jpg,jpeg,png,webp,avif}`, picked up
 *      automatically by `scripts/gen-gallery.mjs` during `prebuild`
 *   5. `/profile.jpg`
 *
 * A remote host that is not in `next.config.mjs` → `images.remotePatterns` is
 * served unoptimized rather than failing the render, so any URL is safe to drop
 * in here.
 */
export const heroPortraitSrc: string = process.env.NEXT_PUBLIC_HERO_IMAGE ?? "";

/** Hosts the Next.js image optimizer is configured to fetch from. */
const OPTIMIZED_IMAGE_HOSTS = [".supabase.co", "i.ytimg.com", "img.youtube.com"];

/** Remote images from unconfigured hosts must bypass the optimizer. */
export function isUnoptimizedSource(src: string): boolean {
  if (!/^https?:\/\//i.test(src)) return false;
  try {
    const { hostname } = new URL(src);
    return !OPTIMIZED_IMAGE_HOSTS.some(
      (host) => hostname === host || hostname.endsWith(host),
    );
  } catch {
    return true;
  }
}

export interface NavItem {
  label: string;
  href: string;
  /** Short index shown in the full-screen menu, e.g. "01". */
  index: string;
}

export const navItems: NavItem[] = [
  { label: "Home", href: "/", index: "01" },
  { label: "Sheet Music", href: "/store", index: "02" },
  { label: "Biography", href: "/biography", index: "03" },
  { label: "Gallery", href: "/gallery", index: "04" },
  { label: "Media", href: "/media", index: "05" },
  { label: "Contact", href: "/contact", index: "06" },
];

/** Secondary links shown in the menu footer + site footer. */
export const utilityNav: NavItem[] = [
  { label: "My Library", href: "/library", index: "07" },
];
