begin;

create or replace function public.resolve_grievance(
  p_grievance_id uuid,
  p_resolved_image_url text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_reporter uuid;
  v_status text;
  v_approved boolean;
  v_bonus integer;
begin
  if (select auth.uid()) is null then
    raise exception 'You must be signed in to resolve a report'
      using errcode = '42501';
  end if;

  select p.role into v_role
  from public.profiles p
  where p.id = (select auth.uid());

  if coalesce(v_role, '') not in ('inspector', 'admin', 'super_admin') then
    raise exception 'Only authorized staff can resolve reports'
      using errcode = '42501';
  end if;

  if nullif(trim(p_resolved_image_url), '') is null then
    raise exception 'An after photo is required to resolve a report';
  end if;

  select g.reporter_id, g.status, g.approved, coalesce(g.bonus_awarded, 0)
  into v_reporter, v_status, v_approved, v_bonus
  from public.grievances g
  where g.id = p_grievance_id
  for update;

  if not found then
    raise exception 'Report not found';
  end if;

  if not coalesce(v_approved, false) then
    raise exception 'Only approved reports can be resolved';
  end if;

  if v_status not in ('in-progress', 'public') then
    raise exception 'Only public or in-progress reports can be resolved';
  end if;

  if v_role = 'inspector' and v_reporter = (select auth.uid()) then
    raise exception 'Inspectors cannot resolve their own reports'
      using errcode = '42501';
  end if;

  perform set_config('migsel.resolving_grievance', 'on', true);

  update public.grievances
  set status = 'resolved',
      resolved_image_url = trim(p_resolved_image_url),
      resolved_at = now(),
      bonus_awarded = 4
  where id = p_grievance_id;

  if v_reporter is not null then
    update public.profiles
    set points = greatest(0, coalesce(points, 0) + 4 - v_bonus)
    where id = v_reporter;
  end if;
end;
$$;

revoke all on function public.resolve_grievance(uuid, text) from public, anon;
grant execute on function public.resolve_grievance(uuid, text) to authenticated;

notify pgrst, 'reload schema';

commit;
