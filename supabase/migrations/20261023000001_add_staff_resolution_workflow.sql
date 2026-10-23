begin;

-- Keep grievance image storage reproducible for both citizen reports and
-- resolution proof uploaded by staff.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'grievances',
  'grievances',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated users can upload grievance images'
  ) then
    execute $policy$
      create policy "Authenticated users can upload grievance images"
      on storage.objects for insert
      to authenticated
      with check (
        bucket_id = 'grievances'
        and (storage.foldername(name))[1] = 'reports'
      )
    $policy$;
  end if;
end;
$$;

-- Point changes normally require an admin. The resolution RPC below sets this
-- transaction-local flag after checking the caller's staff role and locking the
-- grievance, allowing its atomic point award through the existing trigger.
create or replace function public.protect_profile_points()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_requester_role text;
begin
  if session_user in ('postgres', 'supabase_admin')
     or (select auth.role()) = 'service_role'
     or current_setting('migsel.resolving_grievance', true) = 'on' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if coalesce(new.points, 0) = 0 then
      return new;
    end if;
  else
    if new.points is not distinct from old.points then
      return new;
    end if;
  end if;

  select p.role into v_requester_role
  from public.profiles p
  where p.id = (select auth.uid());

  if coalesce(v_requester_role, '') not in ('admin', 'super_admin') then
    raise exception 'Only an admin can change points'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function public.protect_profile_points() from public, anon, authenticated;

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

  if v_status <> 'in-progress' then
    raise exception 'Only in-progress reports can be resolved';
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
