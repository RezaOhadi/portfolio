"use client";

import Image from "next/image";
import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";

/**
 * Hero focal portrait.
 *
 * Two composed layers so the animations never fight over `scale`:
 *  - outer: scroll-linked parallax drift + slow scale (depth)
 *  - inner: one-shot scale-in on mount
 * Both collapse to a static image under prefers-reduced-motion.
 */
export function HeroPortrait({
  src,
  alt,
  caption,
  subcaption,
}: {
  src: string;
  alt: string;
  caption: string;
  subcaption: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const yRaw = useTransform(scrollYProgress, [0, 1], ["0%", "14%"]);
  const scaleRaw = useTransform(scrollYProgress, [0, 1], [1, 1.07]);
  const spring = { stiffness: 90, damping: 26, mass: 0.4 };
  const y = useSpring(yRaw, spring);
  const scale = useSpring(scaleRaw, spring);

  return (
    <figure className="hero-portrait" ref={ref}>
      <div className="portrait-frame">
        <motion.div
          className="portrait-depth"
          style={reduce ? undefined : { y, scale }}
        >
          <motion.div
            className="portrait-inner"
            initial={reduce ? false : { opacity: 0, scale: 1.09 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <Image
              src={src}
              alt={alt}
              fill
              priority
              quality={90}
              sizes="(min-width: 1024px) 420px, (min-width: 640px) 45vw, 85vw"
              className="object-cover"
            />
          </motion.div>
        </motion.div>
      </div>
      <figcaption>
        <span>{caption}</span>
        <span>{subcaption}</span>
      </figcaption>
    </figure>
  );
}
