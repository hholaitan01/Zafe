-- ============================================================================
-- Zafe — `audit_log` table (admin action trail).
--
-- Append-only record of every privileged action a human takes: dispute
-- resolutions, settlement re-drives, account deactivations. Keyed to the
-- actor's email and role at the time, with action-specific detail in `meta`.
-- Run in the Supabase SQL editor alongside the other schemas.
-- ============================================================================

create table if not exists public.audit_log (
  id          text        primary key,        -- unique per entry
  at          timestamptz not null default now(),
  actor_email text        not null,            -- who did it
  actor_role  text,                            -- their admin role at the time
  action      text        not null,            -- 'dispute.resolve' | 'settlement.retry' | 'account.deactivate'
  target      text,                            -- deal id, settlement key, or user id acted on
  meta        jsonb                            -- action-specific detail
);

create index if not exists audit_log_at_idx on public.audit_log (at desc);
create index if not exists audit_log_actor_idx on public.audit_log (actor_email);
create index if not exists audit_log_action_idx on public.audit_log (action);

-- Same posture as the rest: the server writes with the service-role key; the
-- anon key in the browser gets no access. No browser reads this table, so no
-- read policy. The log is append-only by convention (the app never updates or
-- deletes rows); enforce it with a policy or trigger if you want it at the DB.
alter table public.audit_log enable row level security;
