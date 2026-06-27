-- ============================================================================
--  Reza Ohadi — Supabase Storage buckets + policies
--  Run AFTER schema.sql (it depends on public.is_admin()).
-- ============================================================================

-- Buckets ---------------------------------------------------------------------
-- public-assets : cover art, preview pages, gallery, portraits (publicly readable)
-- scores        : original PDFs (PRIVATE — signed URLs only)
insert into storage.buckets (id, name, public)
values ('public-assets', 'public-assets', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('scores', 'scores', false)
on conflict (id) do nothing;

-- Policies on storage.objects -------------------------------------------------
-- Public assets: anyone can read.
drop policy if exists "public assets read" on storage.objects;
create policy "public assets read" on storage.objects
  for select using (bucket_id = 'public-assets');

-- Public assets: only admins can write/replace/delete.
drop policy if exists "public assets admin write" on storage.objects;
create policy "public assets admin write" on storage.objects
  for all using (bucket_id = 'public-assets' and public.is_admin())
  with check (bucket_id = 'public-assets' and public.is_admin());

-- Scores (private): only admins may manage via authenticated clients.
-- NOTE: the app's server routes use the SERVICE ROLE key, which bypasses RLS,
-- to read scores and mint signed URLs. No anon/auth read policy exists, so the
-- PDFs are never publicly accessible.
drop policy if exists "scores admin manage" on storage.objects;
create policy "scores admin manage" on storage.objects
  for all using (bucket_id = 'scores' and public.is_admin())
  with check (bucket_id = 'scores' and public.is_admin());
