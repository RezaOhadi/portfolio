import type { ReactNode } from "react";

/**
 * Re-mounted by the route template on every navigation. The arrival is a
 * CSS-only fade on main's direct children (see motion.css). Deliberately no
 * wrapper element: on navigation React removes the old page's top-level
 * blocks separately, so anything that outlives a page (e.g. a WebGL context
 * cached by three.js) can only retain its own block, never the whole page.
 */
export function PageReveal({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
