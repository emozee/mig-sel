-- Role parity: super_admin must have every power admin has (and admins were
-- already shown announcement management in the UI while the DB only allowed
-- officials). Broaden the three write policies to official + admin + super_admin.

drop policy if exists "Officials can insert announcements" on public.announcements;
drop policy if exists "Officials can update their own announcements" on public.announcements;
drop policy if exists "Officials can delete their own announcements" on public.announcements;

create policy "Staff can insert announcements"
  on public.announcements for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('official', 'admin', 'super_admin')
    )
  );

create policy "Staff can manage their own announcements"
  on public.announcements for update
  to authenticated
  using (
    author_id = auth.uid()
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('official', 'admin', 'super_admin')
    )
  );

create policy "Staff can delete their own announcements"
  on public.announcements for delete
  to authenticated
  using (
    author_id = auth.uid()
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('official', 'admin', 'super_admin')
    )
  );
