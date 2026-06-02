alter table public.grievances
  add column if not exists approved boolean not null default false;
