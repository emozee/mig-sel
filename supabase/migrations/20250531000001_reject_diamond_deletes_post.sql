-- When admin rejects a diamond post, delete it from the database instead of just marking rejected
create or replace function public.reject_diamond(diamond_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.diamonds
  where id = diamond_id
    and status = 'pending'
    and linked_grievance_id is not null;
end;
$$;

grant execute on function public.reject_diamond to authenticated;
