-- Fix: the DELETE WHERE clause used `grievance_id = grievance_id` which
-- compared the column to itself (always true), either deleting all feed
-- entries or failing with FK violations and rolling back the whole tx.
-- The fix copies the input param to a local variable so the column ref
-- doesn't shadow the param ref.

create or replace function public.disapprove_grievance(grievance_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reporter_id uuid;
  v_bonus_awarded integer;
  v_grievance_id uuid;
begin
  v_grievance_id := grievance_id;

  select reporter_id, bonus_awarded
    into v_reporter_id, v_bonus_awarded
    from public.grievances
    where id = v_grievance_id;

  if not found then
    raise exception 'Grievance not found';
  end if;

  if v_bonus_awarded > 0 and v_reporter_id is not null then
    update public.profiles
      set points = greatest(0, coalesce(points, 0) - v_bonus_awarded)
      where id = v_reporter_id;
  end if;

  update public.grievances
    set deleted_at = now(),
        bonus_awarded = 0
    where id = v_grievance_id;

  delete from public.community_feed
    where grievance_id = v_grievance_id;
end;
$$;