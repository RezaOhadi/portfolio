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
