-- Complete the report lifecycle and let officials target announcement
-- notifications to residents in a specific Dzongkhag.
alter table public.announcements
  add column if not exists target_location text;

alter table public.announcements
  drop constraint if exists announcements_target_location_not_blank;
alter table public.announcements
  add constraint announcements_target_location_not_blank
  check (target_location is null or pg_catalog.btrim(target_location) <> '');

alter table public.notifications
  drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check check (
    type in (
      'report_submitted',
      'report_approved',
      'report_status',
      'report_rejected',
      'report_removed',
      'diamond_comment',
      'diamond_status',
      'announcement'
    )
  );

create or replace function public.normalize_bhutan_location(value text)
returns text
language sql
immutable
strict
parallel safe
set search_path = ''
as $$
  select case pg_catalog.regexp_replace(
    pg_catalog.lower(pg_catalog.btrim(value)),
    '\s+(district|dzongkhag)$',
    '',
    'i'
  )
    when 'chukha' then 'chhukha'
    when 'lhuntse' then 'lhuentse'
    when 'pema gatshel' then 'pemagatshel'
    when 'trashi yangtse' then 'trashiyangtse'
    when 'wangdi phodrang' then 'wangdue phodrang'
    else pg_catalog.regexp_replace(
      pg_catalog.lower(pg_catalog.btrim(value)),
      '\s+(district|dzongkhag)$',
      '',
      'i'
    )
  end;
$$;

revoke all on function public.normalize_bhutan_location(text)
  from public, anon;
grant execute on function public.normalize_bhutan_location(text)
  to authenticated;

alter table public.announcements
  drop constraint if exists announcements_target_location_valid;
alter table public.announcements
  add constraint announcements_target_location_valid check (
    target_location is null
    or public.normalize_bhutan_location(target_location) in (
      'bumthang',
      'chhukha',
      'dagana',
      'gasa',
      'haa',
      'lhuentse',
      'mongar',
      'paro',
      'pemagatshel',
      'punakha',
      'samdrup jongkhar',
      'samtse',
      'sarpang',
      'thimphu',
      'trashigang',
      'trashiyangtse',
      'trongsa',
      'tsirang',
      'wangdue phodrang',
      'zhemgang'
    )
  );

create index if not exists profiles_notification_location_idx
  on public.profiles (public.normalize_bhutan_location(location))
  where location is not null;

create or replace function public.notify_grievance_submitted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.reporter_id is not null then
    insert into public.notifications (
      user_id, type, title, body, href, entity_type, entity_id,
      metadata
    ) values (
      new.reporter_id,
      'report_submitted',
      'Report submitted',
      format(
        'Your report "%s" was submitted and is waiting for review.',
        left(coalesce(new.title, 'Community report'), 100)
      ),
      '/profile/reports/' || new.id::text,
      'grievance',
      new.id::text,
      jsonb_build_object('status', new.status)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_grievance_submitted on public.grievances;
create trigger trg_notify_grievance_submitted
  after insert on public.grievances
  for each row
  execute function public.notify_grievance_submitted();

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

create or replace function public.notify_announcement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (
    user_id, type, title, body, href, entity_type, entity_id,
    metadata
  )
  select
    u.id,
    'announcement',
    case new.type
      when 'important_notice' then 'Important notice: ' || left(new.title, 100)
      else 'New announcement: ' || left(new.title, 100)
    end,
    left(new.body, 180),
    '/diamond',
    'announcement',
    new.id::text,
    jsonb_build_object(
      'announcement_type', new.type,
      'target_location', new.target_location
    )
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id <> new.author_id
    and (
      new.target_location is null
      or public.normalize_bhutan_location(p.location)
         = public.normalize_bhutan_location(new.target_location)
    );

  return new;
end;
$$;

revoke all on function public.notify_grievance_submitted()
  from public, anon, authenticated;
revoke all on function public.notify_grievance_removed()
  from public, anon, authenticated;
revoke all on function public.notify_announcement()
  from public, anon, authenticated;

insert into public.chatbot_knowledge (question, answer, keywords)
values (
  'Which grievance and official updates appear in notifications?',
  'The notification bell confirms when your grievance is submitted, approved, rejected, or moved to a new status. Officials can also notify everyone or only residents whose saved Dzongkhag matches the announcement audience.',
  array['notifications', 'grievance status', 'approval', 'rejection', 'official', 'location']
)
on conflict (question) do update
set answer = excluded.answer,
    keywords = excluded.keywords;

notify pgrst, 'reload schema';
