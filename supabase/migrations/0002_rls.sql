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
