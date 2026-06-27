import Link from "next/link";

export function NotFoundContent() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-32 text-center">
      <span className="kicker">Lost the thread</span>
      <p className="mt-6 font-serif text-7xl text-ivory sm:text-8xl">404</p>
      <h1 className="mt-4 font-serif text-3xl text-ivory">This page has gone quiet</h1>
      <p className="mt-3 max-w-prose font-sans text-sm leading-relaxed text-silver-300">
        The page you’re looking for doesn’t exist or may have moved.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/"
          className="border border-ivory bg-ivory px-6 py-3.5 font-sans text-[0.72rem] uppercase tracking-widest text-ink transition-colors hover:bg-white"
        >
          Return home
        </Link>
        <Link
          href="/store"
          className="border border-white/25 px-6 py-3.5 font-sans text-[0.72rem] uppercase tracking-widest text-ivory transition-colors hover:border-ivory"
        >
          Browse sheet music
        </Link>
      </div>
    </div>
  );
}
