"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Fragment, type ElementType } from "react";
import { EASE } from "./presets";

interface TextRevealProps {
  text: string;
  className?: string;
  as?: ElementType;
  delay?: number;
  /** Trigger immediately on mount instead of on scroll-into-view. */
  immediate?: boolean;
  stagger?: number;
}

/**
 * Word-by-word masked reveal for major headings. Each word rises from beneath a
 * clip. Degrades to plain text under reduced motion.
 */
export function TextReveal({
  text,
  className,
  as = "h2",
  delay = 0,
  immediate = false,
  stagger = 0.08,
}: TextRevealProps) {
  const reduce = useReducedMotion();
  const Tag = as as ElementType;
  const words = text.split(" ");

  if (reduce) {
    return <Tag className={className}>{text}</Tag>;
  }

  const MotionTag = motion(Tag);

  return (
    <MotionTag
      className={className}
      initial="hidden"
      {...(immediate
        ? { animate: "show" }
        : { whileInView: "show", viewport: { once: true, amount: 0.5 } })}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
      aria-label={text}
    >
      {words.map((word, i) => (
        <Fragment key={i}>
          <span className="inline-block overflow-hidden align-bottom" aria-hidden>
            <motion.span
              className="inline-block will-change-transform"
              variants={{
                hidden: { y: "115%" },
                show: { y: 0, transition: { duration: 0.95, ease: EASE } },
              }}
            >
              {word}
            </motion.span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </MotionTag>
  );
}
