-- ============================================================================
-- TrustFlow — `reputations` table (per-user trader standing).
--
-- Run this in the Supabase SQL editor, alongside deals (schema.sql). The
-- reputation is always recomputed from the `deals` table on read; this table
-- just stores the latest snapshot so a trader's standing can be read back
-- cheaply and shown to a counterparty.
--
-- Persistence is best-effort in the app: if this table doesn't exist yet, the
-- reputation is still computed and returned — you just don't get the snapshot.
-- ============================================================================

create table if not exists public.reputations (
  email       text primary key,
  user_id     uuid,
  name        text,
  score       int         not null,
  tier        text        not null,
  factors     jsonb       not null default '[]'::jsonb,  -- the score breakdown
  stats       jsonb       not null default '{}'::jsonb,  -- raw signals
  summary     text,                                      -- one-line standing
  updated_at  timestamptz not null default now()
);

-- Same posture as `deals`: the server writes with the service-role key (which
-- bypasses RLS); the public anon key in the browser bundle gets no access. Add
-- a per-user read policy here later if the browser ever reads this directly
-- (e.g. `email = auth.email()`).
alter table public.reputations enable row level security;
