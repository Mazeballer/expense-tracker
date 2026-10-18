-- Apple Pay auto-log: an iPhone Shortcut sends each payment to the app with a private token instead of a login.
-- The token is shown once and only its hash is stored, so it cannot be read back. It can be revoked any time.

alter table public.expenses drop constraint expenses_source_check;
alter table public.expenses add constraint expenses_source_check
  check (source in ('app','quick_add','receipt','telegram','import','apple_pay'));

create table public.api_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  label text not null default 'Apple Pay' check (length(label) between 1 and 40),
  token_hash text not null unique check (length(token_hash) = 64),
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);
alter table public.api_tokens enable row level security;
create policy "own tokens" on public.api_tokens for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Who owns this token? Internal helper, not callable from the browser.
create or replace function public.token_owner(p_token text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select user_id from public.api_tokens
  where token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
$$;
revoke all on function public.token_owner(text) from public, anon, authenticated;

-- The names the server needs to pick a category and a card for a payment. Null when the token is wrong.
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
    'methods', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'name', name, 'kind', kind) order by sort) from public.payment_methods where user_id = uid and not archived), '[]'::jsonb)
  );
end;
$$;

-- Saves one payment for the token's owner. A repeat of the same payment within two minutes is ignored.
create or replace function public.apple_pay_log(p_token text, p_amount numeric, p_description text, p_category_id uuid, p_payment_method_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := public.token_owner(p_token);
  existing uuid;
  created uuid;
begin
  if uid is null then raise exception 'Invalid token'; end if;
  select id into existing from public.expenses
    where user_id = uid and source = 'apple_pay' and amount = p_amount
      and description = left(p_description, 200) and created_at > now() - interval '2 minutes'
    limit 1;
  if existing is not null then return existing; end if;
  insert into public.expenses (user_id, spent_at, description, category_id, payment_method_id, amount, source)
    values (uid, now(), left(p_description, 200), p_category_id, p_payment_method_id, p_amount, 'apple_pay')
    returning id into created;
  update public.api_tokens set last_used_at = now() where user_id = uid and token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex');
  return created;
end;
$$;

revoke all on function public.apple_pay_context(text), public.apple_pay_log(text, numeric, text, uuid, uuid) from public;
grant execute on function public.apple_pay_context(text), public.apple_pay_log(text, numeric, text, uuid, uuid) to anon, authenticated;
revoke all on public.api_tokens from anon;
grant select, insert, delete on public.api_tokens to authenticated;
