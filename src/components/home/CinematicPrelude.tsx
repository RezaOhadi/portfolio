"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TextReveal } from "@/components/motion/TextReveal";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { DrawLine } from "@/components/motion/DrawLine";
import { FeaturedComposition } from "@/components/home/FeaturedComposition";
import { EASE } from "@/components/motion/presets";
import type { GalleryImage, HeroContent, Product } from "@/lib/types";
import { cn } from "@/lib/utils";

/* A short, original reflection — not attributed, not a real composer quote. */
const REFLECTION = [
  "In the space between two notes,",
  "a silence remembers",
  "everything the music meant to say.",
];

const DOORWAYS = [
  { index: "01", label: "Sheet Music", href: "/store", note: "Original scores to play" },
  { index: "02", label: "The Gallery", href: "/gallery", note: "Moments in black & white" },
  { index: "03", label: "Media", href: "/media", note: "Listen & watch" },
];

const MEMORY_CAPTIONS = ["Rehearsal light", "Hands near the keys", "A quiet studio"];

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const on = () => setMobile(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return mobile;
}

export function CinematicPrelude({
  hero,
  featured,
  memories,
}: {
  hero: HeroContent;
  featured: Product | null;
  memories: GalleryImage[];
}) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const isMobile = useIsMobile();
  const animate = !reduce; // basic scroll motion (allowed on mobile, lighter)
  const depth = !reduce && !isMobile; // full pseudo-3D + mouse light

  const { scrollYProgress: p } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  // Hero foreground → ghost
  const heroOpacity = useTransform(p, [0.04, 0.18], [1, 0]);
  const heroY = useTransform(p, [0, 0.18], ["0%", "-14%"]);

  // Environment — camera moving through the piano space
  const fgY = useTransform(p, [0, 0.3], ["14%", "-8%"]);
  const fgScale = useTransform(p, [0, 0.3], [1, depth ? 1.32 : 1.12]);
  const fgRot = useTransform(p, [0, 0.3], [depth ? 26 : 0, 0]);
  const fgOpacity = useTransform(p, [0, 0.3, 0.46], [0.5, 0.42, 0.12]);
  const bgY = useTransform(p, [0, 0.45], ["0%", "-16%"]);
  const bgScale = useTransform(p, [0, 0.45], [1, 1.14]);
  const ghostOpacity = useTransform(p, [0.1, 0.26, 0.55], [0, 0.07, 0.02]);
  const ghostScale = useTransform(p, [0.1, 0.6], [1, 1.08]);

  // Subtle mouse reflection behind the title (desktop only)
  const mx = useMotionValue(50);
  const my = useMotionValue(26);
  const sx = useSpring(mx, { stiffness: 45, damping: 22 });
  const sy = useSpring(my, { stiffness: 45, damping: 22 });
  const mouseBg = useMotionTemplate`radial-gradient(38% 34% at ${sx}% ${sy}%, rgba(242,238,230,0.10), transparent 70%)`;

  useEffect(() => {
    if (!depth) return;
    const onMove = (e: MouseEvent) => {
      mx.set((e.clientX / window.innerWidth) * 100);
      my.set((e.clientY / window.innerHeight) * 100);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [depth, mx, my]);

  return (
    <section ref={ref} className="relative bg-ink">
      {/* ============================ ENVIRONMENT ============================ */}
      <div className="pointer-events-none sticky top-0 z-0 h-[100svh] w-full overflow-hidden" aria-hidden>
        {/* polished piano lacquer */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(130% 90% at 50% -10%, #17171c 0%, #0b0b0e 45%, #060608 100%)",
          }}
        />
        {/* concert light */}
        <div className="absolute inset-0 bg-[radial-gradient(55%_45%_at_50%_22%,rgba(242,238,230,0.07),transparent_70%)]" />
        {depth ? <motion.div className="absolute inset-0" style={{ background: mouseBg }} /> : null}

        {/* background piano-key layer (far) */}
        <motion.div
          className="absolute inset-x-0 top-[16%] flex justify-center gap-[10px] px-[8%]"
          style={animate ? { y: bgY, scale: bgScale } : undefined}
        >
          {Array.from({ length: 30 }).map((_, i) => (
            <span
              key={i}
              className="block h-[13vh] w-1.5 rounded-full bg-ivory"
              style={{ opacity: 0.04 + (i % 4 === 0 ? 0.05 : 0) }}
            />
          ))}
        </motion.div>

        {/* ghost wordmark */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          style={animate ? { opacity: ghostOpacity, scale: ghostScale } : { opacity: 0.04 }}
        >
          <span className="select-none whitespace-nowrap font-serif text-[22vw] leading-none text-ivory">
            Reza Ohadi
          </span>
        </motion.div>

        {/* foreground keyboard in perspective (near) */}
        <div className="absolute inset-x-0 bottom-0 flex justify-center" style={{ perspective: "1200px" }}>
          <motion.div
            className={cn(
              "flex h-[34vh] w-[124%] origin-bottom items-end justify-center gap-[8px]",
              !animate && "opacity-40",
            )}
            style={animate ? { rotateX: fgRot, y: fgY, scale: fgScale, opacity: fgOpacity } : undefined}
          >
            {Array.from({ length: 18 }).map((_, i) => (
              <span
                key={i}
                className="block flex-1 rounded-t-[2px] bg-ivory"
                style={{ height: `${55 + (i % 2 ? 0 : 35)}%`, opacity: i % 2 ? 0.14 : 0.4 }}
              />
            ))}
          </motion.div>
        </div>

        {/* floor sheen */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* ============================== SCENES ============================== */}
      <div className="relative z-10 -mt-[100svh]">
        {/* 1 — Arrival */}
        <div className="flex h-[100svh] items-center">
          <motion.div
            className="container-editorial"
            style={animate ? { opacity: heroOpacity, y: heroY } : undefined}
          >
            <motion.span
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.4 }}
              className="kicker mb-6 block"
            >
              Pianist · Composer · Canada
            </motion.span>
            <TextReveal
              text={hero.headline}
              as="h1"
              immediate
              delay={0.5}
              className="font-serif text-display text-ivory text-shadow-cinematic"
            />
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: EASE, delay: 0.9 }}
              className="mt-6 font-serif text-2xl italic text-ivory/90 sm:text-3xl"
            >
              {hero.subtitle}
            </motion.p>
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: EASE, delay: 1.05 }}
              className="mt-4 max-w-md font-sans text-sm leading-relaxed text-silver-300"
            >
              {hero.supporting}
            </motion.p>
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: EASE, delay: 1.2 }}
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

          {/* scroll cue */}
          <motion.div
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.6 }}
            className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3"
            aria-hidden
          >
            <span className="text-[0.62rem] uppercase tracking-editorial text-silver-400">Scroll</span>
            <span className="relative block h-12 w-px overflow-hidden bg-white/15">
              <motion.span
                className="absolute left-0 top-0 block h-4 w-px bg-ivory"
                animate={reduce ? {} : { y: ["-100%", "300%"] }}
                transition={{ duration: 2.2, ease: "easeInOut", repeat: Infinity }}
              />
            </span>
          </motion.div>
        </div>

        {/* 2 — First reflection */}
        <div className="flex min-h-[86svh] items-center">
          <div className="container-editorial">
            <Reveal className="mx-auto max-w-3xl text-center">
              <span className="kicker">A thought</span>
            </Reveal>
            <Stagger
              as="blockquote"
              stagger={0.5}
              amount={0.4}
              className="mx-auto mt-8 max-w-3xl text-center font-serif text-3xl font-light italic leading-[1.35] text-ivory sm:text-4xl lg:text-5xl"
            >
              {REFLECTION.map((phrase, i) => (
                <StaggerItem as="span" key={i} className="block">
                  {phrase}
                </StaggerItem>
              ))}
            </Stagger>
            <Reveal delay={0.2} className="mt-10 flex justify-center">
              <DrawLine className="text-silver-300/50" />
            </Reveal>
          </div>
        </div>

        {/* 3 — Featured composition emerging */}
        {featured ? (
          <div className="flex min-h-[112svh] items-center py-24">
            <FeaturedComposition product={featured} />
          </div>
        ) : null}

        {/* 4 — Memory sequence */}
        <div className="py-10">
          <div className="container-editorial">
            <Reveal>
              <span className="kicker flex items-center gap-3">
                <span className="inline-block h-px w-8 bg-silver-400/60" />
                From the practice room
              </span>
            </Reveal>
          </div>
          {memories.slice(0, 3).map((img, i) => (
            <MemoryImage
              key={img.id}
              img={img}
              caption={MEMORY_CAPTIONS[i] ?? img.caption ?? "Memory"}
              align={i % 2 === 0 ? "left" : "right"}
            />
          ))}
        </div>

        {/* 5 — Gentle invitation */}
        <div className="flex min-h-[86svh] items-center py-20">
          <div className="container-editorial w-full">
            <Reveal>
              <span className="kicker">Step inside</span>
            </Reveal>
            <Stagger className="mt-8 grid border-t border-white/10 sm:grid-cols-3">
              {DOORWAYS.map((d) => (
                <StaggerItem key={d.href}>
                  <Link
                    href={d.href}
                    className="group flex h-full flex-col gap-3 border-b border-white/10 py-10 transition-colors hover:bg-white/[0.02] sm:border-b-0 sm:border-r sm:px-8 sm:last:border-r-0"
                  >
                    <span className="font-sans text-xs tracking-widest text-silver-400">{d.index}</span>
                    <span className="flex items-center gap-3 font-serif text-3xl text-ivory transition-all duration-500 ease-cinematic group-hover:translate-x-1.5 sm:text-4xl">
                      {d.label}
                      <ArrowUpRight className="h-5 w-5 text-silver-400 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    </span>
                    <span className="font-sans text-sm text-silver-300">{d.note}</span>
                  </Link>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
      </div>
    </section>
  );
}

/* A single memory image with quiet parallax inside the shared dark space. */
function MemoryImage({
  img,
  caption,
  align,
}: {
  img: GalleryImage;
  caption: string;
  align: "left" | "right";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["10%", "-10%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.08, 1]);

  return (
    <div
      ref={ref}
      className={cn(
        "container-editorial flex min-h-[72svh] items-center",
        align === "right" ? "justify-end" : "justify-start",
      )}
    >
      <Reveal className={cn("w-full md:w-[66%]", align === "right" && "md:ml-auto")}>
        <figure className="relative aspect-[16/10] overflow-hidden ring-1 ring-white/10">
          <motion.div
            className="absolute inset-[-8%]"
            style={reduce ? undefined : { y, scale }}
          >
            <Image
              src={img.imageUrl}
              alt={caption}
              fill
              sizes="(min-width: 768px) 66vw, 100vw"
              className="object-cover grayscale"
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-transparent to-ink/10" />
          <figcaption className="absolute bottom-5 left-5 font-sans text-[0.7rem] uppercase tracking-editorial text-ivory/80">
            {caption}
          </figcaption>
        </figure>
      </Reveal>
    </div>
  );
}
