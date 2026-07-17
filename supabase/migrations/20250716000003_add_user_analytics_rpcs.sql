-- Add user growth and location tracking

-- Add age_group and location columns to profiles
alter table public.profiles
  add column if not exists date_of_birth date,
  add column if not exists location text;

-- RPC: get user signup growth grouped by month
create or replace function public.get_user_growth()
returns table (month text, count bigint)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  select
    to_char(created_at, 'YYYY-MM') as month,
    count(*)::bigint as count
  from auth.users
  group by month
  order by month;
end;
$$;

grant execute on function public.get_user_growth to anon, authenticated;
