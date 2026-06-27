"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Lock, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Watermarked, reduced-resolution preview viewer with cursor-follow zoom.
 * The full-resolution PDF is NEVER exposed here — these are public preview
 * images only; the original is delivered as a signed URL after purchase.
 */
export function ScorePreview({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const ref = useRef<HTMLDivElement>(null);

  const pages = images.length ? images : ["/placeholders/preview-1.svg"];

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin({ x, y });
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        ref={ref}
        className="group relative aspect-[900/1165] w-full overflow-hidden bg-ivory-200 ring-1 ring-white/10"
        onMouseEnter={() => setZoom(true)}
        onMouseLeave={() => setZoom(false)}
        onMouseMove={onMove}
        role="img"
        aria-label={`${title} — preview page ${active + 1} of ${pages.length} (watermarked)`}
      >
        <Image
          src={pages[active]}
          alt={`${title} preview page ${active + 1}`}
          fill
          sizes="(min-width: 1024px) 45vw, 90vw"
          className="object-contain transition-transform duration-300 ease-out"
          style={{
            transform: zoom ? "scale(2)" : "scale(1)",
            transformOrigin: `${origin.x}% ${origin.y}%`,
          }}
        />

        {/* Locked / watermark indicators */}
        <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-ink/70 px-3 py-1.5 text-[0.62rem] uppercase tracking-widest text-ivory backdrop-blur">
          <Lock className="h-3 w-3" /> Preview
        </div>
        <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-ink/70 px-3 py-1.5 text-[0.62rem] uppercase tracking-widest text-ivory opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
          <ZoomIn className="h-3 w-3" /> Hover to zoom
        </div>
      </div>

      {pages.length > 1 ? (
        <div className="flex gap-3" role="tablist" aria-label="Preview pages">
          {pages.map((src, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={active === i}
              onClick={() => setActive(i)}
              className={cn(
                "relative aspect-[900/1165] w-16 overflow-hidden bg-ivory-200 ring-1 transition-all duration-300",
                active === i ? "ring-ivory" : "ring-white/15 hover:ring-white/40",
              )}
              aria-label={`Preview page ${i + 1}`}
            >
              <Image src={src} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      <p className="font-sans text-xs leading-relaxed text-silver-400">
        Previews are watermarked and reduced in quality. The complete,
        high-resolution PDF is delivered securely after purchase.
      </p>
    </div>
  );
}
