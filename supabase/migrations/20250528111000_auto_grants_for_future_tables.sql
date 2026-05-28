-- Auto-grant permissions on all future tables, views, and functions
-- so the Data API exposes them automatically without manual GRANTs.
--
-- These apply to objects created *after* this migration runs.
-- Covers objects created by the postgres role (supabase CLI migrations).

-- Tables (and views)
alter default privileges for role postgres in schema public
  grant select, insert, update, delete on tables to anon, authenticated;

-- Sequences (needed if tables use serial/bigserial/identity columns)
alter default privileges for role postgres in schema public
  grant usage, select on sequences to anon, authenticated;

-- Functions (and procedures)
alter default privileges for role postgres in schema public
  grant execute on functions to anon, authenticated;
