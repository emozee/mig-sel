-- Revert soft-delete: drop column and unused functions

drop function if exists public.disapprove_grievance;

drop index if exists public.idx_grievances_deleted_at;

alter table public.grievances
  drop column if exists deleted_at;

-- Notify PostgREST to reload schema
notify pgrst, 'reload schema';
