"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ElementType, ReactNode } from "react";
import { EASE, fadeUp } from "./presets";

interface RevealProps {
  children: ReactNode;
  className?: string;
  variants?: Variants;
  delay?: number;
  /** Fraction of element visible before triggering (0–1). */
  amount?: number;
  as?: ElementType;
  once?: boolean;
}

/**
 * Scroll-into-view reveal. Honors prefers-reduced-motion by rendering content
 * immediately with no transform.
 */
export function Reveal({
  children,
  className,
  variants = fadeUp,
  delay = 0,
  amount = 0.3,
  as = "div",
  once = true,
}: RevealProps) {
  const reduce = useReducedMotion();
  const MotionTag = motion(as as ElementType);

  if (reduce) {
    const Tag = as as ElementType;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
      transition={{ delay }}
    >
      {children}
    </MotionTag>
  );
}

/** Container that staggers its <RevealItem> children when scrolled into view. */
export function Stagger({
  children,
  className,
  stagger = 0.09,
  delayChildren = 0,
  amount = 0.25,
  as = "div",
  once = true,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delayChildren?: number;
  amount?: number;
  as?: ElementType;
  once?: boolean;
}) {
  const reduce = useReducedMotion();
  const MotionTag = motion(as as ElementType);
  if (reduce) {
    const Tag = as as ElementType;
    return <Tag className={className}>{children}</Tag>;
  }
  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger, delayChildren } } }}
    >
      {children}
    </MotionTag>
  );
}

export function StaggerItem({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  const MotionTag = motion(as as ElementType);
  return (
    <MotionTag
      className={className}
      variants={{
        hidden: { opacity: 0, y: 22 },
        show: { opacity: 1, y: 0, transition: { duration: 0.85, ease: EASE } },
      }}
    >
      {children}
    </MotionTag>
  );
}
