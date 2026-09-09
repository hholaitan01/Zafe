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

-- ============================================================================
-- Zafe — `settlement_approvals` table (dual control for large settlements).
--
-- ONE ROW PER APPROVAL: (key, fingerprint, approver). Above a configurable
-- threshold, a discretionary money-move (an escalated dispute ruling) needs two
-- distinct admins to approve the SAME ruling before it executes (audit #17).
-- `key` is the settlement scope ("dispute:<dealId>"), `fingerprint` pins the
-- exact decision (decision + split), `approver` is one admin's email. Quorum is
-- a distinct-approver count for the current fingerprint.
--
-- The composite PRIMARY KEY makes each approval a single idempotent insert (a
-- repeat by the same admin is a no-op), so two admins approving at the same
-- instant insert two separate rows and NEITHER can overwrite the other — closing
-- the lost-update race the v3 recheck flagged in the earlier array-column form.
-- Rows for a scope are deleted once the settlement executes.
--
-- NOTE for existing deployments: an earlier version of this table had columns
-- (key primary key, fingerprint, approvers text[]). Its shape is incompatible,
-- so drop it before creating the new one. Approval rows are transient (created
-- just before a settlement and cleared on execution), so nothing durable is lost.
drop table if exists public.settlement_approvals;
-- ============================================================================

create table if not exists public.settlement_approvals (
  key         text        not null,            -- "dispute:<dealId>"; the approval scope
  fingerprint text        not null,            -- the exact ruling approved (decision + split)
  approver    text        not null,            -- one admin's email (lowercased)
  created_at  timestamptz not null default now(),
  primary key (key, fingerprint, approver)
);

create index if not exists settlement_approvals_key_fp_idx on public.settlement_approvals (key, fingerprint);

-- Same posture as the rest: server writes with the service-role key; the anon
-- key gets no access. No browser reads this table, so no read policy.
alter table public.settlement_approvals enable row level security;
