-- ============================================================================
--  Reza Ohadi — OPTIONAL seed data
--  Mirrors the built-in placeholder catalogue so the DB-backed site looks the
--  same as demo mode. Run AFTER schema.sql. Image paths point at the bundled
--  /public/placeholders assets, so they work before you upload real media.
--  Replace everything here with real content via the admin dashboard.
-- ============================================================================

insert into public.products
  (slug, title, composer, short_description, long_description, price_cents, currency,
   difficulty, instrument, genre, mood, duration_seconds, pages, cover_image,
   preview_images, published, featured, related_slugs)
values
  ('nocturne-in-ash', 'Nocturne in Ash', 'Reza Ohadi',
   'A slow nocturne built from a single recurring motif, dissolving into silence.',
   'Nocturne in Ash unfolds like a memory at the edge of sleep. [PLACEHOLDER]',
   999, 'usd', 'Intermediate', 'Solo Piano', 'Contemporary Classical', 'Introspective · Nocturnal',
   245, 6, '/placeholders/cover-1.svg',
   '["/placeholders/preview-1.svg","/placeholders/preview-2.svg","/placeholders/preview-3.svg"]'::jsonb,
   true, true, '["veil-of-snow","the-quiet-hour"]'::jsonb),

  ('veil-of-snow', 'Veil of Snow', 'Reza Ohadi',
   'Crystalline arpeggios and suspended harmonies evoking first snowfall.',
   'Veil of Snow is a study in stillness and shimmer. [PLACEHOLDER]',
   799, 'usd', 'Beginner', 'Solo Piano', 'Contemporary Classical', 'Serene · Luminous',
   198, 4, '/placeholders/cover-2.svg',
   '["/placeholders/preview-2.svg","/placeholders/preview-1.svg"]'::jsonb,
   true, false, '["nocturne-in-ash"]'::jsonb),

  ('the-quiet-hour', 'The Quiet Hour', 'Reza Ohadi',
   'An intimate meditation for the hour before dawn — sparse, warm, unhurried.',
   'The Quiet Hour sits between waking and dreaming. [PLACEHOLDER]',
   899, 'usd', 'Intermediate', 'Solo Piano', 'Cinematic', 'Tender · Still',
   222, 5, '/placeholders/cover-3.svg',
   '["/placeholders/preview-3.svg","/placeholders/preview-1.svg"]'::jsonb,
   true, false, '["nocturne-in-ash"]'::jsonb)
on conflict (slug) do nothing;

insert into public.gallery_images (image_url, caption, location, sort_order, width, height) values
  ('/placeholders/gallery-1.svg', 'Rehearsal, late evening', 'Studio A', 1, 1000, 1300),
  ('/placeholders/gallery-2.svg', 'Soundcheck', 'Concert Hall', 2, 1300, 950),
  ('/placeholders/gallery-3.svg', 'Hands at rest', null, 3, 1100, 1100),
  ('/placeholders/gallery-4.svg', 'Before the recital', 'Recital Hall', 4, 1000, 1300)
on conflict do nothing;

-- Editable site content. The app deep-merges these over the built-in defaults,
-- so you only need to store the keys you want to override.
insert into public.site_content (key, value) values
  ('social', '{
     "instagram":"https://www.instagram.com/reza_ohadi/",
     "youtube":"https://www.youtube.com/channel/UCtC_REvBHwkt6FNmxk6cEUQ",
     "soundcloud":"https://soundcloud.com/rezaohadi",
     "email":"rezaohadi.music@gmail.com"
   }'::jsonb),
  ('home', '{
     "artistStatement":"[PLACEHOLDER artist statement — edit in the admin dashboard.]",
     "featuredProductSlug":"nocturne-in-ash"
   }'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();
