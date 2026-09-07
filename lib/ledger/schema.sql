-- ============================================================================
-- Zafe — `ledger_entries` table (internal double-entry ledger).
--
-- Run this in the Supabase SQL editor, alongside the other tables. One row per
-- money-move (fund / payout / refund), keyed by a deterministic `ref`
-- (e.g. "fund:<dealId>"). The PRIMARY KEY on `ref` makes recording idempotent:
-- a retried webhook or payout inserts the same ref and is a no-op.
--
-- `legs` is the double-entry detail: an array of { account, amount } whose
-- signed amounts sum to zero (see lib/ledger/types.ts). The ledger is
-- append-only — entries are never updated or deleted; a correction is a new,
-- balancing entry.
-- ============================================================================

create table if not exists public.ledger_entries (
  ref        text        primary key,        -- deterministic per move; the dedup key
  deal_id    text        not null,
  kind       text        not null,           -- fund | payout | refund
  legs       jsonb       not null,           -- [{ account, amount }], signed, sum = 0
  memo       text,
  created_at timestamptz not null default now()
);

-- Look up a single deal's entries quickly (the receipt / deal timeline).
create index if not exists ledger_entries_deal_id_idx on public.ledger_entries (deal_id);

-- Same posture as `deals` and `reputations`: the server writes with the
-- service-role key (which bypasses RLS); the public anon key in the browser
-- bundle gets no access. No browser reads this table.
alter table public.ledger_entries enable row level security;
