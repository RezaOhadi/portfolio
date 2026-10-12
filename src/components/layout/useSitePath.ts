"use client";

import { usePathname } from "next/navigation";

/**
 * The current path, with the home page always reported as "/". When Vercel
 * regenerates the cached home page in the background, the server renders it
 * as "/index"; the browser always sees "/". Without this, the nav and the
 * scroll cue render differently on each side and hydration fails (#418).
 */
export function useSitePath() {
  const pathname = usePathname();
  return /^\/index\/?$/.test(pathname) ? "/" : pathname;
}
