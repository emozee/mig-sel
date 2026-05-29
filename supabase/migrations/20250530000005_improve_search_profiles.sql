-- Improved RPC to search profiles by username or email
-- Handles null usernames, uses left join so profiles exist without auth.users
create or replace function public.search_profiles(search_query text)
returns table (
  id uuid,
  username text,
  email text,
  avatar_url text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  select
    p.id,
    p.username,
    u.email::text,
    p.avatar_url
  from public.profiles p
  left join auth.users u on u.id = p.id
  where
    p.username ilike '%' || search_query || '%'
    or (u.email is not null and u.email ilike '%' || search_query || '%')
    or (u.raw_user_meta_data ->> 'name' ilike '%' || search_query || '%')
  order by
    case
      when p.username ilike search_query || '%' then 0
      when u.email ilike search_query || '%' then 1
      else 2
    end,
    p.username
  limit 20;
end;
$$;

grant execute on function public.search_profiles to anon, authenticated;
