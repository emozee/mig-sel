-- Drop ALL overloads of toggle_feed_upvote to resolve the PGRST203 ambiguity error.
-- The old modified function had an extra p_user_id parameter causing two overloads.

-- Drop both known overloads explicitly
DROP FUNCTION IF EXISTS toggle_feed_upvote(BIGINT);
DROP FUNCTION IF EXISTS toggle_feed_upvote(BIGINT, UUID);

-- Also drop any other overload via a DO block (safety net)
DO $$ DECLARE
  rec RECORD;
BEGIN
  FOR rec IN (
    SELECT proname, pg_get_function_identity_arguments(p.oid) as args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'toggle_feed_upvote'
  ) LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS public.toggle_feed_upvote(' || rec.args || ') CASCADE';
  END LOOP;
END $$;

-- Recreate with the correct, single overload
CREATE OR REPLACE FUNCTION toggle_feed_upvote(p_feed_id BIGINT)
RETURNS TABLE (new_upvote_count INT, is_upvoted BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_exists BOOLEAN;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Must be authenticated to toggle upvote';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.community_feed_upvotes
    WHERE feed_id = p_feed_id AND user_id = v_user_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM public.community_feed_upvotes
    WHERE feed_id = p_feed_id AND user_id = v_user_id;
  ELSE
    INSERT INTO public.community_feed_upvotes (feed_id, user_id)
    VALUES (p_feed_id, v_user_id);
  END IF;

  RETURN QUERY
  SELECT cf.upvote_count, NOT v_exists
  FROM public.community_feed cf
  WHERE cf.id = p_feed_id;
END;
$$;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
