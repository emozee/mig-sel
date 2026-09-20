-- A deleted grievance leaves its earlier submitted/approved/status
-- notifications behind. Retarget those notifications before adding the final
-- rejection notice so none of them link to a missing report.
create or replace function public.notify_grievance_removed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Do not create a notification while the user's account itself is being deleted.
  if old.reporter_id is not null
     and exists (select 1 from auth.users where id = old.reporter_id) then
    update public.notifications
    set href = '/profile/reports'
    where user_id = old.reporter_id
      and entity_type = 'grievance'
      and entity_id = old.id::text
      and type in (
        'report_submitted',
        'report_approved',
        'report_status',
        'report_rejected',
        'report_removed'
      )
      and href is distinct from '/profile/reports';

    insert into public.notifications (
      user_id, type, title, body, href, entity_type, entity_id
    ) values (
      old.reporter_id,
      'report_rejected',
      'Report rejected',
      format(
        'Your report "%s" was not approved after review.',
        left(coalesce(old.title, 'Community report'), 100)
      ),
      '/profile/reports',
      'grievance',
      old.id::text
    );
  end if;

  return old;
end;
$$;

revoke all on function public.notify_grievance_removed()
  from public, anon, authenticated;

-- Repair final-state links created before this migration.
update public.notifications
set href = '/profile/reports'
where type in ('report_rejected', 'report_removed')
  and href is distinct from '/profile/reports';

-- Repair older detail links whose grievance has already been deleted.
update public.notifications as n
set href = '/profile/reports'
where n.entity_type = 'grievance'
  and n.type in ('report_submitted', 'report_approved', 'report_status')
  and n.href is distinct from '/profile/reports'
  and not exists (
    select 1
    from public.grievances as g
    where g.id::text = n.entity_id
  );
