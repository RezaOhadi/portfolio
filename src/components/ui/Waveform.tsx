"use client";

import { useMemo } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * A thin staff-inspired waveform that gently fills as the page is scrolled.
 * GPU-friendly: the highlighted layer is revealed via an animated clip-path,
 * so nothing re-renders on scroll.
 */
export function Waveform({ className, bars = 72 }: { className?: string; bars?: number }) {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const clip = useTransform(scrollYProgress, (v) => `inset(0 ${(1 - v) * 100}% 0 0)`);

  const heights = useMemo(
    () =>
      Array.from({ length: bars }, (_, i) => {
        const v =
          0.35 +
          0.32 * Math.abs(Math.sin(i * 0.45)) +
          0.18 * Math.abs(Math.sin(i * 0.13 + 1.2));
        return Math.min(1, v);
      }),
    [bars],
  );

  const Row = ({ opacity }: { opacity: string }) => (
    <div className={cn("flex h-full w-full items-center gap-[2px]", opacity)}>
      {heights.map((h, i) => (
        <span
          key={i}
          className="block flex-1 rounded-full bg-ivory"
          style={{ height: `${Math.round(h * 100)}%` }}
        />
      ))}
    </div>
  );

  return (
    <div
      className={cn("relative h-14 w-full mask-fade-edges", className)}
      aria-hidden
    >
      <Row opacity="opacity-[0.14]" />
      <motion.div
        className="absolute inset-0"
        style={{ clipPath: reduce ? "none" : clip }}
      >
        <Row opacity="opacity-60" />
      </motion.div>
    </div>
  );
}
