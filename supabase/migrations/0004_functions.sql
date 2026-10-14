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
