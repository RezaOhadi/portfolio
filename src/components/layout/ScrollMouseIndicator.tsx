"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  type MotionValue,
} from "framer-motion";
import { ChevronUp } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const SCROLL_THRESHOLD = 300;

/** Page-progress ring drawn around the mouse/return glyph. */
function ProgressRing({ progress }: { progress: MotionValue<number> }) {
  return (
    <svg className="scroll-mouse-ring" viewBox="0 0 48 48" aria-hidden>
      <circle className="scroll-mouse-ring-track" cx="24" cy="24" r="22.5" />
      <motion.circle
        className="scroll-mouse-ring-fill"
        cx="24"
        cy="24"
        r="22.5"
        style={{ pathLength: progress }}
      />
    </svg>
  );
}

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
  // Only ever read inside event handlers — a render-time branch would add
  // framer's tabIndex on the server and drop it on the client (hydration).
  const reduce = useReducedMotion();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const showCue = pathname === cuePath;

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.3,
  });

  useEffect(() => {
    /**
     * On a page with a pinned hero the cue has to survive the whole pinned
     * track — a flat pixel threshold would flip it to back-to-top while the
     * hero is still on screen. Measure the track instead, and fall back to the
     * plain threshold everywhere else (and on layouts where the pin is off).
     */
    const update = () => {
      const track = document.querySelector<HTMLElement>("[data-hero-track]");
      const trackEnd = track
        ? track.getBoundingClientRect().bottom +
          window.scrollY -
          window.innerHeight * 0.6
        : 0;
      setScrolled(window.scrollY > Math.max(trackEnd, SCROLL_THRESHOLD));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [pathname]);

  const scrollDown = () =>
    document.getElementById(targetId)?.scrollIntoView({
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
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="scroll-mouse-glyph" aria-hidden>
            <ProgressRing progress={progress} />
            <span className="scroll-mouse-shell scroll-mouse-shell--return">
              <ChevronUp
                className="scroll-mouse-arrow"
                size={15}
                strokeWidth={1.5}
              />
            </span>
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
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="scroll-mouse-glyph" aria-hidden>
            <ProgressRing progress={progress} />
            <span className="scroll-mouse-shell">
              <span className="scroll-mouse-wheel" />
            </span>
          </span>
          <span className="scroll-mouse-label">SCROLL</span>
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
}
