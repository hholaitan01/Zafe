-- ============================================================================
-- Zafe — `sellers` table (per-seller verification + payout account).
--
-- Run in the Supabase SQL editor, alongside deals + reputations. Persists a
-- seller's verification status and payout bank account, keyed by their email,
-- so it survives across devices and the release can resolve where to pay them.
-- ============================================================================

create table if not exists public.sellers (
  email       text primary key,                 -- normalised (lower-cased) email
  full_name   text,
  phone       text,
  id_verified boolean     not null default false,
  payout      jsonb,                             -- { bankName, accountNumber, accountName }
  payout_updated_at timestamptz,                 -- when the payout ACCOUNT last changed (drives the cooldown)
  updated_at  timestamptz not null default now()
);

-- If the table predates the payout cooldown, add the column:
alter table public.sellers add column if not exists payout_updated_at timestamptz;

-- Same posture as deals/reputations: the server writes with the service-role
-- key (bypasses RLS); the browser's anon key gets no access.
alter table public.sellers enable row level security;

-- ============================================================================
-- `payout_change_otps` — the one-time code that confirms a payout-account change.
--
-- One active code per seller email. Stored HASHED and tied to the fingerprint of
-- the NEW account, so a code can't be replayed against a different account. The
-- server writes with the service-role key; the anon key gets no access.
-- ============================================================================
create table if not exists public.payout_change_otps (
  email       text primary key,                 -- normalised seller email
  code_hash   text        not null,             -- sha256(email:code)
  fingerprint text        not null,             -- the new account this code authorises
  expires_at  timestamptz not null
);
alter table public.payout_change_otps enable row level security;
