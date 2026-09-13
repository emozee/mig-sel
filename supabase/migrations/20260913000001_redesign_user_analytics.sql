-- Replace login-based user status metrics with registration and participation analytics.

create index if not exists idx_grievances_reporter_id
  on public.grievances (reporter_id)
  where reporter_id is not null;

create or replace function public.get_user_analytics()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if auth.uid() is null or not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('admin', 'super_admin')
  ) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  with registered_users as materialized (
    select
      u.id,
      u.created_at,
      nullif(pg_catalog.btrim(p.username), '') as username,
      p.avatar_url,
      coalesce(nullif(pg_catalog.btrim(p.role), ''), 'user') as role,
      coalesce(nullif(pg_catalog.btrim(p.location), ''), 'Unknown') as location
    from auth.users u
    left join public.profiles p on p.id = u.id
  ),
  reporter_counts as materialized (
    select
      g.reporter_id,
      count(*)::bigint as report_count
    from public.grievances g
    inner join registered_users u on u.id = g.reporter_id
    group by g.reporter_id
  )
  select pg_catalog.jsonb_build_object(
    'total_users', (select count(*) from registered_users),
    'new_users_this_month', (
      select count(*)
      from registered_users
      where created_at >= pg_catalog.date_trunc('month', pg_catalog.now())
    ),
    'users_who_submitted_reports', (select count(*) from reporter_counts),
    'first_time_reporters', (
      select count(*)
      from reporter_counts
      where report_count = 1
    ),
    'repeat_reporters', (
      select count(*)
      from reporter_counts
      where report_count > 1
    ),
    'role_distribution', coalesce((
      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object('role', roles.role, 'count', roles.count)
        order by roles.sort_order, roles.role
      )
      from (
        select
          role,
          count(*)::bigint as count,
          case role
            when 'user' then 1
            when 'inspector' then 2
            when 'official' then 3
            when 'admin' then 4
            when 'super_admin' then 5
            else 6
          end as sort_order
        from registered_users
        group by role
      ) roles
    ), '[]'::jsonb),
    'reporter_distribution', pg_catalog.jsonb_build_object(
      'first_time', (
        select count(*)
        from reporter_counts
        where report_count = 1
      ),
      'repeat', (
        select count(*)
        from reporter_counts
        where report_count > 1
      )
    ),
    'user_growth', coalesce((
      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object('month', growth.month, 'count', growth.count)
        order by growth.month_start
      )
      from (
        select
          pg_catalog.date_trunc('month', created_at) as month_start,
          pg_catalog.to_char(pg_catalog.date_trunc('month', created_at), 'YYYY-MM') as month,
          count(*)::bigint as count
        from registered_users
        group by pg_catalog.date_trunc('month', created_at)
      ) growth
    ), '[]'::jsonb),
    'user_locations', coalesce((
      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object('location', locations.location, 'count', locations.count)
        order by locations.count desc, locations.location
      )
      from (
        select location, count(*)::bigint as count
        from registered_users
        where location <> 'Unknown'
        group by location
      ) locations
    ), '[]'::jsonb),
    'recent_registrations', coalesce((
      select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(recent) order by recent.created_at desc)
      from (
        select
          u.id,
          u.username,
          u.avatar_url,
          u.role,
          u.created_at,
          coalesce(r.report_count, 0) as report_count
        from registered_users u
        left join reporter_counts r on r.reporter_id = u.id
        order by u.created_at desc
        limit 6
      ) recent
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.get_user_analytics() from public, anon, authenticated;
grant execute on function public.get_user_analytics() to authenticated;

-- Keep the previous RPCs safe for already-deployed clients during the transition.
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
  if auth.uid() is null or not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('admin', 'super_admin')
  ) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select count(*) into v_total from auth.users;

  select count(*) into v_active
  from auth.users
  where last_sign_in_at > pg_catalog.now() - interval '30 days';

  select count(*) into v_inactive
  from auth.users
  where last_sign_in_at is null
     or last_sign_in_at <= pg_catalog.now() - interval '30 days';

  return pg_catalog.json_build_object(
    'total', v_total,
    'active', v_active,
    'inactive', v_inactive
  );
end;
$$;

create or replace function public.get_user_growth()
returns table (month text, count bigint)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('admin', 'super_admin')
  ) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  return query
  select
    pg_catalog.to_char(pg_catalog.date_trunc('month', u.created_at), 'YYYY-MM'),
    count(*)::bigint
  from auth.users u
  group by pg_catalog.date_trunc('month', u.created_at)
  order by pg_catalog.date_trunc('month', u.created_at);
end;
$$;

create or replace function public.get_user_locations()
returns table (location text, count bigint)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('admin', 'super_admin')
  ) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  return query
  select
    coalesce(nullif(pg_catalog.btrim(p.location), ''), 'Unknown'),
    count(*)::bigint
  from auth.users u
  left join public.profiles p on p.id = u.id
  group by coalesce(nullif(pg_catalog.btrim(p.location), ''), 'Unknown')
  order by count(*) desc;
end;
$$;

revoke all on function public.get_user_counts() from public, anon, authenticated;
revoke all on function public.get_user_growth() from public, anon, authenticated;
revoke all on function public.get_user_locations() from public, anon, authenticated;
grant execute on function public.get_user_counts() to authenticated;
grant execute on function public.get_user_growth() to authenticated;
grant execute on function public.get_user_locations() to authenticated;
