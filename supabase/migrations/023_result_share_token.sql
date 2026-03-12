-- 023: 결과 공유 토큰 컬럼 + RPC 함수
-- 프로젝트 소유자가 공유 링크를 생성하면, 비로그인 사용자가 결과를 읽을 수 있다.

-- 1. projects 테이블에 result_share_token 컬럼 추가
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS result_share_token UUID UNIQUE;

-- 2. RPC: get_shared_result
--    토큰으로 프로젝트를 찾아 결과 표시에 필요한 모든 데이터를 JSON으로 반환
--    SECURITY DEFINER → RLS 우회, anon 호출 가능
CREATE OR REPLACE FUNCTION get_shared_result(p_token UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id UUID;
  v_result JSONB;
BEGIN
  -- 토큰으로 프로젝트 찾기
  SELECT id INTO v_project_id
    FROM projects
   WHERE result_share_token = p_token;

  IF v_project_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- 한번에 JSON 조립
  SELECT jsonb_build_object(
    'project', (
      SELECT jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'eval_method', p.eval_method
      )
      FROM projects p WHERE p.id = v_project_id
    ),
    'criteria', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'name', c.name,
          'parent_id', c.parent_id,
          'sort_order', c.sort_order
        ) ORDER BY c.sort_order
      )
      FROM criteria c WHERE c.project_id = v_project_id
    ), '[]'::jsonb),
    'alternatives', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', a.id,
          'name', a.name,
          'sort_order', a.sort_order
        ) ORDER BY a.sort_order
      )
      FROM alternatives a WHERE a.project_id = v_project_id
    ), '[]'::jsonb),
    'evaluators', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', e.id,
          'name', e.name
        ) ORDER BY e.name
      )
      FROM evaluators e WHERE e.project_id = v_project_id
    ), '[]'::jsonb),
    'comparisons', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'evaluator_id', pc.evaluator_id,
          'criterion_id', pc.criterion_id,
          'row_id', pc.row_id,
          'col_id', pc.col_id,
          'value', pc.value
        )
      )
      FROM pairwise_comparisons pc WHERE pc.project_id = v_project_id
    ), '[]'::jsonb),
    'direct_inputs', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'evaluator_id', di.evaluator_id,
          'criterion_id', di.criterion_id,
          'item_id', di.item_id,
          'value', di.value
        )
      )
      FROM direct_input_values di WHERE di.project_id = v_project_id
    ), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- anon 사용자도 호출 가능
GRANT EXECUTE ON FUNCTION get_shared_result(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_shared_result(UUID) TO authenticated;
