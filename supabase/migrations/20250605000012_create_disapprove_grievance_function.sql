create or replace function public.disapprove_grievance(target_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reporter_id uuid;
  v_bonus_awarded integer;
begin
  -- Fetch grievance info
  select reporter_id, bonus_awarded
    into v_reporter_id, v_bonus_awarded
    from public.grievances
    where id = target_id;

  if not found then
    raise exception 'Grievance not found';
  end if;

  -- 1. Revoke points if any were awarded
  if v_bonus_awarded > 0 and v_reporter_id is not null then
    update public.profiles
      set points = greatest(0, coalesce(points, 0) - v_bonus_awarded)
      where id = v_reporter_id;
  end if;

  -- 2. Soft-delete the grievance
  update public.grievances
    set deleted_at = now(),
        bonus_awarded = 0
    where id = target_id;

  -- 3. Remove the community feed entry
  delete from public.community_feed
    where grievance_id = target_id;
end;
$$;
