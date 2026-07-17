-- Location tracking infrastructure

-- RPC: get count of users grouped by location
create or replace function public.get_user_locations()
returns table (location text, count bigint)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  select
    coalesce(p.location, 'Unknown') as location,
    count(*)::bigint as count
  from public.profiles p
  group by p.location
  order by count desc;
end;
$$;

grant execute on function public.get_user_locations to anon, authenticated;
