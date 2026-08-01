-- ============================================================================
-- TrustFlow — `profiles` table (a user's editable name parts).
--
-- Run in the Supabase SQL editor, alongside deals + reputations + sellers.
-- Stores the user's First / Other / Last name, keyed by email, so their edits
-- follow them across devices.
-- ============================================================================

create table if not exists public.profiles (
  email       text primary key,                 -- normalised (lower-cased) email
  first_name  text,
  other_names text,
  last_name   text,
  updated_at  timestamptz not null default now()
);

-- Same posture as the other tables: the server writes with the service-role
-- key (bypasses RLS); the browser's anon key gets no access.
alter table public.profiles enable row level security;
