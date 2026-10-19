-- ============================================================================
--  Reza Ohadi — Account security emails (additive migration)
--  Run AFTER accounts.sql. Safe to re-run.
--
--  Adds what the welcome, new sign-in and password emails need:
--    profiles.welcomed_at   — set once the welcome email has gone out
--    member_devices         — the browsers each member has signed in from
--    password_codes         — one-time codes for members who set a first
--                             password without having one to confirm
--  All three are written by the server with the service role only. Members
--  never read or write them from the browser (RLS on, no policies).
-- ============================================================================

-- Existing members are marked as welcomed now, so only accounts created from
-- here on receive the welcome email.
alter table public.profiles add column if not exists welcomed_at timestamptz;
update public.profiles set welcomed_at = now() where welcomed_at is null;

create table if not exists public.member_devices (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  -- Random id kept in a long-lived cookie; a cleared browser counts as new.
  device_id     text not null,
  browser       text,
  location      text,
  ip            text,
  user_agent    text,
  first_seen_at timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  unique (user_id, device_id)
);
create index if not exists member_devices_user_idx on public.member_devices(user_id);
alter table public.member_devices enable row level security;

create table if not exists public.password_codes (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  -- sha256 of the code, never the code itself.
  code_hash  text not null,
  expires_at timestamptz not null,
  attempts   integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.password_codes enable row level security;
