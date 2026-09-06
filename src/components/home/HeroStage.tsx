"use client";

import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";

/**
 * Progress through the pinned hero track: 0 the moment the hero locks to the
 * viewport, 1 when the pin releases. Held at 0 whenever the pin is disabled
 * (small viewports, reduced motion), so every consumer collapses to a static
 * render without any branching of its own.
 */
const HeroScrollContext = createContext<MotionValue<number> | null>(null);

export const useHeroScroll = () => useContext(HeroScrollContext);

/** Matches the CSS that turns the pin on — keep the two in sync. */
const PIN_QUERY = "(min-width: 761px) and (min-height: 640px)";
const PIN_SPRING = { stiffness: 150, damping: 34, mass: 0.28 };

/**
 * Wraps the hero in a tall scroll track and pins the hero itself to the
 * viewport for its full length, turning vertical wheel travel into a scrub
 * timeline that `HeroScrub` and `HeroPortrait` read from.
 */
export function HeroStage({ children }: { children: ReactNode }) {
  const track = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const pinned = useMotionValue(0);

  const { scrollYProgress } = useScroll({
    target: track,
    offset: ["start start", "end end"],
  });
  const smooth = useSpring(scrollYProgress, PIN_SPRING);
  // Gating the *output* (rather than swapping the motion value) keeps this
  // object identity stable, so the context never changes shape at hydration.
  const progress = useTransform<number, number>(
    [smooth, pinned],
    ([value, on]) => (on ? value : 0),
  );

  useEffect(() => {
    if (reduce) {
      pinned.set(0);
      return;
    }
    const query = window.matchMedia(PIN_QUERY);
    const update = () => pinned.set(query.matches ? 1 : 0);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [pinned, reduce]);

  // Hand-off to the next section: the stage dims over the last stretch of the
  // track so releasing the pin never reads as a jump cut.
  const opacity = useTransform(progress, [0, 0.86, 1], [1, 1, 0]);

  return (
    <div
      ref={track}
      id="home"
      data-nav-section
      data-hero-track
      className="hero-track"
    >
      <motion.section
        className="portfolio-hero hero-pinned"
        aria-labelledby="hero-title"
        style={{ opacity }}
      >
        <div className="hero-glow" aria-hidden />
        <HeroScrollContext.Provider value={progress}>
          {children}
        </HeroScrollContext.Provider>
      </motion.section>
    </div>
  );
}

/**
 * A hero block that departs on scrub. Each block gets its own [from, to]
 * window, which is what produces the staggered cascade as the pin plays out.
 */
export function HeroScrub({
  children,
  className,
  from = 0.3,
  to = 0.72,
  lift = 90,
}: {
  children: ReactNode;
  className?: string;
  /** Track progress at which this block starts leaving. */
  from?: number;
  /** Track progress at which it has fully left. */
  to?: number;
  /** Pixels of upward travel across that window. */
  lift?: number;
}) {
  const progress = useHeroScroll();
  const fallback = useMotionValue(0);
  const source = progress ?? fallback;

  const y = useTransform(source, [from, to], [0, -lift]);
  const opacity = useTransform(source, [from, (from + to) / 2, to], [1, 0.6, 0]);
  const blur = useTransform(source, [from, to], [0, 6]);
  const filter = useTransform(blur, (value) =>
    value < 0.05 ? "none" : `blur(${value.toFixed(2)}px)`,
  );

  return (
    <motion.div className={className} style={{ y, opacity, filter }}>
      {children}
    </motion.div>
  );
}
