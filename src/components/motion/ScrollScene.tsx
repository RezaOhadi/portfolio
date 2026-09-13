"use client";

import { createElement, useRef, type ElementType, type ReactNode } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";

const SPRING = { stiffness: 120, damping: 30, mass: 0.35 };

/**
 * Scroll-linked "depth fade": content rises and resolves as it enters, holds
 * while it is being read, then recedes slightly as it leaves. Unlike a one-shot
 * in-view reveal, this stays tied to scroll position, so the page reads as one
 * continuous camera move rather than a stack of independent blocks.
 *
 * NOTE: this applies a transform, which makes the element a containing block
 * for `position: fixed` descendants. Never wrap content that renders a fixed
 * overlay (e.g. the gallery lightbox) — wrap its heading instead.
 */
export function ScrollScene({
  children,
  className,
  as = "div",
  depth = 1,
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  /** 0 = flat, 1 = default, >1 = more travel. */
  depth?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const opacityRaw = useTransform(
    scrollYProgress,
    [0, 0.24, 0.82, 1],
    [0, 1, 1, 0.35],
  );
  const yRaw = useTransform(
    scrollYProgress,
    [0, 0.26, 0.84, 1],
    [44 * depth, 0, 0, -26 * depth],
  );
  const scaleRaw = useTransform(
    scrollYProgress,
    [0, 0.26, 0.84, 1],
    [0.975, 1, 1, 0.988],
  );

  const opacity = useSpring(opacityRaw, SPRING);
  const y = useSpring(yRaw, SPRING);
  const scale = useSpring(scaleRaw, SPRING);

  const MotionTag = motion(as as ElementType);

  if (reduce) {
    const Tag = as as ElementType;
    return createElement(Tag, { ref, className }, children);
  }

  return (
    <MotionTag
      ref={ref}
      className={className}
      style={{ opacity, y, scale, willChange: "transform, opacity" }}
    >
      {children}
    </MotionTag>
  );
}

/**
 * A hairline that fills with the accent colour as its section travels through
 * the viewport — the tactile "where am I" cue between sections.
 */
export function SectionIndicator({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 85%", "end 40%"],
  });
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 30,
    mass: 0.3,
  });

  return (
    <div
      ref={ref}
      className={["section-rule", className].filter(Boolean).join(" ")}
      aria-hidden
    >
      <motion.span style={reduce ? { transform: "scaleX(1)" } : { scaleX }} />
    </div>
  );
}

/**
 * Staggered per-line heading reveal, tied to entering the viewport once.
 * Pass lines as separate strings to control the break points.
 */
export function StaggerLines({
  lines,
  className,
  as = "h2",
  id,
}: {
  lines: string[];
  className?: string;
  as?: ElementType;
  id?: string;
}) {
  const reduce = useReducedMotion();
  const Tag = as as ElementType;

  if (reduce) {
    return createElement(Tag, { id, className }, lines.join(" "));
  }

  const MotionTag = motion(Tag);
  return (
    <MotionTag
      id={id}
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.5 }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}
      aria-label={lines.join(" ")}
    >
      {lines.map((line, i) => (
        <span key={i} className="stagger-line" aria-hidden>
          <motion.span
            variants={{
              hidden: { y: "108%" },
              show: {
                y: 0,
                transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
              },
            }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </MotionTag>
  );
}
