# Hero portrait

Drop the homepage portrait in this folder as **`hero-portrait.jpg`** (`.jpeg`,
`.png`, `.webp` and `.avif` also work). `scripts/gen-gallery.mjs` runs on
`prebuild` / `predev`, finds the file, and writes the path into
`src/config/hero.generated.json` — no code change and no rebuild config needed.

Use the largest version you have: the frame renders up to 520 px wide at 2×, so
a source of at least 1200 × 1500 keeps it sharp. Without a file here the site
falls back to `/profile.jpg`, which is only 225 × 225 and looks soft when the
hero scales it up.

To point the hero somewhere else entirely — a CDN URL, or a differently named
file — set `heroPortraitSrc` in `src/config/site.ts`, or the
`NEXT_PUBLIC_HERO_IMAGE` environment variable. Remote hosts that are not listed
in `next.config.mjs` → `images.remotePatterns` are served unoptimized rather
than failing the render.

Resolution order: admin upload → `NEXT_PUBLIC_HERO_IMAGE` → `heroPortraitSrc` →
this folder → `/profile.jpg`.
