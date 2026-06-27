"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Instagram, ArrowUpRight } from "lucide-react";
import type { MediaItem } from "@/lib/types";
import { YouTubeEmbed } from "./YouTubeEmbed";
import { AudioPlayer } from "@/components/ui/AudioPlayer";
import { cn } from "@/lib/utils";

export function MediaExplorer({ items }: { items: MediaItem[] }) {
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(items.map((i) => i.category)))],
    [items],
  );
  const [active, setActive] = useState("All");
  const filtered = active === "All" ? items : items.filter((i) => i.category === active);

  return (
    <div>
      <div role="tablist" aria-label="Media categories" className="mb-10 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            role="tab"
            aria-selected={active === cat}
            onClick={() => setActive(cat)}
            className={cn(
              "rounded-full border px-4 py-2 text-[0.7rem] uppercase tracking-widest transition-colors duration-300",
              active === cat
                ? "border-ivory bg-ivory text-ink"
                : "border-white/15 text-silver-300 hover:border-white/40 hover:text-ivory",
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid gap-x-6 gap-y-12 md:grid-cols-2">
        {filtered.map((item) => (
          <article key={item.id} className="flex flex-col gap-4">
            {item.type === "youtube" ? (
              <YouTubeEmbed url={item.youtubeUrl} title={item.title} poster={item.poster} />
            ) : null}

            {item.type === "instagram" ? (
              <a
                href={item.instagramUrl ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block aspect-video overflow-hidden bg-charcoal-900 ring-1 ring-white/10"
              >
                {item.poster ? (
                  <Image
                    src={item.poster}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover grayscale transition-all duration-700 ease-cinematic group-hover:scale-105 group-hover:grayscale-0"
                  />
                ) : null}
                <span className="absolute inset-0 flex items-center justify-center bg-ink/40 transition-colors group-hover:bg-ink/20">
                  <span className="flex items-center gap-2 rounded-full border border-white/30 bg-ink/40 px-5 py-2.5 text-[0.7rem] uppercase tracking-widest text-ivory backdrop-blur">
                    <Instagram className="h-4 w-4" /> View on Instagram
                  </span>
                </span>
              </a>
            ) : null}

            {item.type === "audio" ? (
              <div className="relative flex aspect-video flex-col justify-end overflow-hidden bg-charcoal-900 p-5 ring-1 ring-white/10">
                {item.poster ? (
                  <Image src={item.poster} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover opacity-40 grayscale" />
                ) : null}
                <div className="relative">
                  <AudioPlayer src={item.audioUrl} title={item.title} />
                </div>
              </div>
            ) : null}

            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-serif text-2xl text-ivory">{item.title}</h3>
                <p className="kicker mt-1 normal-case tracking-wider text-silver-400">
                  {item.category}
                </p>
              </div>
              {item.type === "youtube" && item.youtubeUrl ? (
                <a
                  href={item.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${item.title} on YouTube`}
                  className="mt-1 text-silver-400 transition-colors hover:text-ivory"
                >
                  <ArrowUpRight className="h-5 w-5" />
                </a>
              ) : null}
            </div>
            {item.description ? (
              <p className="font-sans text-sm leading-relaxed text-silver-300">
                {item.description}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
