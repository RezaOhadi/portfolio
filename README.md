# Reza Ohadi — Pianist & Composer

A cinematic personal website and **digital sheet-music store** for pianist and
composer Reza Ohadi. Built to feel like a quiet concert hall: deep matte black,
warm ivory, piano-inspired motion, and a secure storefront for selling original
scores as PDFs.

> **It runs out of the box.** With **no credentials configured** the site boots
> in *demo mode* — full design, placeholder catalogue, working previews — so you
> can see everything immediately. Add Supabase + Stripe + Resend to go live.

---

## Tech stack

| Concern | Choice |
| --- | --- |
| Framework | **Next.js 15** (App Router) + **TypeScript** |
| Styling | **Tailwind CSS** (custom black-&-white design system) |
| Animation | **Framer Motion** (reduced-motion aware) |
| Database / Auth / Storage | **Supabase** |
| Payments | **Stripe Checkout** + webhooks |
| Email | **Resend** (transactional) |
| Hosting | **Vercel**-ready |

---

## 1. Run the project locally

```bash
# 1. Install dependencies
npm install

# 2. (Optional) generate the placeholder art again
npm run gen:placeholders

# 3. Start the dev server
npm run dev          # http://localhost:3000
```

That's it for **demo mode**. To enable real data and payments:

```bash
cp .env.example .env.local
# fill in the values (see below), then restart `npm run dev`
```

Other scripts:

```bash
npm run build        # production build
npm start            # run the production build
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
```

---

## 2. Environment variables

Copy `.env.example` → `.env.local`. **Nothing is required for demo mode**; add
groups as you enable features.

| Variable | Required for | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | SEO, emails, Stripe URLs | e.g. `https://rezaohadi.com` (no trailing slash) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase (server) | **Secret.** Webhooks, downloads, admin writes |
| `SUPABASE_PUBLIC_BUCKET` | Supabase | Default `public-assets` |
| `SUPABASE_SCORES_BUCKET` | Supabase | Default `scores` (private) |
| `STRIPE_SECRET_KEY` | Payments (server) | **Secret** |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Payments | Public key |
| `STRIPE_WEBHOOK_SECRET` | Payments | From `stripe listen` / dashboard |
| `RESEND_API_KEY` | Email | Purchase + contact emails |
| `EMAIL_FROM` | Email | Verified sender, e.g. `Reza Ohadi <store@domain.com>` |
| `CONTACT_TO_EMAIL` | Email | Where the contact form is delivered |
| `ADMIN_EMAILS` | Admin | Comma-separated allowlist for `/admin` |
| `DOWNLOAD_LINK_TTL_SECONDS` | Downloads | Signed-URL lifetime (default `300`) |

A feature is considered "configured" only when its keys are present; otherwise
the app degrades gracefully (placeholder data, disabled checkout, logged emails).

---

## 3. Connect Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. **Database** → open the **SQL Editor** and run, in order:
   - [`supabase/schema.sql`](supabase/schema.sql) — tables, RLS, triggers
   - [`supabase/storage.sql`](supabase/storage.sql) — buckets + storage policies
   - *(optional)* [`supabase/seed.sql`](supabase/seed.sql) — demo catalogue/content
3. **Project Settings → API**: copy the URL + `anon` key + `service_role` key
   into `.env.local`.
4. **Create an admin user**:
   - **Authentication → Users → Add user** (email + password), **or** sign up.
   - Make them an admin one of two ways:
     - add their email to `ADMIN_EMAILS`, **or**
     - run `update public.profiles set role = 'admin' where email = 'you@example.com';`
5. Sign in at **`/admin`**.

### Storage buckets

`storage.sql` creates them, but to do it by hand:

| Bucket | Public? | Holds |
| --- | --- | --- |
| `public-assets` | **Public** | cover art, preview pages, gallery, portraits |
| `scores` | **Private** | original PDFs — only ever delivered via signed URLs |

The PDFs live in the **private** `scores` bucket. They are never exposed
directly; `/api/download` verifies the buyer's token and mints a short-lived
signed URL server-side.

---

## 4. Connect Stripe

1. Create a [Stripe](https://stripe.com) account (test mode is fine).
2. **Developers → API keys**: copy the secret + publishable keys into `.env.local`.
3. Prices are created **dynamically per checkout** from each product's price —
   you don't need to create Stripe Products manually.

Guest checkout is enabled (Stripe collects the buyer's email); customer accounts
can be layered on later via Supabase Auth.

## 5. Configure the Stripe webhook

Fulfillment (recording the purchase + emailing the download link) happens in the
webhook **and** is double-checked on the success page, so it's reliable either way.

**Local development**

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# copy the printed "whsec_..." into STRIPE_WEBHOOK_SECRET
```

**Production** — **Developers → Webhooks → Add endpoint**:

- URL: `https://YOUR_DOMAIN/api/webhooks/stripe`
- Events to send:
  - `checkout.session.completed`
  - `checkout.session.async_payment_succeeded`
- Copy the endpoint's **Signing secret** into `STRIPE_WEBHOOK_SECRET`.

---

## 6. Upload products & sheet music

Everything is managed from **`/admin`** (no code or redeploy needed):

- **Products → New product** — title, slug, price, difficulty, instrument,
  genre, mood, pages, duration, descriptions, related slugs, and links
  (audio / YouTube / Instagram).
  - **Cover image** → public bucket
  - **Preview pages** (multiple) → public bucket *(use watermarked / low-res
    images — these are what shoppers see)*
  - **Original PDF** → **private** `scores` bucket *(delivered only after purchase)*
  - Toggle **Published** / **Featured**.
- **Purchases** — view orders + customer emails, re-send a download email, or
  grab the file via the secure link.
- **Content** — social links, home artist statement + featured composition,
  biography text + portrait/wide/signature images, and the **gallery** (add /
  remove photos). Longer biography arrays (timeline, education, quotes) can be
  edited as JSON in the `site_content` table (key `bio`).

---

## 7. Deploy to Vercel

1. Push this repo to GitHub.
2. [vercel.com](https://vercel.com) → **New Project** → import the repo
   (framework auto-detected as Next.js).
3. Add **all** environment variables from `.env.local` in
   **Project → Settings → Environment Variables** (set `NEXT_PUBLIC_SITE_URL` to
   your real domain).
4. Deploy.
5. Add the **production Stripe webhook** pointing at
   `https://YOUR_DOMAIN/api/webhooks/stripe` (step 5).
6. In Supabase **Authentication → URL Configuration**, add your domain to the
   redirect/allow list.

---

## 8. Replace the placeholder content

All placeholders are clearly labelled (`[PLACEHOLDER …]` in text, `/placeholders/*.svg`
for images). Nothing is hardcoded into the UI — it all flows through the data
layer (`src/lib/data`) and is editable via the admin dashboard or database.

| Placeholder | Replace via |
| --- | --- |
| Hero / artist photo | Admin → Content → Biography images, or `site_content.hero.image` |
| Biography portrait / wide / signature | Admin → Content → Biography |
| Biography text, timeline, quotes | Admin → Content (text) / `site_content` JSON (arrays) |
| Sheet-music covers, previews, PDFs | Admin → Products |
| Audio previews, YouTube/Instagram links | Admin → Products / Content |
| Gallery photos | Admin → Content → Gallery |
| Media (videos/reels) | `site_content.media` JSON (see `src/lib/data/placeholder.ts` shape) |
| Social links & contact email | Admin → Content → Social |
| Concert dates | `site_content.home.performances` JSON |

Placeholder art is generated into `public/placeholders/` by
[`scripts/gen-placeholders.mjs`](scripts/gen-placeholders.mjs). It runs
automatically on `npm install` (a `postinstall` hook) and on Vercel builds, so
the files are not committed — re-run manually with `npm run gen:placeholders`.
The owner's original `profile.jpg` is kept at the repo root for reference (low-res).

---

## Project structure

```
src/
├── app/
│   ├── (site)/              # public site (shares nav/footer + page transitions)
│   │   ├── page.tsx         # Home
│   │   ├── store/           # catalogue + [slug] product detail
│   │   ├── biography, gallery, media, contact, library/
│   │   └── checkout/success/
│   ├── admin/               # protected dashboard (login + (dashboard) group)
│   ├── api/                 # checkout, webhooks/stripe, download
│   ├── sitemap.ts, robots.ts, opengraph-image.tsx
│   └── layout.tsx, globals.css
├── components/              # ui, motion, layout, home, store, media, gallery, admin
├── lib/
│   ├── data/                # data-access layer (+ placeholder fallback)
│   ├── supabase/            # browser / server / admin / public clients + storage
│   ├── stripe/              # client + fulfillment
│   ├── email/               # Resend wrapper + templates
│   ├── auth.ts, env.ts, types.ts, utils.ts, validation.ts
│   └── ...
├── config/site.ts           # brand + navigation
└── middleware.ts            # session refresh + /admin gate
supabase/                    # schema.sql, storage.sql, seed.sql
```

---

## Database schema summary

- **products** — catalogue. Public can read `published = true`; admins manage all.
  Private `pdf_path` points into the `scores` bucket.
- **purchases** — completed orders (email, Stripe ids, `download_token`, status).
  **No public read** — server-only via service role; admins read in the dashboard.
- **gallery_images** — gallery (public read, admin write).
- **site_content** — key/value JSON (`social`, `hero`, `home`, `bio`, `media`),
  deep-merged over built-in defaults.
- **profiles** — links `auth.users` → `role` (`admin` gate). Auto-created on signup.

RLS is enabled on every table; `public.is_admin()` powers admin policies.

---

## Security notes

- Original PDFs are in a **private** bucket; the client never sees a direct URL.
- Downloads require the per-purchase `download_token`; each request mints a
  fresh, expiring signed URL (`DOWNLOAD_LINK_TTL_SECONDS`).
- The library page never lists purchases on screen — it **emails** secure links,
  preventing email enumeration.
- The Stripe webhook verifies signatures; fulfillment is idempotent on the
  session id (email sent exactly once).
- `/admin` is gated by middleware **and** re-checked in the layout and every
  server action. The `service_role` key is server-only.
- Contact form: server-side validation (Zod) + honeypot + time-trap.

---

## Remaining items that need real credentials or media

To go fully live you'll need to supply:

1. **Supabase** project + the three SQL files run + an admin user.
2. **Stripe** keys + a configured webhook endpoint.
3. **Resend** API key + a verified sending domain (`EMAIL_FROM`).
4. **Real media**: artist/biography photography, sheet-music **cover art**,
   **watermarked preview pages**, the **original PDFs**, audio previews, and real
   YouTube/Instagram links.
5. **Real copy**: biography, composer statement, philosophy, timeline, concert
   dates, program notes.
6. `NEXT_PUBLIC_SITE_URL` set to the production domain.

Until then, the site happily runs in demo mode with the bundled placeholders.
```
