alter table public.announcements
  add column type text not null default 'announcement'
  check (type in ('announcement', 'important_notice'));
