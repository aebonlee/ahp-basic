-- 033: community_posts 테이블 + RLS + RPC
-- 커뮤니티 게시판 (공지사항, Q&A, 연구팀원 모집, 평가자 모집)
-- 컬럼명 category → post_category (PostgreSQL 예약어 충돌 회피)

CREATE TABLE community_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_category TEXT NOT NULL CHECK (post_category IN ('notice','qna','recruit-team','recruit-evaluator')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_community_posts_category ON community_posts(post_category);
CREATE INDEX idx_community_posts_created ON community_posts(created_at DESC);
CREATE INDEX idx_community_posts_author ON community_posts(author_id);

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "community_posts_select" ON community_posts
  FOR SELECT USING (true);

CREATE POLICY "community_posts_insert" ON community_posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "community_posts_update" ON community_posts
  FOR UPDATE USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "community_posts_delete" ON community_posts
  FOR DELETE USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

CREATE OR REPLACE FUNCTION get_community_posts(
  p_category TEXT,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  out_id UUID,
  out_category TEXT,
  out_title TEXT,
  out_content TEXT,
  out_author_id UUID,
  out_author_name TEXT,
  out_views INTEGER,
  out_created_at TIMESTAMPTZ,
  out_updated_at TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    cp.id, cp.post_category, cp.title, cp.content,
    cp.author_id, cp.author_name, cp.views,
    cp.created_at, cp.updated_at
  FROM community_posts cp
  WHERE cp.post_category = p_category
  ORDER BY cp.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

CREATE OR REPLACE FUNCTION create_community_post(
  p_category TEXT,
  p_title TEXT,
  p_content TEXT
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
  v_name TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_category NOT IN ('notice','qna','recruit-team','recruit-evaluator') THEN
    RAISE EXCEPTION 'Invalid category: %', p_category;
  END IF;

  IF p_category = 'notice' THEN
    IF NOT EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'superadmin'
    ) THEN
      RAISE EXCEPTION 'Only superadmin can post notices';
    END IF;
  END IF;

  SELECT display_name INTO v_name
  FROM user_profiles WHERE id = auth.uid();

  INSERT INTO community_posts (post_category, title, content, author_id, author_name)
  VALUES (p_category, p_title, p_content, auth.uid(), COALESCE(v_name, '익명'))
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION delete_community_post(p_post_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  DELETE FROM community_posts
  WHERE id = p_post_id
    AND (
      author_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND role = 'superadmin'
      )
    );

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION increment_post_views(p_post_id UUID)
RETURNS VOID
LANGUAGE sql SECURITY DEFINER
AS $$
  UPDATE community_posts
  SET views = views + 1
  WHERE id = p_post_id;
$$;
