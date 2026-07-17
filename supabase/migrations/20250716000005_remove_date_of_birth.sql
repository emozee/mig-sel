-- Remove date_of_birth column (not needed)
alter table public.profiles drop column if exists date_of_birth;
