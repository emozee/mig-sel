-- Add linking and status columns to diamonds table
alter table public.diamonds
  add column linked_grievance_id uuid references public.grievances(id) on delete set null,
  add column status text not null default 'pending',
  add column direct_solve_awarded boolean not null default false;

-- Index for looking up diamonds by linked grievance
create index if not exists diamonds_linked_grievance_idx on public.diamonds (linked_grievance_id);

-- Function to award 10 points when a diamond is accepted (direct solve)
-- Uses BEFORE trigger so direct_solve_awarded is set before row save, avoiding recursion
create or replace function public.award_direct_solve_points()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'accepted' and old.status != 'accepted' and new.linked_grievance_id is not null and not new.direct_solve_awarded then
    new.direct_solve_awarded := true;

    update public.profiles
    set points = coalesce(points, 0) + 10
    where id = new.user_id;
  end if;
  return new;
end;
$$;

-- BEFORE trigger to auto-award points on status change to accepted
create trigger trg_diamond_direct_solve
  before update of status on public.diamonds
  for each row
  execute function public.award_direct_solve_points();

-- Function for admins to accept a diamond post
create or replace function public.accept_diamond(diamond_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.diamonds
  set status = 'accepted'
  where id = diamond_id
    and status = 'pending'
    and linked_grievance_id is not null;
end;
$$;

grant execute on function public.accept_diamond to authenticated;
grant execute on function public.award_direct_solve_points to authenticated;
