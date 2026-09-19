-- Profiles contain the roles that authorize notification-producing actions.
-- Protect role and points integrity while preserving profile editing and staff awards.
create or replace function public.is_admin_or_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role in ('admin', 'super_admin')
  );
$$;

revoke all on function public.is_admin_or_super_admin() from public, anon;
grant execute on function public.is_admin_or_super_admin() to authenticated;

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
     or (select auth.role()) = 'service_role' then
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

drop trigger if exists trg_protect_profile_points on public.profiles;
create trigger trg_protect_profile_points
  before insert or update of points on public.profiles
  for each row
  execute function public.protect_profile_points();

revoke all on function public.protect_profile_points() from public, anon, authenticated;

do $$
declare
  v_policy record;
begin
  for v_policy in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
  loop
    execute format('drop policy %I on public.profiles', v_policy.policyname);
  end loop;
end;
$$;

alter table public.profiles enable row level security;
revoke all on table public.profiles from anon, authenticated;
grant select, insert, update on table public.profiles to authenticated;

create policy "Authenticated users can read profiles"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users and admins can create profiles"
  on public.profiles for insert
  to authenticated
  with check (
    id = (select auth.uid())
    or (select public.is_admin_or_super_admin())
  );

create policy "Users can update themselves and admins can update users"
  on public.profiles for update
  to authenticated
  using (
    id = (select auth.uid())
    or (select public.is_admin_or_super_admin())
  )
  with check (
    id = (select auth.uid())
    or (select public.is_admin_or_super_admin())
  );

create or replace function public.adjust_points(
  p_reporter_id uuid,
  p_grievance_id uuid,
  p_delta integer,
  p_new_value integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select public.is_admin_or_super_admin()) then
    raise exception 'Only an admin can adjust points'
      using errcode = '42501';
  end if;

  update public.profiles
  set points = greatest(0, coalesce(points, 0) + p_delta)
  where id = p_reporter_id;

  update public.grievances
  set bonus_awarded = p_new_value
  where id = p_grievance_id;
end;
$$;

revoke all on function public.adjust_points(uuid, uuid, integer, integer)
  from public, anon;
grant execute on function public.adjust_points(uuid, uuid, integer, integer)
  to authenticated;

-- Collaborator search returns profile and account metadata and is only used
-- after sign-in.
revoke all on function public.search_profiles(text) from public, anon;
grant execute on function public.search_profiles(text) to authenticated;

notify pgrst, 'reload schema';
