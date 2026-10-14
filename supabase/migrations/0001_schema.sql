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
