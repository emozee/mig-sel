-- Fix toggle_feed_upvote function: ensure correct return type (new_upvote_count, is_upvoted)
-- and ensure only ONE trigger fires on community_feed_upvotes.

-- 1. Drop ALL triggers on community_feed_upvotes to eliminate duplicates
DO $$ DECLARE
  rec RECORD;
BEGIN
  FOR rec IN (
    SELECT trigger_name
    FROM information_schema.triggers
    WHERE event_object_table = 'community_feed_upvotes'
  ) LOOP
    EXECUTE 'DROP TRIGGER IF EXISTS "' || rec.trigger_name || '" ON public.community_feed_upvotes CASCADE';
  END LOOP;
END $$;

-- 2. Recreate trigger function
CREATE OR REPLACE FUNCTION sync_feed_upvote_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_feed
    SET upvote_count = upvote_count + 1
    WHERE id = NEW.feed_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_feed
    SET upvote_count = GREATEST(0, upvote_count - 1)
    WHERE id = OLD.feed_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- 3. Create exactly one trigger
CREATE TRIGGER trg_sync_feed_upvote_count
  AFTER INSERT OR DELETE ON community_feed_upvotes
  FOR EACH ROW
  EXECUTE FUNCTION sync_feed_upvote_count();

-- 4. Fix toggle_feed_upvote RPC with correct return type
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

-- 5. Recalculate upvote_count from actual upvote records
-- This fixes any inflation caused by duplicate triggers
UPDATE community_feed cf
SET upvote_count = COALESCE(
  (SELECT COUNT(*) FROM community_feed_upvotes WHERE feed_id = cf.id),
  0
);

-- 6. Refresh schema cache
NOTIFY pgrst, 'reload schema';
