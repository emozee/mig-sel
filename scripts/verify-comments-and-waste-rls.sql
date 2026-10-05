begin;

do $$
begin
  if not (select relrowsecurity from pg_class where oid = 'public.community_feed_comments'::regclass) then
    raise exception 'Comments do not have RLS enabled';
  end if;

  if has_table_privilege('anon', 'public.community_feed_comments', 'SELECT')
     or has_table_privilege('anon', 'public.community_feed_comments', 'INSERT')
     or has_table_privilege('anon', 'public.community_feed_comments', 'UPDATE')
     or has_table_privilege('anon', 'public.community_feed_comments', 'DELETE') then
    raise exception 'Anonymous users still have comment privileges';
  end if;

  if not has_table_privilege('authenticated', 'public.community_feed_comments', 'SELECT')
     or not has_table_privilege('authenticated', 'public.community_feed_comments', 'INSERT')
     or not has_column_privilege('authenticated', 'public.community_feed_comments', 'body', 'UPDATE')
     or not has_table_privilege('authenticated', 'public.community_feed_comments', 'DELETE') then
    raise exception 'Signed-in users are missing required comment privileges';
  end if;

  if has_column_privilege('authenticated', 'public.community_feed_comments', 'user_id', 'UPDATE') then
    raise exception 'Signed-in users can change comment ownership';
  end if;

  if not (select relrowsecurity from pg_class where oid = 'public.waste_records'::regclass) then
    raise exception 'Waste records do not have RLS enabled';
  end if;

  if has_table_privilege('anon', 'public.waste_records', 'SELECT')
     or has_table_privilege('anon', 'public.waste_records', 'INSERT')
     or has_table_privilege('anon', 'public.waste_records', 'UPDATE')
     or has_table_privilege('anon', 'public.waste_records', 'DELETE') then
    raise exception 'Anonymous users still have waste-record privileges';
  end if;

  if has_table_privilege('authenticated', 'public.waste_records', 'DELETE') then
    raise exception 'Clients can permanently delete waste records';
  end if;
end;
$$;

select set_config(
  'test.user_a',
  (select id::text from public.profiles where role = 'user' order by id limit 1),
  true
);
select set_config(
  'test.user_b',
  (select id::text from public.profiles where role = 'user' order by id offset 1 limit 1),
  true
);
select set_config(
  'test.admin',
  (select id::text from public.profiles where role = 'admin' order by id limit 1),
  true
);
select set_config(
  'test.super_admin',
  (select id::text from public.profiles where role = 'super_admin' order by id limit 1),
  true
);
select set_config(
  'test.inspector',
  (select id::text from public.profiles where role = 'inspector' order by id limit 1),
  true
);
select set_config(
  'test.feed_id',
  (select id::text from public.community_feed order by id limit 1),
  true
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', current_setting('test.user_a'), 'role', 'authenticated')::text,
  true
);

with inserted as (
  insert into public.community_feed_comments (
    feed_id,
    user_id,
    user_name,
    user_initials,
    body
  ) values (
    current_setting('test.feed_id')::bigint,
    current_setting('test.user_a')::uuid,
    'RLS test user',
    'RT',
    'RLS verification comment'
  )
  returning id
)
select set_config('test.comment_id', (select id::text from inserted), true);

do $$
declare
  v_rows integer;
begin
  select count(*) into v_rows
  from public.community_feed_comments
  where id = current_setting('test.comment_id')::bigint;

  if v_rows <> 1 then
    raise exception 'A user could not read comments';
  end if;
end;
$$;

do $$
declare
  v_rows integer;
begin
  update public.community_feed_comments
  set body = 'RLS verification comment edited'
  where id = current_setting('test.comment_id')::bigint;

  get diagnostics v_rows = row_count;
  if v_rows <> 1 then
    raise exception 'A user could not edit their own comment';
  end if;
end;
$$;

select set_config(
  'request.jwt.claims',
  json_build_object('sub', current_setting('test.user_b'), 'role', 'authenticated')::text,
  true
);

do $$
declare
  v_rows integer;
begin
  update public.community_feed_comments
  set body = 'Unauthorized edit'
  where id = current_setting('test.comment_id')::bigint;

  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    raise exception 'A user edited another user''s comment';
  end if;

  delete from public.community_feed_comments
  where id = current_setting('test.comment_id')::bigint;

  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    raise exception 'A user deleted another user''s comment';
  end if;
end;
$$;

select set_config(
  'request.jwt.claims',
  json_build_object('sub', current_setting('test.admin'), 'role', 'authenticated')::text,
  true
);

do $$
declare
  v_rows integer;
begin
  update public.community_feed_comments
  set body = 'Unauthorized admin edit'
  where id = current_setting('test.comment_id')::bigint;

  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    raise exception 'An admin edited another user''s comment';
  end if;

  delete from public.community_feed_comments
  where id = current_setting('test.comment_id')::bigint;

  get diagnostics v_rows = row_count;
  if v_rows <> 1 then
    raise exception 'An admin could not delete another user''s comment';
  end if;
end;
$$;

select set_config(
  'request.jwt.claims',
  json_build_object('sub', current_setting('test.user_a'), 'role', 'authenticated')::text,
  true
);

with inserted as (
  insert into public.community_feed_comments (
    feed_id,
    user_id,
    user_name,
    user_initials,
    body
  ) values (
    current_setting('test.feed_id')::bigint,
    current_setting('test.user_a')::uuid,
    'RLS test user',
    'RT',
    'RLS owner-delete verification'
  )
  returning id
)
select set_config('test.owner_comment_id', (select id::text from inserted), true);

do $$
declare
  v_rows integer;
begin
  delete from public.community_feed_comments
  where id = current_setting('test.owner_comment_id')::bigint;

  get diagnostics v_rows = row_count;
  if v_rows <> 1 then
    raise exception 'A user could not delete their own comment';
  end if;
end;
$$;

with inserted as (
  insert into public.community_feed_comments (
    feed_id,
    user_id,
    user_name,
    user_initials,
    body
  ) values (
    current_setting('test.feed_id')::bigint,
    current_setting('test.user_a')::uuid,
    'RLS test user',
    'RT',
    'RLS super-admin verification'
  )
  returning id
)
select set_config('test.super_comment_id', (select id::text from inserted), true);

select set_config(
  'request.jwt.claims',
  json_build_object('sub', current_setting('test.super_admin'), 'role', 'authenticated')::text,
  true
);

do $$
declare
  v_rows integer;
begin
  delete from public.community_feed_comments
  where id = current_setting('test.super_comment_id')::bigint;

  get diagnostics v_rows = row_count;
  if v_rows <> 1 then
    raise exception 'A super admin could not delete another user''s comment';
  end if;
end;
$$;

select set_config(
  'request.jwt.claims',
  json_build_object('sub', current_setting('test.user_a'), 'role', 'authenticated')::text,
  true
);

do $$
declare
  v_rows integer;
  v_blocked boolean := false;
begin
  select count(*) into v_rows from public.waste_records;
  if v_rows <> 0 then
    raise exception 'A normal user read waste records';
  end if;

  begin
    insert into public.waste_records (category, quantity, unit, reported_at, notes)
    values ('organic-food', 1, 'kg', current_date, 'RLS verification');
  exception
    when insufficient_privilege then
      v_blocked := true;
  end;

  if not v_blocked then
    raise exception 'A normal user created a waste record';
  end if;
end;
$$;

select set_config(
  'request.jwt.claims',
  json_build_object('sub', current_setting('test.inspector'), 'role', 'authenticated')::text,
  true
);

with inserted as (
  insert into public.waste_records (category, quantity, unit, reported_at, notes)
  values ('organic-food', 1, 'kg', current_date, 'RLS verification')
  returning id
)
select set_config('test.waste_id', (select id from inserted), true);

do $$
declare
  v_rows integer;
begin
  select count(*) into v_rows
  from public.waste_records
  where id = current_setting('test.waste_id');

  if v_rows <> 1 then
    raise exception 'An inspector could not read waste records';
  end if;

  update public.waste_records
  set quantity = 2
  where id = current_setting('test.waste_id');

  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    raise exception 'An inspector updated a waste record';
  end if;
end;
$$;

select set_config(
  'request.jwt.claims',
  json_build_object('sub', current_setting('test.admin'), 'role', 'authenticated')::text,
  true
);

do $$
declare
  v_rows integer;
begin
  update public.waste_records
  set quantity = 2
  where id = current_setting('test.waste_id');

  get diagnostics v_rows = row_count;
  if v_rows <> 1 then
    raise exception 'An admin could not update a waste record';
  end if;

  update public.waste_records
  set deleted_at = now(), deletion_reason = 'RLS verification'
  where id = current_setting('test.waste_id');

  get diagnostics v_rows = row_count;
  if v_rows <> 1 then
    raise exception 'An admin could not archive a waste record';
  end if;

  update public.waste_records
  set deleted_at = null, deletion_reason = null
  where id = current_setting('test.waste_id');

  get diagnostics v_rows = row_count;
  if v_rows <> 1 then
    raise exception 'An admin could not restore a waste record';
  end if;
end;
$$;

select set_config(
  'request.jwt.claims',
  json_build_object('sub', current_setting('test.super_admin'), 'role', 'authenticated')::text,
  true
);

do $$
declare
  v_rows integer;
begin
  update public.waste_records
  set quantity = 3
  where id = current_setting('test.waste_id');

  get diagnostics v_rows = row_count;
  if v_rows <> 1 then
    raise exception 'A super admin could not update a waste record';
  end if;
end;
$$;

do $$
declare
  v_blocked boolean := false;
begin
  begin
    delete from public.waste_records
    where id = current_setting('test.waste_id');
  exception
    when insufficient_privilege then
      v_blocked := true;
  end;

  if not v_blocked then
    raise exception 'A client permanently deleted a waste record';
  end if;
end;
$$;

reset role;
select 'comment and waste RLS checks passed' as result;
rollback;
