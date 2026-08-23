-- Role parity: super_admin must have every power admin has.
-- 1. chatbot_knowledge write policies were admin-only.
-- 2. admin_remove_diamond RPC was admin-only.

drop policy if exists "Admins can insert chatbot knowledge" on public.chatbot_knowledge;
drop policy if exists "Admins can update chatbot knowledge" on public.chatbot_knowledge;
drop policy if exists "Admins can delete chatbot knowledge" on public.chatbot_knowledge;

create policy "Admins can insert chatbot knowledge"
  on public.chatbot_knowledge for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'super_admin')
    )
  );

create policy "Admins can update chatbot knowledge"
  on public.chatbot_knowledge for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'super_admin')
    )
  );

create policy "Admins can delete chatbot knowledge"
  on public.chatbot_knowledge for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'super_admin')
    )
  );

create or replace function public.admin_remove_diamond(p_diamond_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'super_admin')
  ) then
    raise exception 'Not authorized';
  end if;

  delete from public.diamonds where id = p_diamond_id;
end;
$$;

grant execute on function public.admin_remove_diamond to authenticated;
