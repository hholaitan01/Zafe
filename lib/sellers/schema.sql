-- ============================================================================
-- TrustFlow — `sellers` table (per-seller verification + payout account).
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
  updated_at  timestamptz not null default now()
);

-- Same posture as deals/reputations: the server writes with the service-role
-- key (bypasses RLS); the browser's anon key gets no access.
alter table public.sellers enable row level security;
