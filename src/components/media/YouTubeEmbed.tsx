"use client";

import Image from "next/image";
import { useState } from "react";
import { Play } from "lucide-react";
import { cn, youtubeId } from "@/lib/utils";

/**
 * Click-to-load YouTube facade. Shows a poster until the visitor presses play,
 * then mounts the privacy-friendly nocookie iframe. Keeps the page light.
 */
export function YouTubeEmbed({
  url,
  title,
  poster,
  className,
}: {
  url: string | null;
  title: string;
  poster?: string | null;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const id = youtubeId(url);
  const thumb =
    poster ?? (id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null);

  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden bg-charcoal-900 ring-1 ring-white/10",
        className,
      )}
    >
      {loaded && id ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setLoaded(true)}
          disabled={!id}
          className="group absolute inset-0 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ivory disabled:cursor-not-allowed"
          aria-label={id ? `Play video: ${title}` : `${title} (video link unavailable)`}
        >
          {thumb ? (
            <Image
              src={thumb}
              alt=""
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover grayscale transition-all duration-700 ease-cinematic group-hover:scale-105 group-hover:grayscale-0"
            />
          ) : null}
          <span className="absolute inset-0 bg-ink/30 transition-colors group-hover:bg-ink/10" />
          <span className="relative flex h-20 w-20 items-center justify-center rounded-full border border-white/30 bg-ink/40 backdrop-blur transition-all duration-500 ease-cinematic group-hover:scale-105 group-hover:border-ivory">
            <Play className="ml-1 h-7 w-7 text-ivory" />
          </span>
        </button>
      )}
    </div>
  );
}
