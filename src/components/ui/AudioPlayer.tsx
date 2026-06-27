"use client";

import { useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/utils";

/**
 * Minimal, accessible audio player for composition previews.
 * When `src` is null it renders a tasteful disabled state (placeholder mode).
 */
export function AudioPlayer({
  src,
  title,
  className,
}: {
  src: string | null;
  title?: string;
  className?: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);

  const disabled = !src;

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      void a.play();
      setPlaying(true);
    } else {
      a.pause();
      setPlaying(false);
    }
  }

  function onSeek(e: React.MouseEvent<HTMLDivElement>) {
    const a = audioRef.current;
    if (!a || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    a.currentTime = pct * duration;
  }

  return (
    <div
      className={cn(
        "glass flex items-center gap-4 rounded-full px-4 py-3",
        disabled && "opacity-60",
        className,
      )}
    >
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        aria-label={playing ? "Pause preview" : "Play preview"}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 text-ivory transition-colors hover:border-ivory hover:bg-white/5 disabled:cursor-not-allowed"
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="truncate font-sans text-xs uppercase tracking-widest text-silver-300">
            {title ?? "Audio preview"}
          </span>
          <span className="shrink-0 font-sans text-[0.7rem] tabular-nums text-silver-400">
            {disabled ? "—" : `${formatDuration(current)} / ${formatDuration(duration)}`}
          </span>
        </div>
        <div
          className="mt-2 h-1 w-full cursor-pointer rounded-full bg-white/10"
          onClick={onSeek}
          role="presentation"
        >
          <div
            className="h-full rounded-full bg-ivory transition-[width] duration-150"
            style={{ width: `${disabled ? 0 : progress}%` }}
          />
        </div>
        {disabled ? (
          <p className="mt-2 font-sans text-[0.7rem] text-silver-400">
            Audio preview coming soon.
          </p>
        ) : null}
      </div>

      {src ? (
        <audio
          ref={audioRef}
          src={src}
          preload="metadata"
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
          onTimeUpdate={(e) => {
            const a = e.currentTarget;
            setCurrent(a.currentTime);
            setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0);
          }}
          onEnded={() => {
            setPlaying(false);
            setProgress(0);
            setCurrent(0);
          }}
        />
      ) : null}
    </div>
  );
}
