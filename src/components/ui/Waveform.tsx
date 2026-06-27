"use client";

import { useMemo } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { EASE } from "@/components/motion/presets";

/**
 * A thin staff-inspired waveform.
 * - `mode="scroll"` (default): fills with overall page scroll progress.
 * - `mode="reveal"`: sweeps to full ONCE when scrolled into view (no looping).
 * GPU-friendly: the highlighted layer is revealed via clip-path only.
 */
export function Waveform({
  className,
  bars = 72,
  mode = "scroll",
}: {
  className?: string;
  bars?: number;
  mode?: "scroll" | "reveal";
}) {
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
    <div className={cn("relative h-14 w-full mask-fade-edges", className)} aria-hidden>
      <Row opacity="opacity-[0.14]" />
      {mode === "reveal" ? (
        <motion.div
          className="absolute inset-0"
          initial={{ clipPath: reduce ? "inset(0 0 0 0)" : "inset(0 100% 0 0)" }}
          whileInView={{ clipPath: "inset(0 0 0 0)" }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: reduce ? 0 : 1.6, ease: EASE }}
        >
          <Row opacity="opacity-60" />
        </motion.div>
      ) : (
        <motion.div className="absolute inset-0" style={{ clipPath: reduce ? "none" : clip }}>
          <Row opacity="opacity-60" />
        </motion.div>
      )}
    </div>
  );
}
