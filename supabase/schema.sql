-- Financial OS — Supabase schema for the alpha
--
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query → paste → Run)
-- on a fresh project. Mirrors the client-side types in lib/forecast.ts
-- (RecurringTransaction, TransactionOverride) so the TypeScript data layer is
-- a straight mapping onto these tables. The `accounts` table below is legacy
-- (see the "accounts — LEGACY" note on its definition).
--
-- Every table is scoped to auth.uid() via Row Level Security — a signed-in user can
-- only ever see or modify their own rows. There is no server-side bypass in this app;
-- the anon public key is safe to ship to the browser precisely because these policies
-- are what actually enforce access, not the key itself.

-- ---------------------------------------------------------------------------
-- accounts — LEGACY (issue #61: collapsed to a single spendable pool). The
-- app no longer reads or writes this table at all; `user_settings.current_balance`
-- is the one pool's balance now. Kept in place, unused, for a follow-up drop
-- migration (see the "legacy accounts drop" ALTER/DROP block at the bottom
-- of this file for the DB-engineer handoff) rather than an irreversible drop
-- bundled with this deploy.
-- ---------------------------------------------------------------------------
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null check (type in ('checking', 'savings', 'other')),
  custom_type text,
  balance numeric not null default 0,
  start_date date,
  created_at timestamptz not null default now()
);

create index if not exists accounts_user_id_idx on public.accounts (user_id);

alter table public.accounts enable row level security;

create policy "accounts_select_own" on public.accounts
  for select using ((select auth.uid()) = user_id);
create policy "accounts_insert_own" on public.accounts
  for insert with check ((select auth.uid()) = user_id);
create policy "accounts_update_own" on public.accounts
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "accounts_delete_own" on public.accounts
  for delete using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- transactions (RecurringTransaction)
-- ---------------------------------------------------------------------------
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  amount numeric not null,
  start_date date not null,
  end_date date,
  frequency text not null check (
    frequency in ('daily', 'weekly', 'biweekly', 'semimonthly', 'monthly', 'quarterly', 'yearly', 'onetime')
  ),
  category text not null check (
    category in ('income', 'fixed-expense', 'subscription', 'liability', 'savings')
  ),
  semi_monthly_days integer[],
  notes text,

  -- Legacy account-linkage columns (issue #61: collapsed to a single
  -- spendable pool — no more per-account routing). The app no longer reads
  -- or writes these. Kept here, unused, until a follow-up migration drops
  -- them alongside the `accounts` table itself.
  account_id uuid references public.accounts (id) on delete set null,
  funding_account_id uuid references public.accounts (id) on delete set null,
  target_account_id uuid references public.accounts (id) on delete set null,

  -- Legacy liability-payoff fields — the app no longer reads or writes any of
  -- these (see issue #60: liabilities are now plain recurring payments with
  -- no balance/interest/APR/credit-limit tracking). Kept here, unused, until
  -- a follow-up migration drops them; see the "legacy liability column drop"
  -- ALTER TABLE block below for the DB-engineer handoff.
  liability_type text check (
    liability_type in ('card', 'loan', 'line_of_credit', 'one_time')
  ),
  interest_rate numeric,
  current_balance numeric,
  starting_balance numeric,
  credit_limit numeric,
  minimum_payment numeric,
  balance_transfer_fee numeric,
  balance_transfer_fee_min numeric,
  promo_rate numeric,
  promo_end_date date,
  minimum_payment_calc text check (
    minimum_payment_calc in ('fixed', 'percent_principal', 'percent_principal_interest')
  ),

  day_of_month text,
  -- Liability-only: whether this due date can be nudged a few days.
  -- Consumed by a later guidance-shell issue.
  movable_due_date boolean,

  -- Savings-only: free-form user-entered tags (e.g. "Trip", "Christmas") for
  -- purpose-tracking a savings contribution stream. Purely organizational —
  -- no forecast/date-math reads this column. See issue #63.
  tags text[],

  created_at timestamptz not null default now()
);

create index if not exists transactions_user_id_idx on public.transactions (user_id);
create index if not exists transactions_account_id_idx on public.transactions (account_id);
create index if not exists transactions_funding_account_id_idx on public.transactions (funding_account_id);
create index if not exists transactions_target_account_id_idx on public.transactions (target_account_id);

alter table public.transactions enable row level security;

create policy "transactions_select_own" on public.transactions
  for select using ((select auth.uid()) = user_id);
create policy "transactions_insert_own" on public.transactions
  for insert with check ((select auth.uid()) = user_id);
create policy "transactions_update_own" on public.transactions
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "transactions_delete_own" on public.transactions
  for delete using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- transaction_overrides
-- ---------------------------------------------------------------------------
create table if not exists public.transaction_overrides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  transaction_id uuid not null references public.transactions (id) on delete cascade,
  date_str date not null,
  status text not null check (status in ('verified', 'skipped', 'modified', 'split')),
  custom_amount numeric,
  created_at timestamptz not null default now(),

  -- matches the app's lookup: overrides.find(o => o.transactionId === t.id && o.dateStr === dayStr)
  unique (transaction_id, date_str)
);

create index if not exists transaction_overrides_user_id_idx on public.transaction_overrides (user_id);

alter table public.transaction_overrides enable row level security;

create policy "overrides_select_own" on public.transaction_overrides
  for select using ((select auth.uid()) = user_id);
create policy "overrides_insert_own" on public.transaction_overrides
  for insert with check ((select auth.uid()) = user_id);
create policy "overrides_update_own" on public.transaction_overrides
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "overrides_delete_own" on public.transaction_overrides
  for delete using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- transaction_override_splits — sub-payments for a split override row
-- ---------------------------------------------------------------------------
create table if not exists public.transaction_override_splits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  override_id uuid not null references public.transaction_overrides (id) on delete cascade,
  amount numeric not null,
  date_str date not null,
  created_at timestamptz not null default now()
);

create index if not exists transaction_override_splits_user_id_idx on public.transaction_override_splits (user_id);
create index if not exists transaction_override_splits_date_idx on public.transaction_override_splits (date_str);

alter table public.transaction_override_splits enable row level security;

create policy "override_splits_select_own" on public.transaction_override_splits
  for select using ((select auth.uid()) = user_id);
create policy "override_splits_insert_own" on public.transaction_override_splits
  for insert with check ((select auth.uid()) = user_id);
create policy "override_splits_update_own" on public.transaction_override_splits
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "override_splits_delete_own" on public.transaction_override_splits
  for delete using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- user_settings — replaces the old "0 accounts = show onboarding" heuristic
-- and the launch-date-in-localStorage bug with a real per-user record.
-- ---------------------------------------------------------------------------
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  launch_date date,
  onboarding_completed boolean not null default false,
  current_balance numeric,
  low_balance_alert numeric,
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

create policy "user_settings_select_own" on public.user_settings
  for select using ((select auth.uid()) = user_id);
create policy "user_settings_insert_own" on public.user_settings
  for insert with check ((select auth.uid()) = user_id);
create policy "user_settings_update_own" on public.user_settings
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "user_settings_delete_own" on public.user_settings
  for delete using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- hardening: Supabase provisions every new project with an event-trigger
-- helper, public.rls_auto_enable(), that isn't part of this app's schema.
-- It's a SECURITY DEFINER function and Postgres exposes it to PostgREST as
-- a callable RPC by default, which Supabase's own advisor flags even though
-- the function is inert outside of event-trigger context. Lock it down if
-- present; no-op (and no error) on projects where it doesn't exist.
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'rls_auto_enable'
  ) then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Migration handoff (issue #60) — for the DB-engineer to run against the
-- live project. `create table if not exists` above only affects fresh
-- installs; an existing `public.transactions` table needs these applied
-- directly.
-- ---------------------------------------------------------------------------

-- 1. Apply now — new column the app writes to as of this issue:
alter table public.transactions add column if not exists movable_due_date boolean;

-- 2. FOLLOW-UP ONLY — do not run yet. The app no longer reads or writes any
--    of these columns (superseded by the plain-payment liability model), but
--    they're left in place for one release cycle in case a rollback is
--    needed. Drop once #60 has been live without incident:
--
-- alter table public.transactions drop column if exists liability_type;
-- alter table public.transactions drop column if exists interest_rate;
-- alter table public.transactions drop column if exists current_balance;
-- alter table public.transactions drop column if exists starting_balance;
-- alter table public.transactions drop column if exists credit_limit;
-- alter table public.transactions drop column if exists minimum_payment;
-- alter table public.transactions drop column if exists balance_transfer_fee;
-- alter table public.transactions drop column if exists balance_transfer_fee_min;
-- alter table public.transactions drop column if exists promo_rate;
-- alter table public.transactions drop column if exists promo_end_date;
-- alter table public.transactions drop column if exists minimum_payment_calc;

-- ---------------------------------------------------------------------------
-- Migration handoff (issue #61) — collapse to a single spendable pool.
-- `create table if not exists` above only affects fresh installs; an
-- existing live project needs these applied directly.
-- ---------------------------------------------------------------------------

-- 1. Apply now — the transactions.category check constraint on a live
--    project still allows 'transfer'; tighten it to match the app (only
--    needed if the live constraint predates this issue — safe to re-run):
alter table public.transactions drop constraint if exists transactions_category_check;
alter table public.transactions add constraint transactions_category_check
  check (category in ('income', 'fixed-expense', 'subscription', 'liability', 'savings'));

-- 2. FOLLOW-UP ONLY — do not run yet. The app no longer reads or writes the
--    accounts table or these linkage columns at all (superseded by the
--    single-pool model driven by user_settings.current_balance). Left in
--    place for one release cycle in case a rollback is needed. Drop once
--    #61 has been live without incident:
--
-- alter table public.transactions drop column if exists account_id;
-- alter table public.transactions drop column if exists funding_account_id;
-- alter table public.transactions drop column if exists target_account_id;
-- drop table if exists public.accounts;

-- ---------------------------------------------------------------------------
-- Migration handoff (issue #63) — free-form user tags on savings
-- contributions, replacing the removed savings account picker (issue #61).
-- `create table if not exists` above only affects fresh installs; an
-- existing live project needs this applied directly.
-- ---------------------------------------------------------------------------

-- Apply now — new column the app writes to as of this issue:
alter table public.transactions add column if not exists tags text[];
