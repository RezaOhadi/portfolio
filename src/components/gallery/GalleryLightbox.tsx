"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, ArrowUpRight } from "lucide-react";
import type { GalleryImage } from "@/lib/types";
import { Reveal } from "@/components/motion/Reveal";

export function GalleryLightbox({ images }: { images: GalleryImage[] }) {
  const [index, setIndex] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const current = index === null ? null : (images[index] ?? null);
  const isOpen = current !== null;
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (isOpen && !node.open) node.showModal();
    if (!isOpen && node.open) node.close();
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);
  const close = () => {
    setIndex(null);
    trigger.current?.focus();
  };
  const move = (delta: number) =>
    setIndex((value) =>
      value === null || !images.length
        ? null
        : (value + delta + images.length) % images.length,
    );
  if (!images.length)
    return (
      <p className="section-lead">New photographs will be shared here soon.</p>
    );
  return (
    <>
      <div className="portfolio-gallery">
        {images.map((photo, i) => (
          <Reveal key={photo.id}>
            <button
              type="button"
              className="gallery-tile"
              onClick={(event) => {
                trigger.current = event.currentTarget;
                setIndex(i);
              }}
              aria-label={
                "Open photograph: " +
                (photo.caption || "Gallery photograph " + (i + 1))
              }
            >
              <span className="gallery-image">
                <Image
                  src={photo.imageUrl}
                  alt={photo.caption || "Gallery photograph"}
                  fill
                  sizes="(max-width: 380px) 90vw, (max-width: 760px) 45vw, 30vw"
                />
              </span>
              <span className="gallery-caption">
                {photo.caption || "At the piano"}
                <ArrowUpRight size={18} aria-hidden />
              </span>
            </button>
          </Reveal>
        ))}
      </div>
      <dialog
        ref={dialog}
        className="photo-dialog"
        aria-label="Photo gallery viewer"
        onCancel={close}
        onClose={close}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            move(-1);
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            move(1);
          }
        }}
      >
        <div className="photo-toolbar">
          <span aria-live="polite">
            {index === null ? "" : index + 1 + " / " + images.length}
          </span>
          <div className="photo-controls">
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label="Previous photograph"
              disabled={images.length < 2}
            >
              <ChevronLeft aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              aria-label="Next photograph"
              disabled={images.length < 2}
            >
              <ChevronRight aria-hidden />
            </button>
            <button
              type="button"
              autoFocus
              onClick={close}
              aria-label="Close gallery viewer"
            >
              <X aria-hidden />
            </button>
          </div>
        </div>
        {current ? (
          <>
            <div className="photo-stage">
              <Image
                src={current.imageUrl}
                alt={current.caption || "Gallery photograph"}
                fill
                sizes="95vw"
              />
            </div>
            <p className="photo-caption" aria-live="polite">
              {current.caption}
              {current.location ? " · " + current.location : ""}
            </p>
          </>
        ) : null}
      </dialog>
    </>
  );
}
