-- =============================================
-- 다수 프로젝트 이용권: 사용자 레벨 적용
-- plan_multi_100/plan_multi_200는 project_id=NULL로 유지,
-- 활성화 시 사용자의 모든 프로젝트에 자동 적용
-- =============================================

-- 1) is_multi_plan 헬퍼 함수
CREATE OR REPLACE FUNCTION is_multi_plan(p_plan_type TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT p_plan_type IN ('plan_multi_100', 'plan_multi_200');
$$;

-- 2) activate_multi_plan: 다수 이용권 활성화 (project_id=NULL 유지, 사용자 레벨)
CREATE OR REPLACE FUNCTION activate_multi_plan(
  p_plan_id  UUID,
  p_user_id  UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status    TEXT;
  v_user_id   UUID;
  v_plan_type TEXT;
  v_existing  UUID;
BEGIN
  -- 플랜 조회
  SELECT status, user_id, plan_type
  INTO v_status, v_user_id, v_plan_type
  FROM project_plans
  WHERE id = p_plan_id;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Plan not found';
  END IF;

  -- 소유권 검증
  IF v_user_id != p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- unassigned 상태 검증
  IF v_status != 'unassigned' THEN
    RAISE EXCEPTION 'Plan is already activated or expired';
  END IF;

  -- multi-plan 타입 검증
  IF NOT is_multi_plan(v_plan_type) THEN
    RAISE EXCEPTION 'This is not a multi-plan. Use assign_plan_to_project instead.';
  END IF;

  -- 이미 active multi-plan이 있으면 에러
  SELECT id INTO v_existing
  FROM project_plans
  WHERE user_id = p_user_id
    AND is_multi_plan(plan_type)
    AND status = 'active'
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RAISE EXCEPTION 'Already have an active multi-plan';
  END IF;

  -- 활성화: project_id=NULL 유지, 30일 타이머
  UPDATE project_plans
  SET assigned_at = NOW(),
      expires_at  = NOW() + INTERVAL '30 days',
      status      = 'active'
  WHERE id = p_plan_id;
END;
$$;

-- 3) get_project_plan 업데이트: multi-plan fallback 추가
CREATE OR REPLACE FUNCTION get_project_plan(p_project_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan project_plans%ROWTYPE;
  v_project_user_id UUID;
BEGIN
  -- Step 1: 프로젝트별 active/expired 플랜 (free 제외)
  SELECT * INTO v_plan
  FROM project_plans
  WHERE project_id = p_project_id
    AND plan_type != 'free'
    AND status IN ('active', 'expired')
  ORDER BY assigned_at DESC
  LIMIT 1;

  -- Step 2: 사용자 레벨 active multi-plan (project_id IS NULL)
  IF v_plan.id IS NULL THEN
    SELECT user_id INTO v_project_user_id
    FROM projects
    WHERE id = p_project_id;

    IF v_project_user_id IS NOT NULL THEN
      SELECT * INTO v_plan
      FROM project_plans
      WHERE user_id = v_project_user_id
        AND is_multi_plan(plan_type)
        AND status IN ('active', 'expired')
        AND project_id IS NULL
      ORDER BY assigned_at DESC
      LIMIT 1;
    END IF;
  END IF;

  -- Step 3: 프로젝트별 free 플랜
  IF v_plan.id IS NULL THEN
    SELECT * INTO v_plan
    FROM project_plans
    WHERE project_id = p_project_id
      AND plan_type = 'free'
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_plan.id IS NULL THEN
      RETURN NULL;
    END IF;
  END IF;

  -- 만료 자동 처리 (유료 플랜만)
  IF v_plan.plan_type != 'free'
     AND v_plan.expires_at IS NOT NULL
     AND v_plan.expires_at <= NOW()
     AND v_plan.status = 'active' THEN
    UPDATE project_plans SET status = 'expired' WHERE id = v_plan.id;
    v_plan.status := 'expired';
  END IF;

  RETURN json_build_object(
    'id', v_plan.id,
    'user_id', v_plan.user_id,
    'project_id', v_plan.project_id,
    'plan_type', v_plan.plan_type,
    'max_evaluators', v_plan.max_evaluators,
    'sms_quota', v_plan.sms_quota,
    'sms_used', v_plan.sms_used,
    'order_id', v_plan.order_id,
    'purchased_at', v_plan.purchased_at,
    'assigned_at', v_plan.assigned_at,
    'expires_at', v_plan.expires_at,
    'status', v_plan.status
  );
END;
$$;

-- 4) increment_sms_used 업데이트: multi-plan fallback 추가
CREATE OR REPLACE FUNCTION increment_sms_used(
  p_project_id UUID,
  p_count      INT DEFAULT 1
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan project_plans%ROWTYPE;
  v_project_user_id UUID;
BEGIN
  -- Step 1: 프로젝트별 active 플랜
  SELECT * INTO v_plan
  FROM project_plans
  WHERE project_id = p_project_id
    AND status = 'active'
  ORDER BY assigned_at DESC
  LIMIT 1;

  -- Step 2: 사용자 레벨 active multi-plan
  IF v_plan.id IS NULL THEN
    SELECT user_id INTO v_project_user_id
    FROM projects
    WHERE id = p_project_id;

    IF v_project_user_id IS NOT NULL THEN
      SELECT * INTO v_plan
      FROM project_plans
      WHERE user_id = v_project_user_id
        AND is_multi_plan(plan_type)
        AND status = 'active'
        AND project_id IS NULL
      ORDER BY assigned_at DESC
      LIMIT 1;
    END IF;
  END IF;

  -- Step 3: free 플랜
  IF v_plan.id IS NULL THEN
    SELECT * INTO v_plan
    FROM project_plans
    WHERE project_id = p_project_id
      AND plan_type = 'free'
    LIMIT 1;
  END IF;

  IF v_plan.id IS NULL THEN
    RAISE EXCEPTION 'No active plan for this project';
  END IF;

  IF (v_plan.sms_used + p_count) > v_plan.sms_quota THEN
    RETURN json_build_object(
      'success', false,
      'error', 'SMS quota exceeded',
      'sms_used', v_plan.sms_used,
      'sms_quota', v_plan.sms_quota
    );
  END IF;

  UPDATE project_plans
  SET sms_used = sms_used + p_count
  WHERE id = v_plan.id;

  RETURN json_build_object(
    'success', true,
    'sms_used', v_plan.sms_used + p_count,
    'sms_quota', v_plan.sms_quota
  );
END;
$$;
