-- ============================================================================
--  Reza Ohadi — Anti-spam rate limiting (additive migration)
--  Run AFTER accounts.sql. Safe to re-run.
--
--  Adds a tiny per-IP fixed-window counter used to throttle the contact form
--  and new sign-ups. Written only by the server (service role); members never
--  touch it (RLS on, no policies). The rate_hit() function is SECURITY DEFINER
--  so it runs with the owner's rights despite RLS.
--
--  If this migration is NOT run, the app degrades gracefully: the rate-limit
--  helper logs "skipped" and allows the request (Turnstile + honeypot + the
--  timing trap still apply).
-- ============================================================================

create table if not exists public.rate_limits (
  scope        text not null,          -- "contact" | "signup" | …
  ip           text not null,          -- caller IP (or "unknown")
  window_start timestamptz not null,   -- start of the fixed window
  count        integer not null default 0,
  primary key (scope, ip, window_start)
);
alter table public.rate_limits enable row level security;

-- Count one hit and report whether the caller is still under the limit.
-- Fixed window of p_window_seconds; returns true while allowed, false once the
-- limit is exceeded within the current window.
create or replace function public.rate_hit(
  p_scope          text,
  p_ip             text,
  p_window_seconds integer,
  p_limit          integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  w timestamptz := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );
  c integer;
begin
  insert into public.rate_limits (scope, ip, window_start, count)
  values (p_scope, p_ip, w, 1)
  on conflict (scope, ip, window_start)
  do update set count = public.rate_limits.count + 1
  returning count into c;

  -- Opportunistic cleanup so the table never grows without bound.
  delete from public.rate_limits where window_start < now() - interval '1 day';

  return c <= p_limit;
end;
$$;

revoke all on function public.rate_hit(text, text, integer, integer) from public, anon, authenticated;
