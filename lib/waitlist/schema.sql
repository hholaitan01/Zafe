-- ============================================================================
-- Zafe — `waitlist` table. Pre-launch email sign-ups.
--
-- Run in the Supabase SQL editor. Safe to run more than once.
--
-- Security posture (same as the rest of Zafe):
--   • RLS is ENABLED with NO policies, so the browser anon key can neither read
--     nor write. All access goes through the server with the service-role key.
--   • Only an email is required. Name and source are optional. Minimal PII, in
--     keeping with NDPA data-minimisation.
-- ============================================================================

create table if not exists public.waitlist (
  email       text primary key,                 -- normalised (lower-cased, trimmed)
  name        text,                              -- optional
  source      text,                              -- where they joined, e.g. 'waitlist', 'pitch'
  created_at  timestamptz not null default now()
);

alter table public.waitlist enable row level security;
-- No policies on purpose: server-only access via the service-role key.
