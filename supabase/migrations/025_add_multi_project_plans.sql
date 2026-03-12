-- =============================================
-- 다수 프로젝트 이용권 추가 (plan_multi_100, plan_multi_200)
-- =============================================

-- 1) plan_type 체크 제약 조건 변경
ALTER TABLE project_plans DROP CONSTRAINT IF EXISTS project_plans_plan_type_check;
ALTER TABLE project_plans ADD CONSTRAINT project_plans_plan_type_check
  CHECK (plan_type IN ('free','plan_30','plan_50','plan_100','plan_multi_100','plan_multi_200'));

-- 2) activate_project_plan 함수 업데이트 (새 플랜 타입 추가)
CREATE OR REPLACE FUNCTION activate_project_plan(
  p_user_id  UUID,
  p_plan_type TEXT,
  p_order_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_max_eval INT;
  v_sms_quota INT;
  v_plan_id UUID;
BEGIN
  CASE p_plan_type
    WHEN 'plan_30' THEN v_max_eval := 30;  v_sms_quota := 60;
    WHEN 'plan_50' THEN v_max_eval := 50;  v_sms_quota := 100;
    WHEN 'plan_100' THEN v_max_eval := 100; v_sms_quota := 200;
    WHEN 'plan_multi_100' THEN v_max_eval := 100; v_sms_quota := 200;
    WHEN 'plan_multi_200' THEN v_max_eval := 200; v_sms_quota := 400;
    ELSE RAISE EXCEPTION 'Invalid plan type: %', p_plan_type;
  END CASE;

  INSERT INTO project_plans (user_id, plan_type, max_evaluators, sms_quota, order_id, status)
  VALUES (p_user_id, p_plan_type, v_max_eval, v_sms_quota, p_order_id, 'unassigned')
  RETURNING id INTO v_plan_id;

  RETURN v_plan_id;
END;
$$;
