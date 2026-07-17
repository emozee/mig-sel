-- Add super_admin role and user counts function
-- Super admins inherit all admin privileges + access to user analytics

-- Update existing function to accept super_admin role
create or replace function public.update_user_role(p_email text, p_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
begin
  select id into v_user_id
  from auth.users
  where email = p_email;

  if v_user_id is null then
    raise exception 'User with email % not found', p_email;
  end if;

  update public.profiles
  set role = p_role
  where id = v_user_id;

  if not found then
    insert into public.profiles (id, role)
    values (v_user_id, p_role);
  end if;
end;
$$;

-- RPC to get user counts for the super admin dashboard
create or replace function public.get_user_counts()
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_total int;
  v_active int;
  v_inactive int;
begin
  select count(*) into v_total from auth.users;

  select count(*) into v_active
  from auth.users
  where last_sign_in_at > now() - interval '30 days';

  select count(*) into v_inactive
  from auth.users
  where last_sign_in_at is null
     or last_sign_in_at <= now() - interval '30 days';

  return json_build_object(
    'total', v_total,
    'active', v_active,
    'inactive', v_inactive
  );
end;
$$;

grant execute on function public.get_user_counts to anon, authenticated;
