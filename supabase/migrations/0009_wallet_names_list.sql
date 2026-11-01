-- Debit and credit each hold a list of the card names Apple Wallet shows, so several real cards can share one type.
-- Safe to run whether or not 0008 was run before.
alter table public.payment_methods add column if not exists wallet_names text[] not null default '{}';
alter table public.payment_methods add constraint payment_methods_wallet_names_check
  check (cardinality(wallet_names) <= 20 and length(array_to_string(wallet_names, '|')) <= 1700);

do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'payment_methods' and column_name = 'wallet_name') then
    update public.payment_methods set wallet_names = array[wallet_name] where wallet_name is not null and cardinality(wallet_names) = 0;
    alter table public.payment_methods drop column wallet_name;
  end if;
end $$;

create or replace function public.apple_pay_context(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare uid uuid := public.token_owner(p_token);
begin
  if uid is null then return null; end if;
  return jsonb_build_object(
    'categories', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'name', name) order by sort) from public.categories where user_id = uid and not archived), '[]'::jsonb),
    'methods', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'name', name, 'kind', kind, 'walletNames', to_jsonb(wallet_names)) order by sort) from public.payment_methods where user_id = uid and not archived), '[]'::jsonb)
  );
end;
$$;
