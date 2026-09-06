# Portfolio redesign — editing and handoff

The existing Next.js App Router, Supabase content layer, Stripe checkout, purchased-score library, admin, download endpoints, and per-route metadata remain in place. The redesign changes their shared presentation and adds homepage sections.

## Run

- `npm ci`
- `npm run dev` — gallery discovery runs automatically before startup.
- `npm run build` — gallery discovery also runs before production builds.
- `npm run typecheck`
- `node --test scripts/verify-portfolio.mjs`

Development output lives in `.next-dev/`; production builds use `.next/`, so building does not overwrite a running preview's cache.

## Photography: drop files directly into the repository

Put JPG, JPEG, PNG, WebP, or AVIF files in:

`public/assets/images/gallery/`

These are served at `/assets/images/gallery/your-file.webp`. The generator discovers files directly in that folder; nested folders are not scanned. Prefix names with numbers to control order, for example `01-recital.webp`, `02-studio.jpg`. Restart development, run `npm run gen:gallery`, or rebuild to discover added/removed files.

Optional captions go in `public/assets/images/gallery/captions.json`:

```json
{
  "01-recital.webp": {
    "caption": "Reza Ohadi at the piano during rehearsal",
    "location": "Venue name",
    "eventDate": "2026-09-21",
    "width": 1600,
    "height": 2000
  }
}
```

Write meaningful descriptions for accessibility. The grid reserves a 4:5 crop; the lightbox shows the full image without cropping. Optimize web copies to roughly 1600–2400 pixels on the long edge. Keep archival originals outside the public website. Files in `public/` are public.

`src/config/gallery.generated.json` is generated; do not hand-edit it. Published Supabase gallery records retain their order and priority. Local photographs are appended without duplicate URLs. With no real assets or database gallery, the existing SVG placeholders are served under `/assets/images/gallery/placeholder-*.svg`.

The hero keeps `site_content.hero.image`. In demo mode its old SVG is replaced with the existing `public/profile.jpg` portrait, which is only 225×225 and should be replaced with a high-resolution photograph. To use a new file, add it under `public/assets/images/` and set the hero image to its public URL. No real production media was overwritten.

## YouTube: performance URLs

Full media records remain in Supabase `site_content`, key `media`, with the existing fields:

```json
{
  "id": "performance-01",
  "title": "Your performance title",
  "type": "youtube",
  "category": "Performance",
  "youtubeUrl": "https://www.youtube.com/watch?v=YOUR_VIDEO_ID",
  "audioUrl": null,
  "instagramUrl": null,
  "poster": null,
  "description": "Your performance description.",
  "featured": true
}
```

The example requires your actual 11-character video ID. With `poster: null`, the component uses the video's YouTube thumbnail. A local `/assets/images/...` poster also works.

For quick source edits, use `src/config/media.ts → youtubeOverrides`, keyed by the existing media record ID. The first three YouTube records appear on Home; all existing media remain on `/media`. The unrelated Rick Astley links in the repository's demo records were removed; no replacement performances were invented. These records show an honest unavailable state until configured.

YouTube uses a thumbnail facade and creates its `youtube-nocookie.com` iframe only after activation. No YouTube Data API key is needed. Third-party thumbnails can still contact YouTube before playback when no local poster is provided.

## Spotify

Paste an artist, album, track, playlist, show, or episode URL into either:

1. Admin → Content → Social → Spotify URL, or
2. `NEXT_PUBLIC_SPOTIFY_URL` in the deployment environment, or
3. `src/config/media.ts → spotifyUrl`.

Admin content takes precedence. No Spotify API key is needed for this widget. URLs are validated against `https://open.spotify.com` and converted to embed URLs; arbitrary iframe origins are rejected.

The player reserves 352px of height and connects only after the visitor presses “Load Spotify player.” Until an actual URL is supplied, it shows an unavailable state and a contact link; the social link is clearly labeled “Find on Spotify” and goes to a search, not an invented artist profile. A release link was not available during implementation.

## Instagram and social links

The existing Instagram profile `@Reza_Ohadi`, YouTube channel and SoundCloud URLs are preserved. Update them through Admin → Content → Social or `site_content.social`. Curated Instagram media records still appear on `/media`.

The gallery is local/database-driven; it is not presented as a live Instagram API feed. Automatic Instagram ingestion would require a separate authorized integration and server-side token. Do not place access tokens in client code.

SVG brand marks live in `public/assets/icons/`. They come from [Simple Icons](https://github.com/simple-icons/simple-icons), whose icon assets are CC0; trademark rights and the platforms' brand guidelines still apply.

## Contact and secret keys

Home and `/contact` share the existing validated server action. Form fields have explicit labels, error descriptions, focus handling, and pending/success/error announcements. Unsent messages no longer produce a false “sent” confirmation when delivery is unconfigured.

Configure the existing `RESEND_API_KEY`, `EMAIL_FROM`, and `CONTACT_TO_EMAIL` on the server for delivery. Existing Supabase and Stripe variables are unchanged; see the main README and `.env.example`. Never put secrets in `NEXT_PUBLIC_*`, public JSON, or this media configuration file.

## Motion, accessibility and performance

- Fixed navigation changes surface, padding and position without moving document content.
- IntersectionObserver drives homepage section highlighting.
- Native dialogs provide modal focus containment, Escape and focus restoration; the photo viewer also supports arrow keys.
- CSS/native section reveals preserve server-visible content and honor `prefers-reduced-motion`.
- The old page-covering curtain and permanent grain overlay are no longer used.
- Images and embeds reserve geometry; the hero is prioritized.
- Existing routes, metadata, sitemap, robots and purchase flows retain their structure.

Automated checks cover media URL parsing, gallery generation and the new palette's AA text contrast. TypeScript and production compilation are checked separately. No browser-based WCAG audit, screen-reader audit, Lighthouse run, or field CLS measurement was performed. CLS below 0.1 is a target, not a measured guarantee; confirm on the deployed site with real photographs, fonts, embeds and production data. Other pre-existing UI flows may require a separate full accessibility audit.

## Deployment

This repository targets the existing Next.js/Vercel environment and its configured Supabase, Stripe and Resend services. It has no Sites manifest or Cloudflare-compatible Worker output. A hosting migration or static export would change server actions and commerce behavior, so neither was performed as part of this frontend refactor. No production deployment, domain change, database write, payment, or test email was made.

Deploy the reviewed changes through the existing hosting project, preserving its environment variables and `NEXT_PUBLIC_SITE_URL=https://rezaohadi.com`. The local preview uses demo data because production credentials are not present.

References: [Spotify embeds](https://developer.spotify.com/documentation/embeds/tutorials/creating-an-embed), [YouTube player parameters](https://developers.google.com/youtube/player_parameters).
