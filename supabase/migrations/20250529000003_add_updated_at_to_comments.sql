-- Add updated_at column to community_feed_comments for edit tracking
alter table public.community_feed_comments
  add column updated_at timestamptz;

-- Auto-set updated_at on any update
create or replace function public.set_comment_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_comment_updated_at
  before update on public.community_feed_comments
  for each row
  execute function public.set_comment_updated_at();

-- Grant execute on the trigger function so the Data API can use it
grant execute on function public.set_comment_updated_at to anon, authenticated;
