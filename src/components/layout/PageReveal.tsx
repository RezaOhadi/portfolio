"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState, type ReactNode } from "react";
import { EASE } from "@/components/motion/presets";

const COLUMNS = 9;

/**
 * Per-route enter transition. A set of vertical panels — piano keys / a rising
 * concert curtain — lifts to reveal the new page, while the content fades up
 * beneath. Re-mounts on every navigation (via app template.tsx).
 */
export function PageReveal({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  const [covering, setCovering] = useState(!reduce);

  return (
    <>
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: EASE, delay: reduce ? 0 : 0.35 }}
      >
        {children}
      </motion.div>

      {covering ? (
        <div
          className="pointer-events-none fixed inset-0 z-[80] flex"
          aria-hidden
        >
          {Array.from({ length: COLUMNS }).map((_, i) => (
            <motion.div
              key={i}
              className={i % 2 === 0 ? "h-full flex-1 bg-ink-deep" : "h-full flex-1 bg-charcoal-900"}
              style={{ originY: 0 }}
              initial={{ scaleY: 1 }}
              animate={{ scaleY: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: i * 0.045 }}
              onAnimationComplete={
                i === COLUMNS - 1 ? () => setCovering(false) : undefined
              }
            />
          ))}
        </div>
      ) : null}
    </>
  );
}
