-- =============================================
-- 032: 모집 공고 텍스트 (recruit_description) 추가
-- =============================================

-- 1) projects 테이블에 recruit_description 컬럼 추가
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS recruit_description TEXT;

-- 2) get_marketplace_projects() RPC 수정: recruit_description 반환 추가
CREATE OR REPLACE FUNCTION public.get_marketplace_projects()
RETURNS TABLE(
  id UUID,
  name TEXT,
  description TEXT,
  eval_method INTEGER,
  reward_points INTEGER,
  recruit_description TEXT,
  owner_name TEXT,
  evaluator_count BIGINT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.description,
    p.eval_method,
    p.reward_points,
    p.recruit_description,
    COALESCE(u.display_name, u.email, '연구자') AS owner_name,
    (SELECT COUNT(*) FROM evaluators e WHERE e.project_id = p.id) AS evaluator_count,
    p.created_at
  FROM projects p
  LEFT JOIN user_profiles u ON u.id = p.owner_id
  WHERE p.recruit_evaluators = TRUE
    AND p.status = 1  -- EVALUATING
    AND p.reward_points > 0
  ORDER BY p.created_at DESC;
END;
$$;
