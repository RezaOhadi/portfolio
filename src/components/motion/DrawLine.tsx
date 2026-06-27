"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { EASE } from "./presets";

/**
 * A single sheet-music / signature-inspired line that draws itself once when
 * scrolled into view. Pure SVG path-length animation; honors reduced motion.
 */
export function DrawLine({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  return (
    <svg
      viewBox="0 0 600 40"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
      className={cn("h-7 w-full max-w-sm", className)}
      aria-hidden
    >
      <motion.path
        d="M4 28 C 80 6, 130 6, 152 24 C 170 40, 212 8, 252 22 C 304 40, 326 8, 384 18 C 452 30, 520 18, 596 10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        initial={{ pathLength: reduce ? 1 : 0, opacity: reduce ? 1 : 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.7 }}
        transition={{ duration: reduce ? 0 : 1.8, ease: EASE }}
      />
    </svg>
  );
}
