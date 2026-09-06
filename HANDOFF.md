# HANDOFF — Reza Ohadi site & sheet-music store

**Date:** 2026-06-27
**Branch:** `claude/reza-ohadi-music-site-yfih4x`
**Status:** Build complete and verified locally. **Not yet pushed** — this
session's GitHub access is read-only (see "Blocked" below).

---

## Local commits (preserved)

These two commits sit on top of the original `main` (`cbcba51`):

| Hash | Summary |
| --- | --- |
| `b5c6f75b030aedf12389a943b29059cac9512993` | Generate placeholders on install; tidy gitignore + README (tip) |
| `ec7c35c382c7e2ce65d2a4841dd7833da6778c97` | Build cinematic pianist site + digital sheet-music store |

Author/committer on both: `Claude <noreply@anthropic.com>`.
> Note: commits are **unsigned** (`[N]`) — no SSH/GPG signing key is available
> in this environment (`/home/claude/.ssh/commit_signing_key.pub` is empty), so
> GitHub will show them "Unverified". Pushing via the GitHub API would auto-sign
> them; pushing via plain `git` keeps them unsigned. Cosmetic only.

---

## Backups

- `rezaohadi-portfolio-backup.zip` — entire repo incl. `.git` history, all
  source, `README.md`, `HANDOFF.md`, `package.json`/lockfile, `supabase/*.sql`,
  `public/` and generated placeholders. Excludes `node_modules/` and `.next/`.
- `rezaohadi-portfolio-backup.bundle` — git bundle with full history + the two
  commits above (clonable / fetchable).

---

## What is completed

- **Stack:** Next.js 15 (App Router) + TypeScript + Tailwind + Framer Motion +
  Supabase + Stripe + Resend. Production build passes (`next build`, 20 routes);
  runtime smoke-tested.
- **Design system:** black/ivory "piano" theme, Cormorant + Inter, motion
  primitives (reveal, text-reveal, piano-curtain route transitions),
  reduced-motion support, SVG placeholder generator.
- **Public pages:** Home (cinematic hero + editorial sections), Biography,
  Gallery (keyboard lightbox), Media (click-to-load YouTube), Contact (validated
  server action + honeypot). Floating nav with full-screen piano-panel menu.
- **Store:** filter/sort catalogue, premium cards, product detail with
  watermarked + zoomable + locked preview, related items, structured data.
- **Commerce:** Stripe Checkout, signature-verified webhook, idempotent
  fulfillment, Resend purchase email, signed-URL downloads from a PRIVATE
  bucket, guest "My Library" via emailed secure links.
- **Admin:** Supabase-auth + role-gated dashboard — product CRUD with uploads,
  purchases view + resend, content/gallery management.
- **A11y/SEO:** per-page metadata, product + artist JSON-LD, dynamic OG image,
  sitemap, robots, 404 + error boundaries.
- **Docs:** `README.md` (setup, env vars, Supabase/Stripe/Resend, deploy,
  replacing placeholders) and `supabase/{schema,storage,seed}.sql`.
- **Graceful demo mode:** runs fully with zero credentials (placeholder data),
  switches to live data when env vars are present.

## What is unfinished / blocked

- **GitHub push is blocked.** Every write path returns 403/401 for this session:
  git relay `receive-pack` is read-only by design (403 pre-auth), the MCP GitHub
  integration says "Resource not accessible by integration" (its token predates
  the write grant), and the env `GITHUB_TOKEN` is a 14-char placeholder. Nothing
  has been pushed to the remote; only `main` exists on GitHub.
- **No real credentials/media yet** (expected): Supabase project, Stripe keys +
  webhook, Resend key + verified domain, and real photos/cover art/PDFs/copy.
  All are placeholders until supplied (see README → "Replace placeholders").

---

## How to restore this project tomorrow

### Option A — from the ZIP (recommended; keeps git history)

```bash
mkdir reza-ohadi && cd reza-ohadi
unzip /path/to/rezaohadi-portfolio-backup.zip
git status                       # should show branch claude/reza-ohadi-music-site-yfih4x
npm install                      # regenerates placeholders via postinstall
cp .env.example .env.local       # optional: fill in for live mode
npm run dev                      # http://localhost:3000
```

### Option B — from the git bundle

```bash
git clone rezaohadi-portfolio-backup.bundle reza-ohadi
cd reza-ohadi
git checkout claude/reza-ohadi-music-site-yfih4x
npm install && npm run dev
```

### Pushing to GitHub (once write access works)

From a clone/checkout with a credentialed remote:

```bash
git remote add gh https://github.com/RezaOhadi/portfolio.git   # if needed
git push gh claude/reza-ohadi-music-site-yfih4x
```

This preserves the exact commits `b5c6f75` / `ec7c35c`. (Pushing via the GitHub
API instead would recreate them as new, auto-signed commit hashes.)

### Verify the build

```bash
npm run build      # expect 20 routes, success
npm run typecheck  # no errors
```
