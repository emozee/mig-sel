-- Notification rows are authoritative only when the source records cannot be
-- forged. Re-enable RLS and replace permissive source-table policies.

do $$
declare
  v_policy record;
begin
  for v_policy in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'grievances'
  loop
    execute format('drop policy %I on public.grievances', v_policy.policyname);
  end loop;
end;
$$;

alter table public.grievances enable row level security;
revoke all on table public.grievances from anon, authenticated;
grant select, insert, update, delete on table public.grievances to authenticated;

create policy "Authenticated users can read grievances"
  on public.grievances for select
  to authenticated
  using (true);

create policy "Users can submit their own grievances"
  on public.grievances for insert
  to authenticated
  with check (
    reporter_id = (select auth.uid())
    and approved = false
    and status = 'pending'
  );

create policy "Admins can update grievances"
  on public.grievances for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('admin', 'super_admin')
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('admin', 'super_admin')
    )
  );

create policy "Admins can delete grievances"
  on public.grievances for delete
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('admin', 'super_admin')
    )
  );

do $$
declare
  v_policy record;
begin
  for v_policy in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'diamonds'
  loop
    execute format('drop policy %I on public.diamonds', v_policy.policyname);
  end loop;
end;
$$;

alter table public.diamonds enable row level security;
revoke all on table public.diamonds from anon, authenticated;
grant select, insert, delete on table public.diamonds to authenticated;
grant update (body) on table public.diamonds to authenticated;
grant usage, select on sequence public.diamonds_id_seq to authenticated;

create policy "Authenticated users can read diamonds"
  on public.diamonds for select
  to authenticated
  using (true);

create policy "Users can create pending diamonds"
  on public.diamonds for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'pending'
    and direct_solve_awarded = false
  );

create policy "Users can edit their own diamond body"
  on public.diamonds for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can delete their own diamonds"
  on public.diamonds for delete
  to authenticated
  using (user_id = (select auth.uid()));

do $$
declare
  v_policy record;
begin
  for v_policy in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'diamond_collaborators'
  loop
    execute format('drop policy %I on public.diamond_collaborators', v_policy.policyname);
  end loop;
end;
$$;

alter table public.diamond_collaborators enable row level security;
revoke all on table public.diamond_collaborators from anon, authenticated;
grant select on table public.diamond_collaborators to authenticated;

create policy "Authenticated users can read diamond collaborators"
  on public.diamond_collaborators for select
  to authenticated
  using (true);

notify pgrst, 'reload schema';
