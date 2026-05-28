-- Explicit GRANTs for the Data API
-- Supabase will soon require explicit grants for tables in the public schema
-- to be exposed via the auto-generated REST API.
--
-- This migration ensures all existing tables remain accessible.
-- Row-Level Security (RLS) policies control row-level access on top of these grants.

-- Schema access (required for the Data API to see tables)
grant usage on schema public to anon, authenticated;

-- grievances (complaint reporting)
grant select, insert, update on table public.grievances to anon, authenticated;
grant delete on table public.grievances to anon, authenticated;

-- profiles (user profiles with points, roles, etc.)
grant select, insert, update on table public.profiles to anon, authenticated;
grant delete on table public.profiles to anon, authenticated;

-- waste_records (waste tracking records)
grant select, insert, update on table public.waste_records to anon, authenticated;
grant delete on table public.waste_records to anon, authenticated;

-- community_feed (activity feed entries)
grant select, insert, update on table public.community_feed to anon, authenticated;
grant delete on table public.community_feed to anon, authenticated;

-- community_feed_comments (comments on feed entries)
grant select, insert, update on table public.community_feed_comments to anon, authenticated;
grant delete on table public.community_feed_comments to anon, authenticated;

-- community_feed_upvotes (upvotes on feed entries)
grant select, insert, update on table public.community_feed_upvotes to anon, authenticated;
grant delete on table public.community_feed_upvotes to anon, authenticated;

-- RPC functions (required for the API to call them)
grant execute on function public.toggle_feed_upvote to anon, authenticated;
grant execute on function public.adjust_points to anon, authenticated;
grant execute on function public.search_user_by_email to anon, authenticated;
grant execute on function public.update_user_role to anon, authenticated;
