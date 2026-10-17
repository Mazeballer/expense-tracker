-- Ignore capital letters and stray or invisible characters when checking the allowlist.
create or replace function public.enforce_allowlist()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.allowed_emails where lower(regexp_replace(email, '[^A-Za-z0-9@._+-]', '', 'g')) = lower(regexp_replace(new.email, '[^A-Za-z0-9@._+-]', '', 'g'))
  ) then
    raise exception 'Email not allowed';
  end if;
  return new;
end;
$$;

-- Clean up emails that were saved with hidden characters.
update public.allowed_emails set email = lower(regexp_replace(email, '[^A-Za-z0-9@._+-]', '', 'g'));
