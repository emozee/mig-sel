-- Add expires_at column to announcements
-- Default: 7 days for regular announcements, 3 days for important_notice

alter table public.announcements
  add column expires_at timestamptz;

-- Set default expires_at for existing rows based on type
update public.announcements
  set expires_at = created_at + interval '7 days'
  where type = 'announcement' and expires_at is null;

update public.announcements
  set expires_at = created_at + interval '3 days'
  where type = 'important_notice' and expires_at is null;
