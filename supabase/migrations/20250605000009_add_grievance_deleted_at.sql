-- Add deleted_at column for soft-delete support
alter table public.grievances
  add column if not exists deleted_at timestamptz;

create index if not exists idx_grievances_deleted_at
  on public.grievances (deleted_at);

-- Notify PostgREST to reload schema
notify pgrst, 'reload schema';
