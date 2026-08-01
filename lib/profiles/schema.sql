-- ============================================================================
-- TrustFlow — `profiles` table (name parts, username, photo).
--
-- Run in the Supabase SQL editor, alongside deals + reputations + sellers.
-- Safe to run more than once. If you already created `profiles`, the ALTERs
-- below add the new username + photo columns.
-- ============================================================================

create table if not exists public.profiles (
  email       text primary key,                 -- normalised (lower-cased) email
  first_name  text,
  other_names text,
  last_name   text,
  username    text unique,                       -- normalised handle, for @username search
  photo       text,                              -- small data: URL
  updated_at  timestamptz not null default now()
);

alter table public.profiles
  add column if not exists username text,
  add column if not exists photo    text;

-- Unique handle (a partial index so multiple NULLs are allowed).
create unique index if not exists profiles_username_key on public.profiles (username) where username is not null;

alter table public.profiles enable row level security;
