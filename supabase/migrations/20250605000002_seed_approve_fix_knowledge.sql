-- Seed chatbot knowledge about the approve fix
insert into public.chatbot_knowledge (question, answer)
values
  (
    'why does approve button not work',
    'The approve action requires a UNIQUE constraint on community_feed.grievance_id. If the constraint was missing, the database trigger would fail with error 42P10, rolling back the entire approval. Run the migration 20250605000001 to add the constraint.'
  ),
  (
    'grievance stays in unapproved after clicking approve',
    'This is caused by a missing unique constraint on community_feed.grievance_id. The auto_create_feed_on_approve trigger fails, which rolls back the UPDATE that sets approved=true. Run migration 20250605000001_fix_feed_grievance_id_unique.sql to add the constraint.'
  ),
  (
    'approve grievance reappears in unapproved list',
    'The database trigger that creates the feed entry on approval requires a unique constraint on community_feed.grievance_id for its ON CONFLICT clause. If the constraint is missing, the trigger throws error 42P10 and the entire approval UPDATE is rolled back. Apply migration 20250605000001 to fix.'
  ),
  (
    'error 42P10 on grievance approval',
    'Error 42P10 "no unique or exclusion constraint matching the ON CONFLICT specification" occurs in the auto_create_feed_on_approve trigger. This means community_feed.grievance_id lacks a UNIQUE constraint. Run migration 20250605000001_fix_feed_grievance_id_unique.sql to add it.'
  )
on conflict (question) do nothing;
