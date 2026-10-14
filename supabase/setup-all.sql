-- ===== migrations/0001_schema.sql =====
-- Expense Tracker: tables. Run the files in this folder in order in the Supabase SQL editor.

-- Who may sign up. No policies are created for this table, so no app user can read it.
create table public.allowed_emails (email text primary key);

create table public.user_settings (
  user_id      uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  savings_goal numeric(12,2) check (savings_goal >= 0),
  timezone     text not null default 'Asia/Kuala_Lumpur',
  first_name   text check (length(first_name) <= 40),
  avatar_path  text
);

-- The EPF rate for a month is the latest row with effective_from <= that month.
create table public.epf_rates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  effective_from date not null,
  rate numeric(5,4) not null check (rate between 0 and 1),
  unique (user_id, effective_from)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (length(name) between 1 and 40),
  icon text not null default '🧾',
  sort int not null default 0,
  archived boolean not null default false,
  unique (user_id, name),
  unique (id, user_id)
);

create table public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (length(name) between 1 and 40),
  kind text not null check (kind in ('debit','credit_card')),
  sort int not null default 0,
  archived boolean not null default false,
  unique (user_id, name),
  unique (id, user_id)
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  spent_at timestamptz not null,
  description text not null check (length(description) between 1 and 200),
  category_id uuid not null,
  payment_method_id uuid,
  amount numeric(12,2) not null check (amount > 0),
  note text check (length(note) <= 500),
  source text not null default 'app' check (source in ('app','quick_add','receipt','telegram','import')),
  import_key text,
  created_at timestamptz not null default now(),
  unique (user_id, import_key),
  foreign key (category_id, user_id) references public.categories (id, user_id),
  foreign key (payment_method_id, user_id) references public.payment_methods (id, user_id)
);
create index expenses_user_spent_idx on public.expenses (user_id, spent_at desc);

-- Income, deductions and fixed costs, versioned by month. group_key is shared by all versions of one line.
create table public.plan_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  group_key uuid not null default gen_random_uuid(),
  kind text not null check (kind in ('income','deduction','fixed')),
  label text not null check (length(label) between 1 and 60),
  amount numeric(12,2) not null check (amount >= 0),
  effective_from date not null,
  effective_to date,
  sort int not null default 0
);
create index plan_items_user_group_idx on public.plan_items (user_id, group_key);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (length(name) between 1 and 60),
  icon text not null default '🏦',
  kind text not null check (kind in ('savings','investment')),
  sort int not null default 0,
  archived boolean not null default false,
  unique (user_id, name),
  unique (id, user_id)
);

create table public.account_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  account_id uuid not null,
  occurred_on date not null,
  type text not null check (type in ('deposit','withdrawal')),
  amount numeric(12,2) not null check (amount > 0),
  note text check (length(note) <= 500),
  foreign key (account_id, user_id) references public.accounts (id, user_id) on delete cascade
);
create index account_tx_idx on public.account_transactions (user_id, account_id, occurred_on desc);

create table public.account_valuations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  account_id uuid not null,
  as_of date not null,
  value numeric(14,2) not null check (value >= 0),
  unique (account_id, as_of),
  foreign key (account_id, user_id) references public.accounts (id, user_id) on delete cascade
);

-- Spending limits. category_id null is the overall monthly budget.
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category_id uuid,
  amount numeric(12,2) not null check (amount > 0),
  unique nulls not distinct (user_id, category_id),
  foreign key (category_id, user_id) references public.categories (id, user_id)
);

-- Monthly totals per category in Malaysia time. RLS applies because the view runs as the caller.
create view public.expense_monthly with (security_invoker = true) as
select user_id,
       date_trunc('month', spent_at at time zone 'Asia/Kuala_Lumpur')::date as month,
       category_id,
       sum(amount) as total,
       count(*)::int as count
from public.expenses
group by 1, 2, 3;

-- ===== migrations/0002_rls.sql =====
-- Row level security: every user only ever sees and writes their own rows.

alter table public.allowed_emails enable row level security;   -- no policies: nobody can read it

do $$
declare t text;
begin
  foreach t in array array[
    'user_settings','epf_rates','categories','payment_methods','expenses',
    'plan_items','accounts','account_transactions','account_valuations','budgets'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "own rows" on public.%I for all to authenticated
         using (user_id = (select auth.uid()))
         with check (user_id = (select auth.uid()))', t);
  end loop;
end $$;

-- The browser key is never allowed to touch data without a signed-in user.
revoke all on all tables in schema public from anon;
grant select on public.expense_monthly to authenticated;

-- ===== migrations/0003_auth.sql =====
-- Allowlist: only emails listed in public.allowed_emails can create an account.
create or replace function public.enforce_allowlist()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.allowed_emails where lower(email) = lower(new.email)
  ) then
    raise exception 'Email not allowed';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_allowlist on auth.users;
create trigger enforce_allowlist
  before insert on auth.users
  for each row execute function public.enforce_allowlist();

-- First sign-in: create the user's defaults.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_settings (user_id) values (new.id);
  insert into public.epf_rates (user_id, effective_from, rate) values (new.id, date '2000-01-01', 0.11);

  insert into public.categories (user_id, name, icon, sort) values
    (new.id, 'Food & Drinks', '🍜', 0), (new.id, 'Groceries', '🛒', 1), (new.id, 'Transport', '🚗', 2),
    (new.id, 'Shopping', '🛍️', 3), (new.id, 'Entertainment', '🎬', 4), (new.id, 'Health', '💊', 5),
    (new.id, 'Others', '🧾', 6);

  insert into public.payment_methods (user_id, name, kind, sort) values
    (new.id, 'Debit card', 'debit', 0), (new.id, 'Credit card', 'credit_card', 1);

  insert into public.accounts (user_id, name, icon, kind, sort) values
    (new.id, 'EPF Voluntary', '🏛️', 'investment', 0), (new.id, 'ASB', '🏦', 'investment', 1),
    (new.id, 'Stocks/Unit Trust', '📈', 'investment', 2), (new.id, 'Emergency Fund', '🛟', 'savings', 3),
    (new.id, 'Others', '💼', 'savings', 4);

  return new;
end;
$$;

drop trigger if exists handle_new_user on auth.users;
create trigger handle_new_user
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===== migrations/0004_functions.sql =====
-- Versioned plan lines and EPF rate. These run as the caller, so row level security applies.

-- Change a line's amount from a month on. Earlier months keep the old amount.
create or replace function public.plan_item_change(p_group uuid, p_amount numeric, p_from date)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare cur public.plan_items%rowtype;
begin
  select * into cur from public.plan_items
   where group_key = p_group and effective_to is null
   for update;
  if not found then raise exception 'Plan line not found'; end if;

  if cur.effective_from >= p_from then
    update public.plan_items set amount = p_amount where id = cur.id;
  else
    update public.plan_items set effective_to = (p_from - 1) where id = cur.id;
    insert into public.plan_items (group_key, kind, label, amount, effective_from, sort)
    values (cur.group_key, cur.kind, cur.label, p_amount, p_from, cur.sort);
  end if;
end;
$$;

-- End a line from a month on.
create or replace function public.plan_item_end(p_group uuid, p_from date)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.plan_items set effective_to = (p_from - 1)
   where group_key = p_group and effective_to is null;
  if not found then raise exception 'Plan line not found'; end if;
end;
$$;

-- Change the EPF rate from a month on.
create or replace function public.change_epf_rate(p_rate numeric, p_from date)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.epf_rates (user_id, effective_from, rate)
  values ((select auth.uid()), p_from, p_rate)
  on conflict (user_id, effective_from) do update set rate = excluded.rate;
$$;

grant execute on function public.plan_item_change(uuid, numeric, date) to authenticated;
grant execute on function public.plan_item_end(uuid, date) to authenticated;
grant execute on function public.change_epf_rate(numeric, date) to authenticated;

-- ===== migrations/0005_storage.sql =====
-- Private bucket for profile photos. Each user can only touch files inside a folder named after their user id.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false)
on conflict (id) do nothing;

create policy "avatars read own" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars insert own" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars update own" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

