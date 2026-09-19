-- Create a Diamond and its collaborators atomically so permission or network
-- failures cannot leave a partially-created post.
create or replace function public.create_diamond_with_collaborators(
  p_body text,
  p_image_urls text[] default '{}',
  p_linked_grievance_id uuid default null,
  p_collaborator_ids uuid[] default '{}'
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_diamond_id bigint;
begin
  if v_user_id is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  p_body := pg_catalog.btrim(p_body);
  if p_body = '' or pg_catalog.char_length(p_body) > 1000 then
    raise exception 'Post text must be between 1 and 1000 characters'
      using errcode = '22023';
  end if;

  if p_linked_grievance_id is not null and not exists (
    select 1
    from public.grievances g
    where g.id = p_linked_grievance_id
      and g.status = 'public'
  ) then
    raise exception 'The linked report is not available for a direct solve'
      using errcode = '22023';
  end if;

  insert into public.diamonds (
    user_id,
    body,
    image_urls,
    linked_grievance_id,
    status,
    direct_solve_awarded
  ) values (
    v_user_id,
    p_body,
    coalesce(p_image_urls, '{}'::text[]),
    p_linked_grievance_id,
    'pending',
    false
  )
  returning id into v_diamond_id;

  if p_linked_grievance_id is not null then
    insert into public.diamond_collaborators (diamond_id, user_id)
    select distinct v_diamond_id, candidate.user_id
    from unnest(coalesce(p_collaborator_ids, '{}'::uuid[])) as candidate(user_id)
    inner join auth.users u on u.id = candidate.user_id
    where candidate.user_id <> v_user_id
    limit 20
    on conflict on constraint diamond_collaborators_diamond_id_user_id_key do nothing;
  end if;

  return v_diamond_id;
end;
$$;

revoke all on function public.create_diamond_with_collaborators(text, text[], uuid, uuid[])
  from public, anon;
grant execute on function public.create_diamond_with_collaborators(text, text[], uuid, uuid[])
  to authenticated;

notify pgrst, 'reload schema';
