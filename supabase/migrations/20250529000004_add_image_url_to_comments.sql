-- Add image_url column to community_feed_comments for comment images
alter table public.community_feed_comments
  add column image_url text;
