-- Role checks used by admin-only notification events are only trustworthy if
-- users cannot promote themselves through direct profile updates or the RPC.
create or replace function public.protect_profile_role()
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
    if coalesce(new.role, 'user') = 'user' then
      return new;
    end if;
  else
    if new.role is not distinct from old.role then
      return new;
    end if;
  end if;

  select p.role into v_requester_role
  from public.profiles p
  where p.id = (select auth.uid());

  if coalesce(v_requester_role, '') not in ('admin', 'super_admin') then
    raise exception 'Only an admin can change user roles'
      using errcode = '42501';
  end if;

  if new.role = 'super_admin' and coalesce(v_requester_role, '') <> 'super_admin' then
    raise exception 'Only a super admin can manage super admins'
      using errcode = '42501';
  end if;

  if tg_op = 'UPDATE' then
    if old.role = 'super_admin' and coalesce(v_requester_role, '') <> 'super_admin' then
      raise exception 'Only a super admin can manage super admins'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_protect_profile_role on public.profiles;
create trigger trg_protect_profile_role
  before insert or update of role on public.profiles
  for each row
  execute function public.protect_profile_role();

create or replace function public.update_user_role(p_email text, p_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_requester_role text;
  v_current_role text;
begin
  if p_role not in ('user', 'inspector', 'official', 'admin', 'super_admin') then
    raise exception 'Invalid role'
      using errcode = '22023';
  end if;

  select p.role into v_requester_role
  from public.profiles p
  where p.id = (select auth.uid());

  if coalesce(v_requester_role, '') not in ('admin', 'super_admin') then
    raise exception 'Only an admin can update user roles'
      using errcode = '42501';
  end if;

  select u.id, p.role
  into v_user_id, v_current_role
  from auth.users u
  left join public.profiles p on p.id = u.id
  where lower(u.email) = lower(p_email);

  if v_user_id is null then
    raise exception 'User with email % not found', p_email;
  end if;

  if (p_role = 'super_admin' or v_current_role = 'super_admin')
     and coalesce(v_requester_role, '') <> 'super_admin' then
    raise exception 'Only a super admin can manage super admins'
      using errcode = '42501';
  end if;

  insert into public.profiles (id, role)
  values (v_user_id, p_role)
  on conflict (id) do update
  set role = excluded.role;
end;
$$;

revoke all on function public.protect_profile_role() from public, anon, authenticated;
revoke all on function public.update_user_role(text, text) from public, anon;
grant execute on function public.update_user_role(text, text) to authenticated;

notify pgrst, 'reload schema';
