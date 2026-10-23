begin;

create or replace function public.protect_resolved_grievance()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
begin
  if session_user in ('postgres', 'supabase_admin')
     or (select auth.role()) = 'service_role' then
    return new;
  end if;

  if (old.status = 'resolved' and new.status is distinct from old.status)
     or (
       old.resolved_image_url is not null
       and new.resolved_image_url is distinct from old.resolved_image_url
     ) then
    select p.role into v_role
    from public.profiles p
    where p.id = (select auth.uid());

    if coalesce(v_role, '') <> 'super_admin' then
      raise exception 'Only a super admin can revert a resolved report or remove its after photo'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_protect_resolved_grievance on public.grievances;
create trigger trg_protect_resolved_grievance
  before update of status, resolved_image_url on public.grievances
  for each row
  execute function public.protect_resolved_grievance();

revoke all on function public.protect_resolved_grievance() from public, anon, authenticated;

create or replace function public.revert_grievance_resolution(p_grievance_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_reporter uuid;
  v_status text;
  v_bonus integer;
  v_resolved_image_url text;
begin
  if (select auth.uid()) is null then
    raise exception 'You must be signed in to revert a resolution'
      using errcode = '42501';
  end if;

  select p.role into v_role
  from public.profiles p
  where p.id = (select auth.uid());

  if coalesce(v_role, '') <> 'super_admin' then
    raise exception 'Only a super admin can revert a resolution'
      using errcode = '42501';
  end if;

  select g.reporter_id, g.status, coalesce(g.bonus_awarded, 0), g.resolved_image_url
  into v_reporter, v_status, v_bonus, v_resolved_image_url
  from public.grievances g
  where g.id = p_grievance_id
  for update;

  if not found then
    raise exception 'Report not found';
  end if;

  if v_status <> 'resolved' then
    raise exception 'Only resolved reports can be reverted';
  end if;

  perform set_config('migsel.resolving_grievance', 'on', true);

  update public.grievances
  set status = 'in-progress',
      resolved_image_url = null,
      resolved_at = null,
      bonus_awarded = 2
  where id = p_grievance_id;

  if v_reporter is not null then
    update public.profiles
    set points = greatest(0, coalesce(points, 0) + 2 - v_bonus)
    where id = v_reporter;
  end if;

  return v_resolved_image_url;
end;
$$;

revoke all on function public.revert_grievance_resolution(uuid) from public, anon;
grant execute on function public.revert_grievance_resolution(uuid) to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Super admins can delete grievance images'
  ) then
    execute $policy$
      create policy "Super admins can delete grievance images"
      on storage.objects for delete
      to authenticated
      using (
        bucket_id = 'grievances'
        and (storage.foldername(name))[1] = 'reports'
        and exists (
          select 1
          from public.profiles p
          where p.id = (select auth.uid())
            and p.role = 'super_admin'
        )
      )
    $policy$;
  end if;
end;
$$;

notify pgrst, 'reload schema';

commit;
