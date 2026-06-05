create or replace function public.adjust_points(
  p_reporter_id uuid,
  p_grievance_id uuid,
  p_delta integer,
  p_new_value integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set points = greatest(0, coalesce(points, 0) + p_delta)
  where id = p_reporter_id;

  update public.grievances
  set bonus_awarded = p_new_value
  where id = p_grievance_id;
end;
$$;
