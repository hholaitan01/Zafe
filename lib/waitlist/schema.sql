-- ============================================================================
-- Zafe — `waitlist` table. Pre-launch sign-ups with a referral queue.
--
-- Run in the Supabase SQL editor. Safe to run more than once. If you already
-- created `waitlist`, the ALTERs below add the referral columns.
--
-- Security posture (same as the rest of Zafe):
--   • RLS is ENABLED with NO policies, so the browser anon key can neither read
--     nor write. All access goes through the server with the service-role key.
--   • Minimal PII: email is required; name is optional.
-- ============================================================================

create table if not exists public.waitlist (
  email       text primary key,                 -- normalised (lower-cased, trimmed)
  name        text,                              -- optional
  source      text,                              -- where they joined, e.g. 'waitlist'
  code        text,                              -- this sign-up's referral code
  referred_by text,                              -- the code of whoever referred them
  created_at  timestamptz not null default now()
);

alter table public.waitlist
  add column if not exists code        text,
  add column if not exists referred_by text;

-- Backfill a unique referral code for any row added before these columns
-- existed. Without this, a legacy sign-up has a NULL code and re-joining would
-- collide on the primary key. gen_random_uuid() is built in on Supabase; the
-- first 8 hex chars match the app's code format.
update public.waitlist
   set code = substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)
 where code is null;

-- Unique referral code (partial index so any remaining NULLs are still allowed).
create unique index if not exists waitlist_code_key on public.waitlist (code) where code is not null;

alter table public.waitlist enable row level security;
-- No policies on purpose: server-only access via the service-role key.
