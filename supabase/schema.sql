-- ============================================================================
--  Reza Ohadi — Supabase schema
--  Run this in the Supabase SQL Editor (or `supabase db push`) on a new project.
--  Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE where possible.
-- ============================================================================

create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- ----------------------------------------------------------------------------
--  profiles — links auth users to an app role (admin gate)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  role        text not null default 'customer',  -- 'admin' | 'customer'
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
--  products — the sheet-music catalogue
-- ----------------------------------------------------------------------------
create table if not exists public.products (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique not null,
  title            text not null,
  composer         text not null default 'Reza Ohadi',
  short_description text default '',
  long_description text default '',
  price_cents      integer not null default 0,
  currency         text not null default 'usd',
  difficulty       text not null default 'Intermediate',
  instrument       text not null default 'Solo Piano',
  genre            text default '',
  mood             text default '',
  duration_seconds integer default 0,
  pages            integer default 0,
  cover_image      text,                       -- public URL
  preview_images   jsonb not null default '[]'::jsonb,  -- public URLs
  audio_preview_url text,
  youtube_url      text,
  instagram_url    text,
  pdf_path         text,                       -- PRIVATE storage path (scores bucket)
  published        boolean not null default false,
  featured         boolean not null default false,
  related_slugs    jsonb not null default '[]'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists products_published_idx on public.products(published);
create index if not exists products_slug_idx on public.products(slug);

-- ----------------------------------------------------------------------------
--  purchases — completed Stripe orders (private)
-- ----------------------------------------------------------------------------
create table if not exists public.purchases (
  id                    uuid primary key default gen_random_uuid(),
  product_id            uuid references public.products(id) on delete set null,
  product_slug          text,
  product_title         text,
  customer_email        text not null,
  stripe_session_id     text unique,
  stripe_payment_intent text,
  amount_cents          integer not null default 0,
  currency              text not null default 'usd',
  status                text not null default 'pending', -- pending|paid|refunded|failed
  download_token        uuid not null default gen_random_uuid(),
  created_at            timestamptz not null default now()
);
create index if not exists purchases_email_idx on public.purchases(lower(customer_email));
create index if not exists purchases_token_idx on public.purchases(download_token);

-- ----------------------------------------------------------------------------
--  gallery_images
-- ----------------------------------------------------------------------------
create table if not exists public.gallery_images (
  id          uuid primary key default gen_random_uuid(),
  image_url   text not null,
  caption     text,
  location    text,
  event_date  date,
  sort_order  integer not null default 0,
  width       integer default 1000,
  height      integer default 1000,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
--  site_content — key/value JSON for editable content
--  keys: 'social' | 'hero' | 'home' | 'bio' | 'media'
-- ----------------------------------------------------------------------------
create table if not exists public.site_content (
  key         text primary key,
  value       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

-- ============================================================================
--  Row Level Security
-- ============================================================================
alter table public.profiles       enable row level security;
alter table public.products       enable row level security;
alter table public.purchases      enable row level security;
alter table public.gallery_images enable row level security;
alter table public.site_content   enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- profiles: a user can read their own row; admins can read all.
drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

-- products: anyone can read PUBLISHED rows; admins can do everything.
drop policy if exists "products public read" on public.products;
create policy "products public read" on public.products
  for select using (published = true or public.is_admin());

drop policy if exists "products admin write" on public.products;
create policy "products admin write" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- gallery: public read; admin write.
drop policy if exists "gallery public read" on public.gallery_images;
create policy "gallery public read" on public.gallery_images
  for select using (true);
drop policy if exists "gallery admin write" on public.gallery_images;
create policy "gallery admin write" on public.gallery_images
  for all using (public.is_admin()) with check (public.is_admin());

-- site_content: public read; admin write.
drop policy if exists "content public read" on public.site_content;
create policy "content public read" on public.site_content
  for select using (true);
drop policy if exists "content admin write" on public.site_content;
create policy "content admin write" on public.site_content
  for all using (public.is_admin()) with check (public.is_admin());

-- purchases: NO public/anon access. Server uses the service-role key (bypasses
-- RLS). Admins may read via the dashboard.
drop policy if exists "purchases admin read" on public.purchases;
create policy "purchases admin read" on public.purchases
  for select using (public.is_admin());

-- ============================================================================
--  updated_at trigger for products
-- ============================================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

-- ============================================================================
--  Auto-create a profile when a user signs up.
--  Promote yourself afterwards:
--    update public.profiles set role = 'admin' where email = 'you@example.com';
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
