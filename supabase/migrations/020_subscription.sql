-- =============================================
-- 구독 시스템 RPC 함수
-- user_profiles 컬럼(plan_type, plan_expires_at, trial_started_at, trial_expires_at,
--   sms_used_this_month, sms_month_reset)은 이미 수동 추가 완료
-- =============================================

-- 1) activate_subscription: 결제 후 구독 활성화 (30일)
CREATE OR REPLACE FUNCTION activate_subscription(
  p_user_id UUID,
  p_plan_type TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_profiles
  SET plan_type       = p_plan_type,
      plan_expires_at = NOW() + INTERVAL '30 days'
  WHERE id = p_user_id;
END;
$$;

-- 2) check_plan_expiry: 만료 확인 + 자동 다운그레이드
CREATE OR REPLACE FUNCTION check_plan_expiry(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan TEXT;
  v_expires TIMESTAMPTZ;
  v_trial_expires TIMESTAMPTZ;
  v_days INT;
  v_is_trialing BOOLEAN := FALSE;
BEGIN
  SELECT plan_type, plan_expires_at, trial_expires_at
  INTO v_plan, v_expires, v_trial_expires
  FROM user_profiles
  WHERE id = p_user_id;

  -- 체험 중인지 확인
  IF v_trial_expires IS NOT NULL AND v_trial_expires > NOW() THEN
    v_is_trialing := TRUE;
    v_days := GREATEST(0, EXTRACT(DAY FROM (v_trial_expires - NOW()))::INT);
    -- 체험 만료 확인
  ELSIF v_trial_expires IS NOT NULL AND v_trial_expires <= NOW() AND v_plan != 'free' AND v_expires IS NULL THEN
    -- 체험 만료 → 다운그레이드
    UPDATE user_profiles
    SET plan_type = 'free', trial_expires_at = v_trial_expires
    WHERE id = p_user_id;
    v_plan := 'free';
    v_days := 0;
  END IF;

  -- 유료 구독 만료 확인
  IF v_expires IS NOT NULL THEN
    IF v_expires <= NOW() THEN
      UPDATE user_profiles
      SET plan_type = 'free', plan_expires_at = NULL
      WHERE id = p_user_id;
      v_plan := 'free';
      v_days := 0;
    ELSE
      v_days := GREATEST(0, EXTRACT(DAY FROM (v_expires - NOW()))::INT);
    END IF;
  ELSIF NOT v_is_trialing THEN
    v_days := 0;
  END IF;

  RETURN json_build_object(
    'plan_type', v_plan,
    'days_remaining', COALESCE(v_days, 0),
    'is_trialing', v_is_trialing,
    'plan_expires_at', v_expires,
    'trial_expires_at', v_trial_expires
  );
END;
$$;

-- 3) grant_trial: 1회 체험 부여 (7일 Basic)
CREATE OR REPLACE FUNCTION grant_trial(
  p_user_id UUID,
  p_days INT DEFAULT 7
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trial TIMESTAMPTZ;
BEGIN
  SELECT trial_started_at INTO v_trial
  FROM user_profiles
  WHERE id = p_user_id;

  -- 이미 체험을 받은 적이 있으면 거절
  IF v_trial IS NOT NULL THEN
    RETURN FALSE;
  END IF;

  UPDATE user_profiles
  SET plan_type        = 'basic',
      trial_started_at = NOW(),
      trial_expires_at = NOW() + (p_days || ' days')::INTERVAL
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$;
