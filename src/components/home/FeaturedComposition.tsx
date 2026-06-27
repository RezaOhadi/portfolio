"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight, Clock, FileText } from "lucide-react";
import type { Product } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import { TextReveal } from "@/components/motion/TextReveal";
import { formatDuration, formatPrice } from "@/lib/utils";

export function FeaturedComposition({ product }: { product: Product }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  // Layered depth — three elements drift at slightly different speeds.
  const coverY = useTransform(scrollYProgress, [0, 1], ["10%", "-10%"]);
  const titleY = useTransform(scrollYProgress, [0, 1], ["0%", "-5%"]);
  const detailsY = useTransform(scrollYProgress, [0, 1], ["8%", "-8%"]);

  return (
    <div
      ref={ref}
      className="container-editorial grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
    >
      <Reveal className="order-2 lg:order-1">
        <motion.div style={{ y: reduce ? 0 : coverY }}>
          <Link
            href={`/store/${product.slug}`}
            className="group relative block aspect-[4/5] overflow-hidden bg-charcoal-900 ring-1 ring-white/10"
          >
            <Image
              src={product.coverImage}
              alt={`${product.title} — cover artwork`}
              fill
              sizes="(min-width: 1024px) 45vw, 90vw"
              className="object-cover transition-transform duration-[1400ms] ease-cinematic group-hover:scale-[1.05]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
          </Link>
        </motion.div>
      </Reveal>

      <div className="order-1 flex flex-col gap-6 lg:order-2">
        <Reveal>
          <span className="kicker flex items-center gap-3">
            <span className="inline-block h-px w-8 bg-silver-400/60" />
            Featured Composition
          </span>
        </Reveal>

        <motion.div style={{ y: reduce ? 0 : titleY }}>
          <TextReveal
            text={product.title}
            as="h2"
            className="font-serif text-5xl leading-[1.02] text-ivory sm:text-6xl"
          />
        </motion.div>

        <Reveal delay={0.05}>
          <p className="max-w-prose font-sans text-base leading-relaxed text-silver-300">
            {product.shortDescription}
          </p>
        </Reveal>

        <motion.div style={{ y: reduce ? 0 : detailsY }}>
          <Reveal delay={0.1}>
            <dl className="flex flex-wrap gap-x-8 gap-y-3 border-y border-white/10 py-5 text-silver-300">
              <div className="flex items-center gap-2">
                <BarexpandIcon />
                <dd className="font-sans text-sm">{product.difficulty}</dd>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-silver-400" />
                <dd className="font-sans text-sm">{product.pages} pages</dd>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-silver-400" />
                <dd className="font-sans text-sm">{formatDuration(product.durationSeconds)}</dd>
              </div>
            </dl>
          </Reveal>
        </motion.div>

        <Reveal delay={0.15}>
          <div className="flex flex-wrap items-center gap-5">
            <Button href={`/store/${product.slug}`} variant="primary">
              View Score <ArrowUpRight className="h-4 w-4" />
            </Button>
            <span className="font-serif text-2xl text-ivory">
              {formatPrice(product.priceCents, product.currency)}
            </span>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

// lucide has no "Barexpand"; small inline difficulty glyph instead.
function BarexpandIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 text-silver-400" aria-hidden fill="none">
      <rect x="1" y="9" width="3" height="6" fill="currentColor" />
      <rect x="6.5" y="5" width="3" height="10" fill="currentColor" />
      <rect x="12" y="1" width="3" height="14" fill="currentColor" />
    </svg>
  );
}
