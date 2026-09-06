"use client";

import { useEffect, useRef, type FocusEvent, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";

/** Matches the CSS that turns the pin on — keep the two in sync. */
const PIN_QUERY = "(min-width: 761px) and (min-height: 640px)";
// restDelta is tightened because this spring drives a translation of several
// thousand pixels — the default 0.01 rest tolerance leaves the rail ~50px shy
// of its landing position at the end of the track.
const RAIL_SPRING = {
  stiffness: 130,
  damping: 32,
  mass: 0.35,
  restDelta: 0.0002,
};

/**
 * Pinned horizontal reel: a tall scroll track holds a viewport-height stage in
 * place while vertical wheel travel is converted into horizontal translation of
 * the rail. The rail is exactly 4 viewports wide, so the specified -75% shift
 * lands its trailing edge flush against the right of the stage — the page then
 * resumes vertical flow at the bottom of the track.
 *
 * Below the pin breakpoint (and under reduced motion) the transform is held at
 * zero and CSS turns the stage into an ordinary snap-scrolling strip.
 */
export function HorizontalShowcase({
  children,
  label,
}: {
  children: ReactNode;
  /** Accessible name for the scrollable region. */
  label: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const pinned = useMotionValue(0);

  const { scrollYProgress } = useScroll({
    target: track,
    offset: ["start start", "end end"],
  });
  const smooth = useSpring(scrollYProgress, RAIL_SPRING);
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

  const x = useTransform(progress, [0, 1], ["0%", "-75%"]);

  /**
   * While pinned the rail is moved by transform, so a card that receives focus
   * off-stage would never be scrolled into view. Translate the focused card's
   * position back into the page scroll offset that reveals it.
   */
  const revealFocused = (event: FocusEvent<HTMLDivElement>) => {
    const trackEl = track.current;
    const railEl = rail.current;
    if (!trackEl || !railEl || !pinned.get()) return;
    const card = (event.target as HTMLElement).closest<HTMLElement>(
      ".showcase-card",
    );
    if (!card) return;
    const travel = railEl.scrollWidth * 0.75;
    if (travel <= 0) return;
    const needed = card.offsetLeft + card.offsetWidth - window.innerWidth;
    const ratio = Math.min(Math.max(needed / travel, 0), 1);
    const top = trackEl.getBoundingClientRect().top + window.scrollY;
    const scrollable = trackEl.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + ratio * scrollable, behavior: "smooth" });
  };

  return (
    <div ref={track} className="showcase-track">
      <div className="showcase-stage">
        <div
          className="showcase-viewport"
          role="region"
          aria-label={label}
          tabIndex={0}
          onFocusCapture={revealFocused}
        >
          <motion.div ref={rail} className="showcase-rail" style={{ x }}>
            {children}
          </motion.div>
        </div>
        <div className="showcase-progress" aria-hidden>
          <motion.span style={{ scaleX: progress }} />
        </div>
      </div>
    </div>
  );
}

/** One panel on the rail. `span` widens it relative to its neighbours. */
export function ShowcaseCard({
  children,
  className,
  span = 1,
}: {
  children: ReactNode;
  className?: string;
  span?: number;
}) {
  return (
    <div
      className={["showcase-card", className].filter(Boolean).join(" ")}
      style={{ flexGrow: span, flexShrink: span }}
    >
      {children}
    </div>
  );
}
