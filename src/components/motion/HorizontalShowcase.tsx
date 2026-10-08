"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type FocusEvent,
  type ReactNode,
} from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
} from "framer-motion";
import { scrollToTarget } from "@/lib/motion/engine";

/** Matches the CSS that turns the pin on — keep the two in sync. */
const PIN_QUERY = "(min-width: 761px) and (min-height: 640px)";
/** The rail is 400% of the stage; -75% lands its trailing edge flush right. */
const TRAVEL = 0.75;

interface Geometry {
  /** Rail width in px (400% of the stage). */
  rail: number;
  /** Visible stage width in px. */
  stage: number;
  /** Each card's centre, measured from the rail's left edge. */
  centres: Map<HTMLElement, number>;
}

interface ReelContext {
  progress: MotionValue<number>;
  /** 1 while the pin (and therefore every depth effect) is active. */
  pinned: MotionValue<number>;
  /** Bumped on re-measure so every derived value recomputes. */
  version: MotionValue<number>;
  geometry: React.MutableRefObject<Geometry>;
}

const Reel = createContext<ReelContext | null>(null);

/**
 * Pinned horizontal reel: a tall scroll track holds a viewport-height stage in
 * place while vertical scroll is converted into horizontal travel of the rail.
 *
 * The camera is deterministic: the rail position is a pure function of the
 * track's scroll progress (Lenis supplies the wheel easing on desktop, native
 * momentum does it on touch), so it is exactly reversible and can never drift.
 * Each card derives its own depth — scale, a slight turn toward the centre,
 * light and type parallax — from its distance to the centre of the stage.
 * Only the decorative skew listens to velocity, and it settles to zero.
 *
 * Below the pin breakpoint (and under reduced motion) every derived value is
 * neutral and CSS turns the stage into an ordinary snap-scrolling strip.
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
  const viewport = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const pinned = useMotionValue(0);
  const version = useMotionValue(0);
  const geometry = useRef<Geometry>({ rail: 0, stage: 1, centres: new Map() });

  const { scrollYProgress } = useScroll({
    target: track,
    offset: ["start start", "end end"],
  });
  const progress = useTransform<number, number>(
    [scrollYProgress, pinned],
    ([value, on]) => (on ? Math.min(1, Math.max(0, value)) : 0),
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

  // Layout is read once per resize, never per frame.
  useEffect(() => {
    const railEl = rail.current;
    const viewEl = viewport.current;
    if (!railEl || !viewEl) return;
    const measure = () => {
      const g = geometry.current;
      g.rail = railEl.offsetWidth;
      g.stage = Math.max(1, viewEl.clientWidth);
      g.centres.clear();
      railEl
        .querySelectorAll<HTMLElement>(":scope > .showcase-card")
        .forEach((card) =>
          g.centres.set(card, card.offsetLeft + card.offsetWidth / 2),
        );
      version.set(version.get() + 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(railEl);
    observer.observe(viewEl);
    return () => observer.disconnect();
  }, [version]);

  const x = useTransform(progress, [0, 1], ["0%", `-${TRAVEL * 100}%`]);

  // Decorative only: a whisper of skew while the rail is travelling fast.
  const velocity = useVelocity(progress);
  const skewRaw = useTransform(velocity, (v) =>
    Math.max(-1.4, Math.min(1.4, v * -2.2)),
  );
  const skewX = useSpring(skewRaw, { stiffness: 260, damping: 32, mass: 0.4 });

  // Atmosphere drifts at a third of the rail's speed: depth without distraction.
  const atmosphereX = useTransform(progress, [0, 1], ["0%", "-22%"]);

  // "03 / 09" counter that follows whichever card is nearest the centre.
  const counter = useTransform<number, string>([progress, version], ([p]) => {
    const g = geometry.current;
    const centres = [...g.centres.values()].sort((a, b) => a - b);
    if (!centres.length) return "";
    const focus = (p as number) * g.rail * TRAVEL + g.stage / 2;
    let nearest = 0;
    centres.forEach((c, i) => {
      if (Math.abs(c - focus) < Math.abs(centres[nearest] - focus)) nearest = i;
    });
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(nearest + 1)} / ${pad(centres.length)}`;
  });

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
    const travel = railEl.offsetWidth * TRAVEL;
    if (travel <= 0) return;
    const stage = viewport.current?.clientWidth ?? window.innerWidth;
    // Centre the focused control itself, not its card: a wide card (the
    // record panel) can hold links far from its own centre. Rect deltas give
    // the control's position in rail coordinates whatever the rail's offset.
    const target = event.target as HTMLElement;
    const railRect = railEl.getBoundingClientRect();
    const rect = target.getBoundingClientRect();
    const inRail =
      target === card || !rect.width
        ? card.offsetLeft + card.offsetWidth / 2
        : rect.left - railRect.left + rect.width / 2;
    const needed = inRail - stage / 2;
    const ratio = Math.min(Math.max(needed / travel, 0), 1);
    const top = trackEl.getBoundingClientRect().top + window.scrollY;
    const scrollable = trackEl.offsetHeight - window.innerHeight;
    // The browser runs its own focus scrolling right after this handler (it
    // nudges the clipped viewport sideways and the page vertically). Let it
    // finish, undo the sideways nudge — the rail transform is the only
    // horizontal position — then ease the page to the computed offset.
    requestAnimationFrame(() => {
      if (viewport.current) viewport.current.scrollLeft = 0;
      scrollToTarget(top + ratio * scrollable);
    });
  };

  return (
    <Reel.Provider value={{ progress, pinned, version, geometry }}>
      <div ref={track} className="showcase-track">
        <div className="showcase-stage">
          <motion.div
            className="showcase-atmosphere"
            style={{ x: atmosphereX }}
            aria-hidden
          >
            <span className="showcase-staff" />
          </motion.div>
          <div
            ref={viewport}
            className="showcase-viewport"
            role="region"
            aria-label={label}
            tabIndex={0}
            onFocusCapture={revealFocused}
          >
            <motion.div
              ref={rail}
              className="showcase-rail"
              style={{ x, skewX }}
            >
              {children}
            </motion.div>
          </div>
          <div className="showcase-meter" aria-hidden>
            <motion.span className="showcase-counter">{counter}</motion.span>
            <div className="showcase-progress">
              <motion.span style={{ scaleX: progress }} />
            </div>
          </div>
        </div>
      </div>
    </Reel.Provider>
  );
}

/** One panel on the rail. `span` widens it relative to its neighbours. */
export function ShowcaseCard({
  children,
  className,
  span = 1,
  cursor,
}: {
  children: ReactNode;
  className?: string;
  span?: number;
  /** Contextual cursor label (see CustomCursor). */
  cursor?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reel = useContext(Reel);
  const fallback = useMotionValue(0);
  const progress = reel?.progress ?? fallback;
  const version = reel?.version ?? fallback;
  const pinned = reel?.pinned ?? fallback;

  /**
   * Signed distance from the stage centre, in stage widths: 0 = in focus,
   * ±1 = one screen away. Pure function of scroll progress and cached layout.
   */
  const distance = useTransform<number, number>(
    [progress, version, pinned],
    ([p, , on]) => {
      const g = reel?.geometry.current;
      if (!on) return 0;
      const node = ref.current;
      if (!g || !node || !g.rail) return 0;
      const centre = g.centres.get(node);
      if (centre === undefined) return 0;
      const onStage = centre - (p as number) * g.rail * TRAVEL;
      const d = (onStage - g.stage / 2) / g.stage;
      return Math.max(-1.6, Math.min(1.6, d));
    },
  );
  const focus = useTransform(distance, (d) => {
    const t = Math.max(0, 1 - Math.abs(d) / 0.85);
    return t * t * (3 - 2 * t); // smoothstep: holds in focus, eases out
  });
  const scale = useTransform(focus, [0, 1], [0.9, 1]);
  // Cards on the right turn slightly toward the visitor's centre line and vice
  // versa — the inside of a curved gallery wall.
  const rotateY = useTransform(distance, (d) =>
    Math.max(-1, Math.min(1, d)) * -9,
  );
  const opacity = useTransform(focus, [0, 1], [0.42, 1]);
  // 0 is framer's default, so off the pin no perspective (and no 3D layer)
  // is emitted at all.
  const perspective = useTransform(pinned, (on) => (on ? 1700 : 0));

  return (
    <motion.div
      ref={ref}
      className={["showcase-card", className].filter(Boolean).join(" ")}
      data-cursor={cursor}
      style={{
        flexGrow: span,
        flexShrink: span,
        scale,
        rotateY,
        // Each card carries its own perspective. A shared 3D context
        // (perspective on the viewport + preserve-3d on the rail) put half of
        // every turned card behind the rail's plane, where the rail swallowed
        // its clicks; a per-card perspective keeps hit-testing flat.
        transformPerspective: perspective,
        opacity,
        // Consumed by CSS for type parallax, image drift and gold accents.
        ["--d" as string]: distance,
        ["--focus" as string]: focus,
      }}
    >
      {children}
    </motion.div>
  );
}
