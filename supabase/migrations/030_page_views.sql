-- 030: 방문자 카운팅 — page_views 테이블 + RPC

-- ─── 1) 테이블 ───
CREATE TABLE IF NOT EXISTS public.page_views (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  path       TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  user_id    UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_visitor_id ON public.page_views (visitor_id);

-- ─── 2) RLS ───
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- 누구나 INSERT (anon 포함)
CREATE POLICY "page_views_insert" ON public.page_views
  FOR INSERT WITH CHECK (true);

-- SELECT는 superadmin만
CREATE POLICY "page_views_select_superadmin" ON public.page_views
  FOR SELECT USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'superadmin'
  );

-- ─── 3) record_page_view — 방문 기록 삽입 (anon 호출 가능) ───
CREATE OR REPLACE FUNCTION public.record_page_view(
  p_path       TEXT,
  p_visitor_id TEXT,
  p_user_id    UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO page_views (path, visitor_id, user_id)
  VALUES (p_path, p_visitor_id, p_user_id);
END; $$;

-- ─── 4) sa_visitor_stats — 통계 조회 (superadmin 전용) ───
CREATE OR REPLACE FUNCTION public.sa_visitor_stats(p_days INT DEFAULT 30)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public AS $$
DECLARE
  result JSONB;
  v_today DATE := CURRENT_DATE;
  v_start DATE := CURRENT_DATE - (p_days - 1);
BEGIN
  PERFORM assert_superadmin();

  SELECT jsonb_build_object(
    'total_views',   (SELECT count(*) FROM page_views),
    'total_unique',  (SELECT count(DISTINCT visitor_id) FROM page_views),
    'today_views',   (SELECT count(*) FROM page_views WHERE created_at::date = v_today),
    'today_unique',  (SELECT count(DISTINCT visitor_id) FROM page_views WHERE created_at::date = v_today),
    'daily', (
      SELECT coalesce(jsonb_agg(row_to_json(d)::jsonb ORDER BY d.date), '[]'::jsonb)
      FROM (
        SELECT
          gs::date AS date,
          coalesce(pv.views, 0) AS views,
          coalesce(pv.unique_visitors, 0) AS unique_visitors
        FROM generate_series(v_start, v_today, '1 day'::interval) gs
        LEFT JOIN (
          SELECT created_at::date AS d,
                 count(*) AS views,
                 count(DISTINCT visitor_id) AS unique_visitors
          FROM page_views
          WHERE created_at::date >= v_start
          GROUP BY created_at::date
        ) pv ON pv.d = gs::date
      ) d
    ),
    'by_page', (
      SELECT coalesce(jsonb_agg(row_to_json(p)::jsonb), '[]'::jsonb)
      FROM (
        SELECT path,
               count(*) AS views,
               count(DISTINCT visitor_id) AS unique_visitors
        FROM page_views
        GROUP BY path
        ORDER BY count(*) DESC
        LIMIT 20
      ) p
    )
  ) INTO result;

  RETURN result;
END; $$;
