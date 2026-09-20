-- Report detail queries include updated_at, but the grievances table did not
-- define it. The missing column caused PostgREST to reject the entire request.
alter table public.grievances
  add column if not exists updated_at timestamptz;

update public.grievances
set updated_at = created_at
where updated_at is null;

alter table public.grievances
  alter column updated_at set default now(),
  alter column updated_at set not null;

create or replace function public.set_grievance_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_grievance_updated_at on public.grievances;
create trigger trg_grievance_updated_at
  before update on public.grievances
  for each row
  execute function public.set_grievance_updated_at();

revoke all on function public.set_grievance_updated_at()
  from public, anon, authenticated;

notify pgrst, 'reload schema';
