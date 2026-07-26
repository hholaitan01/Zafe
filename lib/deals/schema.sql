-- ============================================================================
-- TrustFlow — `deals` table (for Jerry, when wiring up Supabase).
--
-- Run this in the Supabase SQL editor. Once NEXT_PUBLIC_SUPABASE_URL and the
-- server-only SUPABASE_SERVICE_ROLE_KEY are set, the deal store switches from
-- the in-memory demo store to this table automatically — no app code change.
-- ============================================================================

create table if not exists public.deals (
  id          uuid primary key default gen_random_uuid(),
  reference   text        not null,
  item        jsonb       not null,          -- { title, amount, currency }
  seller      jsonb       not null,          -- SellerProfile + optional id
  buyer_email text,
  chat        text,
  status      text        not null default 'created',
  trust       jsonb,                         -- { score, verdict, headline }
  timeline    jsonb       not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists deals_created_at_idx on public.deals (created_at desc);

-- The server routes talk to this table with the service-role key, which
-- bypasses RLS. If you later expose the table to the browser client, enable
-- RLS and add per-user policies (e.g. buyer_email = auth.email()).
-- alter table public.deals enable row level security;
