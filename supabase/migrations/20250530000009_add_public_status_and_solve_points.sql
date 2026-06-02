-- Add 'public' status support and award points for diamond direct solve
-- When admin accepts a diamond, linked grievance is resolved and points awarded:
--   uploader (grievance reporter): 4 pts
--   volunteer (diamond owner): 10 pts (already handled by existing trigger)

-- Recreate accept_diamond to also resolve the linked grievance and award 4 pts to the uploader
create or replace function public.accept_diamond(diamond_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_linked_grievance_id uuid;
  v_grievance_reporter_id uuid;
begin
  -- Get linked grievance info before updating diamond
  select d.linked_grievance_id, g.reporter_id
  into v_linked_grievance_id, v_grievance_reporter_id
  from public.diamonds d
  left join public.grievances g on g.id = d.linked_grievance_id
  where d.id = diamond_id
    and d.status = 'pending'
    and d.linked_grievance_id is not null;

  if v_linked_grievance_id is null then
    return;
  end if;

  -- Update diamond status to accepted (triggers award_direct_solve_points for 10 pts to owner + collabs)
  update public.diamonds
  set status = 'accepted'
  where id = diamond_id
    and status = 'pending'
    and linked_grievance_id is not null;

  -- Mark the linked grievance as resolved
  update public.grievances
  set status = 'resolved',
      resolved_at = now()
  where id = v_linked_grievance_id
    and status != 'resolved';

  -- Award 4 points to the grievance reporter (uploader)
  if v_grievance_reporter_id is not null then
    update public.profiles
    set points = coalesce(points, 0) + 4
    where id = v_grievance_reporter_id;
  end if;
end;
$$;

-- Reject should also unlink the grievance if needed (kept same logic)
create or replace function public.reject_diamond(diamond_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.diamonds
  set status = 'rejected'
  where id = diamond_id
    and status = 'pending'
    and linked_grievance_id is not null;
end;
$$;

grant execute on function public.accept_diamond to authenticated;
grant execute on function public.reject_diamond to authenticated;
