-- Add 'public' to the grievances status check constraint
-- The original constraint was created in the base schema (not in a migration file)

alter table public.grievances
  drop constraint if exists grievances_status_check;

alter table public.grievances
  add constraint grievances_status_check
  check (status in ('pending', 'in-progress', 'resolved', 'public'));
