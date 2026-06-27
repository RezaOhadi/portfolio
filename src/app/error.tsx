"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-32 text-center">
      <span className="kicker">A wrong note</span>
      <h1 className="mt-6 font-serif text-4xl text-ivory sm:text-5xl">Something went wrong</h1>
      <p className="mt-3 max-w-prose font-sans text-sm leading-relaxed text-silver-300">
        An unexpected error occurred. Please try again.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={reset}
          className="border border-ivory bg-ivory px-6 py-3.5 font-sans text-[0.72rem] uppercase tracking-widest text-ink transition-colors hover:bg-white"
        >
          Try again
        </button>
        <a
          href="/"
          className="border border-white/25 px-6 py-3.5 font-sans text-[0.72rem] uppercase tracking-widest text-ivory transition-colors hover:border-ivory"
        >
          Return home
        </a>
      </div>
    </div>
  );
}
