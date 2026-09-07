-- ============================================================================
-- Zafe — `processed_events` table (payment idempotency).
--
-- Run this in the Supabase SQL editor, alongside deals (schema.sql). One row per
-- money event we have already acted on, keyed by the provider event id
-- (e.g. "paystack:999", "flutterwave:42"). The PRIMARY KEY is the whole point:
-- a concurrent re-delivery of the same event races on the insert, exactly one
-- wins, and the losers get a unique violation and are treated as duplicates.
-- That is what makes "process exactly once" hold across instances and restarts,
-- which an in-memory guard cannot do.
-- ============================================================================

create table if not exists public.processed_events (
  event_id   text        primary key,        -- provider event id; the dedup key
  context    text,                           -- optional: what kind of event
  created_at timestamptz not null default now()
);

-- Same posture as `deals` and `reputations`: the server writes with the
-- service-role key (which bypasses RLS); the public anon key in the browser
-- bundle gets no access. No browser ever reads this table, so no read policy.
alter table public.processed_events enable row level security;
