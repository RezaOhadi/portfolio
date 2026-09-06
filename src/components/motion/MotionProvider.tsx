"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Honours `prefers-reduced-motion` at the animation layer rather than in
 * render. Components must never branch their markup on `useReducedMotion()` —
 * it resolves to false on the server and true on the client's first render,
 * which fails hydration. Skip the motion here, and pin the final visual state
 * with the `@media (prefers-reduced-motion: reduce)` block in portfolio.css.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
