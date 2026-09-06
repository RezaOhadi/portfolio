"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { cn, youtubeId } from "@/lib/utils";
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
  const player = useRef<HTMLIFrameElement>(null);
  const id = youtubeId(url);
  const thumb =
    poster ?? (id ? "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg" : null);
  useEffect(() => {
    setLoaded(false);
  }, [id]);
  useEffect(() => {
    if (loaded) player.current?.focus();
  }, [loaded]);
  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden bg-charcoal-900 ring-1 ring-white/10",
        className,
      )}
    >
      {loaded && id ? (
        <iframe
          ref={player}
          className="absolute inset-0 h-full w-full"
          src={
            "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0"
          }
          title={title}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setLoaded(true)}
          disabled={!id}
          className="group absolute inset-0 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ivory disabled:cursor-default"
          aria-label={
            id ? "Play video: " + title : title + " — video coming soon"
          }
        >
          {thumb ? (
            <Image
              src={thumb}
              alt=""
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              className="object-cover grayscale transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : null}
          <span className="absolute inset-0 bg-ink/50" />
          {id ? (
            <span className="relative flex h-16 w-16 items-center justify-center rounded-full border border-white/50 bg-ink/60">
              <Play className="ml-1 h-6 w-6 text-ivory" aria-hidden />
            </span>
          ) : (
            <span className="relative border border-white/25 bg-ink/80 px-5 py-3 text-sm text-ivory">
              Performance coming soon
            </span>
          )}
        </button>
      )}
    </div>
  );
}
