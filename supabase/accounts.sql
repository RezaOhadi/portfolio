-- ============================================================================
--  Reza Ohadi — Member accounts (additive migration)
--  Run AFTER schema.sql. Safe to re-run.
--
--  Members use the SAME Supabase Auth as the admin. Nothing here changes how
--  admin access works: the admin gate is still ADMIN_EMAILS / profiles.role =
--  'admin' (see src/lib/auth.ts) and public.is_admin() is untouched.
-- ============================================================================

-- ----------------------------------------------------------------------------
--  profiles — a public handle and a display name for every member
-- ----------------------------------------------------------------------------
alter table public.profiles add column if not exists username     text;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists avatar_url   text;
alter table public.profiles add column if not exists updated_at   timestamptz not null default now();

-- 3-20 characters: letters, numbers, underscore. Unique regardless of case.
alter table public.profiles drop constraint if exists profiles_username_format;
alter table public.profiles add constraint profiles_username_format
  check (username is null or username ~ '^[A-Za-z0-9_]{3,20}$');
create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username));

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------------------
--  purchases — optional link to the member who owns the purchase
--  (guest purchases keep user_id null and are claimed by verified email)
-- ----------------------------------------------------------------------------
alter table public.purchases add column if not exists user_id uuid
  references auth.users(id) on delete set null;
create index if not exists purchases_user_idx on public.purchases(user_id);

-- Members may read their own purchases through the anon key + their session.
-- (The app reads them server-side with the service role; this is defence in
-- depth, and it adds nothing an admin could not already do.)
drop policy if exists "purchases self read" on public.purchases;
create policy "purchases self read" on public.purchases
  for select using (auth.uid() = user_id);

-- No self-update policy on profiles on purpose: username changes go through
-- the server (service role) after validation, so a member can never touch
-- their own role column.

-- ----------------------------------------------------------------------------
--  New-user trigger: same behaviour as before, plus the username chosen at
--  sign-up and the name/avatar Google provides. It never blocks a sign-up: if
--  anything about the extras fails, the plain profile row is created instead.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  wanted text := nullif(trim(new.raw_user_meta_data->>'username'), '');
  chosen text := null;
begin
  if wanted is not null
     and wanted ~ '^[A-Za-z0-9_]{3,20}$'
     and not exists (select 1 from public.profiles p where lower(p.username) = lower(wanted))
  then
    chosen := wanted;
  end if;

  insert into public.profiles (id, email, username, display_name, avatar_url)
  values (
    new.id,
    new.email,
    chosen,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict (id) do nothing;
  return new;
exception when others then
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep profiles.email in step when a user changes their email address.
create or replace function public.handle_user_email_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end; $$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();
