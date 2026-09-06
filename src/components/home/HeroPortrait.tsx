"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useHeroScroll } from "@/components/home/HeroStage";

const SPRING = { stiffness: 90, damping: 26, mass: 0.4 };

export function HeroPortrait({
  src,
  alt,
  caption,
  subcaption,
  unoptimized = false,
}: {
  src: string;
  alt: string;
  caption: string;
  subcaption: string;
  /** Remote hosts outside `images.remotePatterns` must bypass the optimizer. */
  unoptimized?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);

  // Inside the pinned hero the figure never moves relative to the viewport, so
  // its own scroll range is meaningless — read the track's scrub instead and
  // keep the local range only as a fallback for unpinned layouts.
  const heroProgress = useHeroScroll();
  const { scrollYProgress: localProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const source = heroProgress ?? localProgress;

  // A slow push while the copy is still being read, then a stronger one as the
  // copy departs — so the pin ends on the portrait rather than on empty space.
  const yRaw = useTransform(source, [0, 0.35, 1], ["0%", "2%", "9%"]);
  const scaleRaw = useTransform(source, [0, 0.35, 1], [1, 1.05, 1.2]);
  const y = useSpring(yRaw, SPRING);
  const scale = useSpring(scaleRaw, SPRING);

  // The frame itself grows and drifts back toward centre as the copy clears,
  // so the portrait reads as a camera push rather than a zoom on a static crop.
  const frameScale = useSpring(
    useTransform(source, [0, 0.35, 0.9], [1, 1.04, 1.16]),
    SPRING,
  );
  const driftRaw = useTransform(source, [0.3, 0.9], ["0%", "-9%"]);
  const drift = useSpring(driftRaw, SPRING);

  return (
    <motion.figure className="hero-portrait" ref={ref} style={{ x: drift }}>
      <motion.div className="portrait-frame" style={{ scale: frameScale }}>
        <motion.div className="portrait-depth" style={{ y, scale }}>
          {/* The load-in scale is a CSS animation, not a motion prop: it must
              not depend on a reduced-motion read during render. */}
          <div className="portrait-inner">
            <Image
              src={src}
              alt={alt}
              fill
              priority
              quality={95}
              unoptimized={unoptimized}
              sizes="(min-width: 1280px) 560px, (min-width: 1024px) 44vw, (min-width: 640px) 48vw, 92vw"
              className="object-cover"
            />
          </div>
        </motion.div>
        <span className="portrait-sheen" aria-hidden />
      </motion.div>
      <figcaption>
        <span>{caption}</span>
        <span>{subcaption}</span>
      </figcaption>
    </motion.figure>
  );
}
