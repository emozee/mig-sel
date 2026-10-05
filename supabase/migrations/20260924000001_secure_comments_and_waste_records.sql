-- Secure community comments and waste operations at the database boundary.
do $$
declare
  v_policy record;
begin
  for v_policy in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'community_feed_comments'
  loop
    execute format(
      'drop policy %I on public.community_feed_comments',
      v_policy.policyname
    );
  end loop;
end;
$$;

alter table public.community_feed_comments enable row level security;
revoke all on table public.community_feed_comments from public, anon, authenticated;
grant select, insert, delete on table public.community_feed_comments to authenticated;
grant update (body) on table public.community_feed_comments to authenticated;

create policy "Authenticated users can read comments"
  on public.community_feed_comments for select
  to authenticated
  using (true);

create policy "Users can create their own comments"
  on public.community_feed_comments for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can edit their own comments"
  on public.community_feed_comments for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users and admins can delete comments"
  on public.community_feed_comments for delete
  to authenticated
  using (
    user_id = (select auth.uid())
    or (select public.is_admin_or_super_admin())
  );

do $$
declare
  v_policy record;
begin
  for v_policy in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'waste_records'
  loop
    execute format('drop policy %I on public.waste_records', v_policy.policyname);
  end loop;
end;
$$;

alter table public.waste_records enable row level security;
revoke all on table public.waste_records from public, anon, authenticated;
grant select, insert, update on table public.waste_records to authenticated;

create policy "Waste staff can read records"
  on public.waste_records for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('inspector', 'admin', 'super_admin')
    )
  );

create policy "Waste staff can create records"
  on public.waste_records for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('inspector', 'admin', 'super_admin')
    )
  );

create policy "Admins can update waste records"
  on public.waste_records for update
  to authenticated
  using ((select public.is_admin_or_super_admin()))
  with check ((select public.is_admin_or_super_admin()));
