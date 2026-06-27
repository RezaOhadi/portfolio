"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { GalleryImage } from "@/lib/types";
import { Stagger, StaggerItem } from "@/components/motion/Reveal";
import { formatDate } from "@/lib/utils";

export function GalleryLightbox({ images }: { images: GalleryImage[] }) {
  const [index, setIndex] = useState<number | null>(null);
  const lastFocused = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const open = useCallback((i: number) => {
    lastFocused.current = document.activeElement as HTMLElement;
    setIndex(i);
  }, []);
  const close = useCallback(() => {
    setIndex(null);
    lastFocused.current?.focus();
  }, []);
  const prev = useCallback(
    () => setIndex((i) => (i === null ? i : (i - 1 + images.length) % images.length)),
    [images.length],
  );
  const next = useCallback(
    () => setIndex((i) => (i === null ? i : (i + 1) % images.length)),
    [images.length],
  );

  useEffect(() => {
    if (index === null) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [index, close, prev, next]);

  const current = index === null ? null : images[index];

  return (
    <>
      <Stagger
        className="columns-1 gap-4 sm:columns-2 lg:columns-3"
        amount={0.05}
      >
        {images.map((img, i) => (
          <StaggerItem key={img.id} className="mb-4 break-inside-avoid">
            <button
              type="button"
              onClick={() => open(i)}
              className="group relative block w-full overflow-hidden bg-charcoal-900 ring-1 ring-white/10 transition-all duration-500 ease-cinematic hover:ring-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ivory"
              aria-label={`Open image${img.caption ? `: ${img.caption}` : ""}`}
            >
              <Image
                src={img.imageUrl}
                alt={img.caption ?? "Gallery photograph"}
                width={img.width}
                height={img.height}
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="h-auto w-full object-cover grayscale transition-all duration-700 ease-cinematic group-hover:scale-[1.03] group-hover:grayscale-0"
              />
              {img.caption ? (
                <span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-ink/80 to-transparent p-4 text-left font-sans text-xs uppercase tracking-widest text-ivory/0 transition-all duration-500 group-hover:translate-y-0 group-hover:text-ivory/90">
                  {img.caption}
                </span>
              ) : null}
            </button>
          </StaggerItem>
        ))}
      </Stagger>

      <AnimatePresence>
        {current ? (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={current.caption ?? "Image viewer"}
            className="fixed inset-0 z-[120] flex flex-col bg-ink/96 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={close}
          >
            <div className="flex items-center justify-between p-5 md:p-7">
              <span className="font-sans text-xs uppercase tracking-widest text-silver-400">
                {String((index ?? 0) + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
              </span>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                aria-label="Close viewer"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-ivory transition-colors hover:border-ivory hover:bg-white/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div
              className="relative flex flex-1 items-center justify-center px-4 pb-4"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={prev}
                aria-label="Previous image"
                className="absolute left-3 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/15 text-ivory transition-colors hover:border-ivory hover:bg-white/5 md:left-8"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>

              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.99 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="relative flex max-h-full max-w-5xl items-center justify-center"
                >
                  <Image
                    src={current.imageUrl}
                    alt={current.caption ?? "Gallery photograph"}
                    width={current.width}
                    height={current.height}
                    sizes="90vw"
                    className="max-h-[78vh] w-auto object-contain"
                  />
                </motion.div>
              </AnimatePresence>

              <button
                type="button"
                onClick={next}
                aria-label="Next image"
                className="absolute right-3 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/15 text-ivory transition-colors hover:border-ivory hover:bg-white/5 md:right-8"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>

            {(current.caption || current.location || current.eventDate) && (
              <div
                className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 p-5 text-center md:p-7"
                onClick={(e) => e.stopPropagation()}
              >
                {current.caption ? (
                  <span className="font-serif text-lg text-ivory">{current.caption}</span>
                ) : null}
                {current.location ? (
                  <span className="font-sans text-xs uppercase tracking-widest text-silver-400">
                    {current.location}
                  </span>
                ) : null}
                {current.eventDate ? (
                  <span className="font-sans text-xs uppercase tracking-widest text-silver-400">
                    {formatDate(current.eventDate)}
                  </span>
                ) : null}
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
