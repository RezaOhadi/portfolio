import type { ReactNode } from "react";

/**
 * Re-mounted by the route template on every navigation. The arrival is a
 * CSS-only fade (see `.page-reveal` in motion.css): opacity never creates a
 * containing block, so sticky pins and fixed overlays inside keep working,
 * and the content is fully present for no-JS and reduced-motion visitors.
 */
export function PageReveal({ children }: { children: ReactNode }) {
  return <div className="page-reveal">{children}</div>;
}
