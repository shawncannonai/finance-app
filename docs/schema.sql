-- Supabase schema for the finance app. Run once in the SQL editor.
--
-- The laptop is the source of truth for Plaid data and pushes here; the phone
-- reads here and writes only the two things a human decides: bucket overrides
-- and cash logs. Both flow back down to SQLite on the next push.
--
-- SECURITY, read this before running:
-- The anon key ships inside the built JavaScript. That is normal for Supabase
-- and safe ONLY because row level security decides everything. The policies
-- below are scoped to ONE email, not to "any authenticated user", because
-- Supabase allows public signup by default and a policy of `to authenticated`
-- would let anyone who signs up read this data.
-- Also turn signups off: Authentication > Sign In / Providers > disable
-- "Allow new users to sign up". Belt and braces.

-- Change this if the owning email ever changes.
create or replace function public.is_owner() returns boolean
language sql stable as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'you@example.com'
$$;

create table if not exists accounts (
  account_id        text primary key,
  institution_name  text,
  name              text,
  mask              text,
  type              text,
  subtype           text,
  balance_current   numeric,
  balance_available numeric,
  updated_at        timestamptz
);

create table if not exists transactions (
  transaction_id          text primary key,
  account_id              text,
  date                    date not null,
  name                    text,
  merchant_name           text,
  counterparty            text,
  amount                  numeric not null,   -- Plaid sign: positive = money out
  pending                 boolean default false,
  plaid_category_primary  text,
  bucket                  text not null default 'uncategorized',
  bucket_rule             text,
  bucket_locked           boolean default false,
  deductible              boolean default false,
  updated_at              timestamptz
);
create index if not exists tx_date on transactions(date desc);
create index if not exists tx_bucket on transactions(bucket);

-- What the phone writes. Pulled down and applied on the laptop.
create table if not exists overrides (
  transaction_id text primary key,
  bucket         text not null,
  set_at         timestamptz default now(),
  applied        boolean default false
);

-- Cash spent that no card saw: the ~$430/mo hole. Logged from the phone.
create table if not exists cash_log (
  id         bigint generated always as identity primary key,
  spent_on   date not null default current_date,
  amount     numeric not null,        -- USD, positive = spent
  bucket     text not null,
  note       text,
  created_at timestamptz default now(),
  applied    boolean default false
);

-- One row, rewritten every push: the numbers the Today screen shows.
create table if not exists budget_snapshot (
  id                    int primary key default 1,
  computed_at           timestamptz,
  cash_on_hand          numeric,
  weekly_pay            numeric,
  tax_reserve_weekly    numeric,
  rent_weekly           numeric,
  utilities_weekly      numeric,
  living_weekly         numeric,
  jane_weekly           numeric,
  work_weekly           numeric,
  float_target          numeric,
  float_funded          numeric,
  spent_today           numeric,
  spent_this_week       numeric,
  allowance_today       numeric,
  days_left_in_month    int,
  thailand_days_2026    numeric,
  next_payday           date,
  payload               jsonb
);

alter table accounts        enable row level security;
alter table transactions    enable row level security;
alter table overrides       enable row level security;
alter table cash_log        enable row level security;
alter table budget_snapshot enable row level security;

-- Force RLS so even the table owner role is subject to it.
alter table accounts        force row level security;
alter table transactions    force row level security;
alter table overrides       force row level security;
alter table cash_log        force row level security;
alter table budget_snapshot force row level security;

do $$
declare t text;
begin
  foreach t in array array['accounts','transactions','overrides','cash_log','budget_snapshot'] loop
    execute format('drop policy if exists authed_all on public.%I', t);
    execute format('drop policy if exists owner_all on public.%I', t);
    execute format(
      'create policy owner_all on public.%I for all to authenticated '
      'using (public.is_owner()) with check (public.is_owner())', t);
  end loop;
end $$;

-- The service_role key used by the laptop bypasses RLS by design. It lives in
-- the DPAPI vault and never goes near the app build.
