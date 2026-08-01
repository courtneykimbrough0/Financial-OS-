-- Financial OS — Supabase schema for the alpha
--
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query → paste → Run)
-- on a fresh project. Mirrors the client-side types in lib/forecast.ts (Account,
-- RecurringTransaction, TransactionOverride) so the TypeScript data layer is a
-- straight mapping onto these tables.
--
-- Every table is scoped to auth.uid() via Row Level Security — a signed-in user can
-- only ever see or modify their own rows. There is no server-side bypass in this app;
-- the anon public key is safe to ship to the browser precisely because these policies
-- are what actually enforce access, not the key itself.

-- ---------------------------------------------------------------------------
-- accounts
-- ---------------------------------------------------------------------------
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null check (type in ('checking', 'savings', 'credit-card', 'other')),
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
    category in ('income', 'fixed-expense', 'subscription', 'liability', 'savings', 'transfer')
  ),
  semi_monthly_days integer[],
  notes text,

  account_id uuid references public.accounts (id) on delete set null,
  funding_account_id uuid references public.accounts (id) on delete set null,
  target_account_id uuid references public.accounts (id) on delete set null,

  -- liability-only fields
  liability_type text check (
    liability_type in ('credit_card', 'revolving_loc', 'auto_loan', 'mortgage', 'personal_loan', 'student_loan', 'other')
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
  status text not null check (status in ('verified', 'skipped', 'modified')),
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
-- user_settings — replaces the old "0 accounts = show onboarding" heuristic
-- and the launch-date-in-localStorage bug with a real per-user record.
-- ---------------------------------------------------------------------------
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  launch_date date,
  onboarding_completed boolean not null default false,
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
