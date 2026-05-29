-- Add username_edit_count to profiles to enforce 2-edit limit on display names
alter table public.profiles
  add column if not exists username_edit_count integer not null default 0;
