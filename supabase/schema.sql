-- TrustFlow AI — Supabase schema
-- Run in the Supabase SQL editor, in order.

create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid references auth.users(id) unique,
  email text unique not null,
  full_name text not null,
  phone text,
  bank_code text,
  account_number text,
  account_name text,
  trust_score integer default 50,
  total_transactions integer default 0,
  successful_transactions integer default 0,
  disputes_filed integer default 0,
  bvn_nin_verified boolean default false, -- required before a seller can receive payouts
  created_at timestamptz default now()
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references users(id),
  seller_id uuid references users(id),
  amount numeric not null,
  item_description text not null,
  status text default 'PENDING_PAYMENT'
    check (status in (
      'PENDING_PAYMENT','FUNDED','SHIPPED','DELIVERED',
      'CONFIRMED','DISPUTED','REFUNDED','PARTIALLY_REFUNDED','RELEASED'
    )),
  transaction_ref text unique not null,
  chat_text text, -- pasted chat, analyzed by the AI once funds land
  virtual_account_number text, -- ALATPay one-time collection account
  virtual_account_expires_at timestamptz, -- our own tighter ~10 min window
  alat_transaction_id text, -- ALATPay's own transaction id, for status re-queries
  trust_score integer,
  risk_level text check (risk_level in ('LOW','MEDIUM','HIGH')),
  risk_reasons jsonb,
  tracking_number text,
  estimated_delivery timestamptz,
  delivered_at timestamptz,
  confirmed_at timestamptz,
  release_method text check (release_method in ('buyer_confirm','handover_code','auto_release')),
  payout_ref text,
  partial_refund_amount numeric,
  created_at timestamptz default now()
);

create table if not exists disputes (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references transactions(id),
  initiated_by uuid references users(id),
  reason text not null,
  buyer_evidence text,
  seller_evidence text,
  ai_recommendation text check (ai_recommendation in
    ('RELEASE','PARTIAL_REFUND','FULL_REFUND','PENDING')),
  ai_reasoning text,
  resolution text,
  resolved_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists chat_analyses (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references transactions(id),
  raw_text text not null,
  flags jsonb,
  scam_probability numeric,
  analysis_summary text,
  created_at timestamptz default now()
);

-- Called after a successful payout (Day 4, Jerry) to keep the seller's
-- own Trust Score inputs current for their NEXT transaction.
create or replace function increment_seller_success(seller_id uuid)
returns void as $$
begin
  update users
  set total_transactions = total_transactions + 1,
      successful_transactions = successful_transactions + 1
  where id = seller_id;
end;
$$ language plpgsql;

-- Called after a refund (Day 5, Jerry) — a refund means the seller's
-- delivery didn't hold up, so it counts against their history.
create or replace function increment_seller_disputes(seller_id uuid)
returns void as $$
begin
  update users
  set total_transactions = total_transactions + 1,
      disputes_filed = disputes_filed + 1
  where id = seller_id;
end;
$$ language plpgsql;

-- Row Level Security
alter table users enable row level security;
alter table transactions enable row level security;
alter table disputes enable row level security;
alter table chat_analyses enable row level security;

create policy "users can view own profile" on users
  for select using (auth.uid() = auth_id);
create policy "users can update own profile" on users
  for update using (auth.uid() = auth_id);

create policy "buyer or seller can view their transactions" on transactions
  for select using (
    auth.uid() in (
      select auth_id from users where id = buyer_id
      union
      select auth_id from users where id = seller_id
    )
  );
create policy "buyer can create transactions" on transactions
  for insert with check (
    auth.uid() = (select auth_id from users where id = buyer_id)
  );

create policy "parties can view their disputes" on disputes
  for select using (
    auth.uid() in (
      select u.auth_id from users u
      join transactions t on t.id = disputes.transaction_id
      where u.id = t.buyer_id or u.id = t.seller_id
    )
  );
