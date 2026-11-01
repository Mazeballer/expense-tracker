-- Each card can carry the name Apple Wallet shows for it, so an Apple Pay payment lands on the right card.
alter table public.payment_methods add column wallet_name text check (wallet_name is null or length(wallet_name) between 1 and 80);

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
    'methods', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'name', name, 'kind', kind, 'walletName', wallet_name) order by sort) from public.payment_methods where user_id = uid and not archived), '[]'::jsonb)
  );
end;
$$;
