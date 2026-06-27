"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { TextReveal } from "@/components/motion/TextReveal";
import { EASE } from "@/components/motion/presets";
import type { HeroContent } from "@/lib/types";

export function Hero({ hero }: { hero: HeroContent }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "16%"]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  // Hero → featured composition: keys lift and fade, title settles slightly.
  const keysY = useTransform(scrollYProgress, [0, 1], ["0%", "-14%"]);
  const keysOpacity = useTransform(scrollYProgress, [0, 0.6], [0.12, 0]);
  const titleScale = useTransform(scrollYProgress, [0, 0.6], [1, 0.94]);

  return (
    <section
      ref={ref}
      className="relative flex h-[100svh] min-h-[640px] w-full items-center overflow-hidden"
      aria-label="Introduction"
    >
      {/* Background image with subtle parallax + B&W treatment */}
      <motion.div
        className="absolute inset-0"
        style={{ y: reduce ? 0 : imageY, scale: reduce ? 1 : imageScale }}
      >
        <Image
          src={hero.image}
          alt="Reza Ohadi at the piano"
          fill
          priority
          sizes="100vw"
          className="object-cover grayscale contrast-[1.05]"
        />
      </motion.div>

      {/* Drifting light + vignette layers */}
      <div className="pointer-events-none absolute inset-0 bg-hall-glow" />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_30%,rgba(242,238,230,0.10),transparent_70%)] animate-light-drift"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/30" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink/70 via-transparent to-transparent" />

      {/* Abstract vertical piano-key lines */}
      <motion.div
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 items-stretch justify-end gap-[6px] pr-6 md:flex"
        style={{ y: reduce ? 0 : keysY, opacity: reduce ? 0.12 : keysOpacity }}
        aria-hidden
      >
        {Array.from({ length: 14 }).map((_, i) => (
          <motion.span
            key={i}
            className="block w-3 bg-ivory"
            style={{ originY: 0 }}
            initial={reduce ? { scaleY: 1 } : { scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 1.2, ease: EASE, delay: 0.3 + i * 0.05 }}
          />
        ))}
      </motion.div>

      {/* Content */}
      <motion.div
        className="container-editorial relative z-10"
        style={{ y: reduce ? 0 : contentY, opacity: reduce ? 1 : contentOpacity }}
      >
        <motion.span
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.5 }}
          className="kicker mb-6 block"
        >
          Pianist · Composer · Canada
        </motion.span>

        <motion.div style={{ scale: reduce ? 1 : titleScale }} className="origin-left">
          <TextReveal
            text={hero.headline}
            as="h1"
            immediate
            delay={0.6}
            className="font-serif text-display text-ivory text-shadow-cinematic"
          />
        </motion.div>

        <motion.p
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE, delay: 1 }}
          className="mt-6 font-serif text-2xl italic text-ivory/90 sm:text-3xl"
        >
          {hero.subtitle}
        </motion.p>

        <motion.p
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE, delay: 1.15 }}
          className="mt-4 max-w-md font-sans text-sm leading-relaxed text-silver-300"
        >
          {hero.supporting}
        </motion.p>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE, delay: 1.3 }}
          className="mt-10 flex flex-wrap items-center gap-4"
        >
          <Button href="/store" variant="primary" size="lg">
            Discover Sheet Music
          </Button>
          <Button href="/media" variant="outline" size="lg">
            Explore the Music
          </Button>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.6 }}
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3"
        aria-hidden
      >
        <span className="text-[0.62rem] uppercase tracking-editorial text-silver-400">
          Scroll
        </span>
        <span className="relative block h-12 w-px overflow-hidden bg-white/15">
          <motion.span
            className="absolute left-0 top-0 block h-4 w-px bg-ivory"
            animate={reduce ? {} : { y: ["-100%", "300%"] }}
            transition={{ duration: 2.2, ease: "easeInOut", repeat: Infinity }}
          />
        </span>
      </motion.div>
    </section>
  );
}
