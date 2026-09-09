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

-- ============================================================================
-- Zafe — `settlement_operations` table (money-move claim + durable state).
--
-- One row per money-move: the key "payout:<dealId>" / "refund:<dealId>" is both
-- the claim lock and the ledger ref, so a deal has at most one payout and one
-- refund. Before moving money, a caller claims the row; the PRIMARY KEY makes
-- concurrent first attempts race on the insert (exactly one wins), and a
-- failed or stale-pending row is reclaimed by a compare-and-swap on
-- (state, updated_at). The state survives a crash: a succeeded row short-
-- circuits any retry (no double transfer), and a pending row abandoned past the
-- stale window is reclaimable, so one crash never freezes a deal's money.
-- ============================================================================

create table if not exists public.settlement_operations (
  key         text        primary key,        -- "payout:<dealId>" / "refund:<dealId>"; the claim lock
  deal_id     text        not null,
  kind        text        not null,            -- 'payout' | 'refund'
  state       text        not null,            -- 'pending' | 'succeeded' | 'failed'
  ref         text,                            -- provider/ledger ref once it succeeds
  error       text,                            -- last failure reason, for the exception queue
  attempts    int         not null default 0,  -- how many times the move has been attempted
  owner_token text,                            -- the current attempt's token; complete/fail must match it (audit #10)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Existing deployments: add the ownership token column if the table predates it.
-- complete/fail gate on (owner_token, state='pending') so a reclaimed-over attempt
-- can never overwrite the new owner's outcome (audit #10).
alter table public.settlement_operations add column if not exists owner_token text;

create index if not exists settlement_operations_deal_id_idx on public.settlement_operations (deal_id);
create index if not exists settlement_operations_state_idx on public.settlement_operations (state);

-- Same posture as the rest: server writes with the service-role key; the anon
-- key gets no access. No browser reads this table, so no read policy.
alter table public.settlement_operations enable row level security;
