-- Auto-create community_feed entries when grievances are approved
-- and backfill existing approved grievances that are missing from the feed

-- Ensure community_feed has a grievance_id FK column (may already exist from manual setup)
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'community_feed' and column_name = 'grievance_id'
  ) then
    alter table public.community_feed
      add column grievance_id uuid references public.grievances(id) on delete cascade,
      add constraint community_feed_grievance_id_unique unique (grievance_id);
  end if;
end $$;

-- Create or replace the trigger function
create or replace function public.auto_create_feed_on_approve()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_name text;
  v_user_initials text;
  v_action_text text;
begin
  -- Only fire when approved changes from false to true
  if new.approved = true and (old.approved = false or old.approved is null) then
    -- Get reporter info from profiles
    select
      coalesce(p.username, 'Anonymous'),
      coalesce(
        left(p.username, 2),
        'An'
      )
    into v_user_name, v_user_initials
    from public.profiles p
    where p.id = new.reporter_id;

    -- Derive action_text from grievance title or description
    v_action_text := coalesce(new.title, new.description, 'Shared a concern');

    -- Insert into community_feed (skip if already exists for this grievance)
    insert into public.community_feed (
      user_id,
      user_name,
      user_initials,
      action_text,
      location,
      image_url,
      status,
      grievance_id
    ) values (
      new.reporter_id,
      v_user_name,
      v_user_initials,
      v_action_text,
      new.location,
      new.image_url,
      new.status,
      new.id
    )
    on conflict (grievance_id) do nothing;
  end if;

  return new;
end;
$$;

-- Drop trigger if exists then create
drop trigger if exists trg_auto_create_feed_on_approve on public.grievances;
create trigger trg_auto_create_feed_on_approve
  after update of approved on public.grievances
  for each row
  execute function public.auto_create_feed_on_approve();

-- Also fire on insert (for grievances that might be created with approved = true)
drop trigger if exists trg_auto_create_feed_on_insert on public.grievances;
create trigger trg_auto_create_feed_on_insert
  after insert on public.grievances
  for each row
  when (new.approved = true)
  execute function public.auto_create_feed_on_approve();

-- Revoke public execute; only the trigger calls it internally
revoke all on function public.auto_create_feed_on_approve from public, anon, authenticated;

-- Backfill: create feed entries for all existing approved grievances
-- that don't already have a feed entry
insert into public.community_feed (
  user_id,
  user_name,
  user_initials,
  action_text,
  location,
  image_url,
  status,
  grievance_id
)
select
  g.reporter_id,
  coalesce(p.username, 'Anonymous'),
  coalesce(left(p.username, 2), 'An'),
  coalesce(g.title, g.description, 'Shared a concern'),
  g.location,
  g.image_url,
  g.status,
  g.id
from public.grievances g
left join public.profiles p on p.id = g.reporter_id
left join public.community_feed f on f.grievance_id = g.id
where g.approved = true
  and f.id is null;

-- Sync feed status with grievance status on backfilled entries
update public.community_feed f
set status = g.status
from public.grievances g
where f.grievance_id = g.id
  and (f.status is null or f.status != g.status);

-- Notify PostgREST to reload schema
notify pgrst, 'reload schema';
