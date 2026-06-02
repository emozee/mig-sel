import https from 'node:https';

const PROJECT_REF = 'sblxdxqoxnmgctdmuvtb';

const SQL = `
CREATE TABLE IF NOT EXISTS community_feed_comments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  feed_id BIGINT NOT NULL REFERENCES community_feed(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_initials TEXT NOT NULL,
  body TEXT NOT NULL CHECK (char_length(body) > 0 AND char_length(body) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'community_feed_comments' AND column_name = 'body'
  ) THEN
    ALTER TABLE community_feed_comments ADD COLUMN body TEXT NOT NULL CHECK (char_length(body) > 0 AND char_length(body) <= 1000);
  END IF;
END $$;

ALTER TABLE community_feed_comments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_feed_comments' AND policyname = 'Users can view all comments') THEN
    CREATE POLICY "Users can view all comments" ON community_feed_comments FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_feed_comments' AND policyname = 'Users can insert their own comments') THEN
    CREATE POLICY "Users can insert their own comments" ON community_feed_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_feed_comments' AND policyname = 'Users can delete their own comments') THEN
    CREATE POLICY "Users can delete their own comments" ON community_feed_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION update_feed_comment_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_feed SET comment_count = comment_count + 1 WHERE id = NEW.feed_id; RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_feed SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.feed_id; RETURN OLD;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS on_comment_insert_delete ON community_feed_comments;
CREATE TRIGGER on_comment_insert_delete AFTER INSERT OR DELETE ON community_feed_comments FOR EACH ROW EXECUTE FUNCTION update_feed_comment_count();

CREATE INDEX IF NOT EXISTS idx_community_feed_comments_feed_id ON community_feed_comments(feed_id);
CREATE INDEX IF NOT EXISTS idx_community_feed_comments_created_at ON community_feed_comments(created_at DESC);

NOTIFY pgrst, 'reload schema';
`;

function runQuery(token, query) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query });
    const req = https.request(
      {
        hostname: 'api.supabase.com',
        path: `/v1/projects/${PROJECT_REF}/database/query`,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) resolve(JSON.parse(data || '[]'));
          else reject(new Error(`${res.statusCode}: ${data}`));
        });
      },
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const token = process.env.SUPABASE_PAT || process.argv[2];
if (!token) {
  console.error('Usage: SUPABASE_PAT=sbp_xxx node run-migration.mjs');
  console.error('Or ask your friend to create a token at: https://supabase.com/dashboard/account/tokens');
  process.exit(1);
}

console.log('Running migration...');
try {
  const result = await runQuery(token, SQL);
  console.log('Migration successful!');
  console.log(JSON.stringify(result, null, 2));
} catch (err) {
  console.error('Migration failed:', err.message);
  process.exit(1);
}
