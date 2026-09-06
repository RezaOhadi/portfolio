"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronUp } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const SCROLL_THRESHOLD = 300;

export function ScrollMouseIndicator({
  targetId = "about",
  cuePath = "/",
}: {
  targetId?: string;
  /**
   * Route that shows the hero "scroll" cue. Back-to-top is available sitewide;
   * the downward cue only makes sense where `targetId` exists (the landing page).
   */
  cuePath?: string;
}) {
  const reduce = useReducedMotion();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const showCue = pathname === cuePath;

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  const scrollDown = () =>
    document
      .getElementById(targetId)
      ?.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        block: "start",
      });
  const scrollTop = () =>
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });

  return (
    <AnimatePresence mode="wait" initial={false}>
      {scrolled ? (
        <motion.button
          key="back-to-top"
          type="button"
          className="scroll-mouse-control scroll-mouse-control--top"
          aria-label="Back to top"
          onClick={scrollTop}
          initial={{ opacity: 0, y: 12, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.92 }}
          transition={{
            duration: reduce ? 0.01 : 0.35,
            ease: [0.16, 1, 0.3, 1],
          }}
          whileHover={reduce ? undefined : { scale: 1.05 }}
          whileTap={reduce ? undefined : { scale: 0.98 }}
        >
          <span
            className="scroll-mouse-shell scroll-mouse-shell--return"
            aria-hidden
          >
            <ChevronUp
              className="scroll-mouse-arrow"
              size={15}
              strokeWidth={1.5}
            />
          </span>
          <span className="scroll-mouse-label">TOP</span>
        </motion.button>
      ) : showCue ? (
        <motion.button
          key="scroll-cue"
          type="button"
          className="scroll-mouse-control scroll-mouse-control--cue"
          aria-label="Scroll to About"
          onClick={scrollDown}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{
            duration: reduce ? 0.01 : 0.45,
            ease: [0.16, 1, 0.3, 1],
          }}
          whileHover={reduce ? undefined : { scale: 1.05 }}
          whileTap={reduce ? undefined : { scale: 0.98 }}
        >
          <span className="scroll-mouse-shell" aria-hidden>
            <span className="scroll-mouse-wheel" />
          </span>
          <span className="scroll-mouse-label">SCROLL</span>
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
}
