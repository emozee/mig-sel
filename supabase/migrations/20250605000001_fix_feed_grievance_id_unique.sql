-- Fix missing unique constraint on community_feed.grievance_id
-- The previous migration wrapped the constraint in `if not exists (column)`,
-- so it was never created if the column pre-existed without the constraint.
-- This causes the trigger `auto_create_feed_on_approve` to fail with error 42P10
-- ("no unique constraint matching ON CONFLICT"), rolling back approval updates.

do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints tc
    join information_schema.constraint_column_usage ccu
      on tc.constraint_name = ccu.constraint_name
      and tc.table_schema = ccu.table_schema
    where tc.table_name = 'community_feed'
      and tc.table_schema = 'public'
      and tc.constraint_type = 'UNIQUE'
      and ccu.column_name = 'grievance_id'
  ) then
    alter table public.community_feed
      add constraint community_feed_grievance_id_unique unique (grievance_id);
  end if;
end;
$$;

notify pgrst, 'reload schema';
