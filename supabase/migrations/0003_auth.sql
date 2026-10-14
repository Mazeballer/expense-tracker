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
