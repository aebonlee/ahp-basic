-- =============================================
-- 031: 평가자 포인트 & 마켓플레이스 시스템
-- =============================================

-- 1) user_profiles: role CHECK에 'evaluator' 추가 + points_balance 컬럼
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('user', 'admin', 'superadmin', 'evaluator'));

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS points_balance INTEGER DEFAULT 0;

-- 2) projects: reward_points + recruit_evaluators 컬럼
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS reward_points INTEGER DEFAULT 0;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS recruit_evaluators BOOLEAN DEFAULT FALSE;

-- 3) point_transactions 테이블
CREATE TABLE IF NOT EXISTS public.point_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('earn', 'withdraw', 'withdraw_refund', 'convert')),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  evaluator_id UUID REFERENCES public.evaluators(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "point_tx_own_select" ON public.point_transactions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "point_tx_sa_select" ON public.point_transactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

CREATE INDEX IF NOT EXISTS idx_point_tx_user ON public.point_transactions(user_id, created_at DESC);

-- 4) withdrawal_requests 테이블
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_holder TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wd_own_select" ON public.withdrawal_requests
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "wd_sa_select" ON public.withdrawal_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

CREATE INDEX IF NOT EXISTS idx_wd_user ON public.withdrawal_requests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wd_status ON public.withdrawal_requests(status);

-- 5) 마켓플레이스 프로젝트 조회를 위한 RLS 정책 추가
CREATE POLICY "projects_marketplace_select" ON public.projects
  FOR SELECT USING (recruit_evaluators = TRUE AND status = 1);

-- =============================================
-- RPC 함수들
-- =============================================

-- 6) earn_evaluation_points: 평가 완료 시 포인트 자동 적립
CREATE OR REPLACE FUNCTION public.earn_evaluation_points()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_project_id UUID;
  v_reward INTEGER;
  v_balance INTEGER;
BEGIN
  -- completed가 FALSE→TRUE로 변경될 때만 실행
  IF OLD.completed = TRUE OR NEW.completed = FALSE THEN
    RETURN NEW;
  END IF;

  v_user_id := NEW.user_id;
  v_project_id := NEW.project_id;

  -- user_id가 없는 익명 평가자는 적립 불가
  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- 프로젝트 보상 포인트 조회
  SELECT reward_points INTO v_reward
  FROM projects WHERE id = v_project_id;

  IF v_reward IS NULL OR v_reward <= 0 THEN
    RETURN NEW;
  END IF;

  -- FOR UPDATE로 race condition 방지
  SELECT points_balance INTO v_balance
  FROM user_profiles WHERE id = v_user_id FOR UPDATE;

  v_balance := COALESCE(v_balance, 0) + v_reward;

  UPDATE user_profiles
  SET points_balance = v_balance
  WHERE id = v_user_id;

  INSERT INTO point_transactions (user_id, type, amount, balance_after, description, project_id, evaluator_id)
  VALUES (v_user_id, 'earn', v_reward, v_balance, '평가 완료 보상', v_project_id, NEW.id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_earn_points ON public.evaluators;
CREATE TRIGGER trg_earn_points
  AFTER UPDATE OF completed ON public.evaluators
  FOR EACH ROW
  EXECUTE FUNCTION public.earn_evaluation_points();

-- 7) request_withdrawal: 출금 요청
CREATE OR REPLACE FUNCTION public.request_withdrawal(
  p_amount INTEGER,
  p_bank TEXT,
  p_account TEXT,
  p_holder TEXT
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance INTEGER;
  v_req_id UUID;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION '출금 금액은 0보다 커야 합니다.';
  END IF;

  SELECT points_balance INTO v_balance
  FROM user_profiles WHERE id = auth.uid() FOR UPDATE;

  IF v_balance IS NULL OR v_balance < p_amount THEN
    RAISE EXCEPTION '잔액이 부족합니다. (현재: %P)', COALESCE(v_balance, 0);
  END IF;

  v_balance := v_balance - p_amount;

  UPDATE user_profiles SET points_balance = v_balance WHERE id = auth.uid();

  INSERT INTO withdrawal_requests (user_id, amount, bank_name, account_number, account_holder)
  VALUES (auth.uid(), p_amount, p_bank, p_account, p_holder)
  RETURNING id INTO v_req_id;

  INSERT INTO point_transactions (user_id, type, amount, balance_after, description)
  VALUES (auth.uid(), 'withdraw', -p_amount, v_balance, '출금 요청 (' || p_bank || ')');

  RETURN v_req_id;
END;
$$;

-- 8) sa_process_withdrawal: SA 승인/거절
CREATE OR REPLACE FUNCTION public.sa_process_withdrawal(
  p_request_id UUID,
  p_action TEXT,
  p_note TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req RECORD;
  v_balance INTEGER;
BEGIN
  PERFORM assert_superadmin();

  SELECT * INTO v_req FROM withdrawal_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION '출금 요청을 찾을 수 없습니다.';
  END IF;
  IF v_req.status <> 'pending' THEN
    RAISE EXCEPTION '이미 처리된 요청입니다.';
  END IF;

  IF p_action = 'approve' THEN
    UPDATE withdrawal_requests
    SET status = 'approved', admin_note = p_note, processed_at = NOW()
    WHERE id = p_request_id;

  ELSIF p_action = 'reject' THEN
    -- 거절 시 포인트 환불
    SELECT points_balance INTO v_balance
    FROM user_profiles WHERE id = v_req.user_id FOR UPDATE;

    v_balance := COALESCE(v_balance, 0) + v_req.amount;

    UPDATE user_profiles SET points_balance = v_balance WHERE id = v_req.user_id;

    UPDATE withdrawal_requests
    SET status = 'rejected', admin_note = p_note, processed_at = NOW()
    WHERE id = p_request_id;

    INSERT INTO point_transactions (user_id, type, amount, balance_after, description)
    VALUES (v_req.user_id, 'withdraw_refund', v_req.amount, v_balance, '출금 거절 환불');
  ELSE
    RAISE EXCEPTION '유효하지 않은 액션: %', p_action;
  END IF;
END;
$$;

-- 9) convert_to_researcher: 포인트로 연구자 전환
CREATE OR REPLACE FUNCTION public.convert_to_researcher(p_plan_type TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cost INTEGER;
  v_balance INTEGER;
BEGIN
  -- 플랜별 비용 (1P = 1원)
  v_cost := CASE p_plan_type
    WHEN 'plan_30' THEN 30000
    WHEN 'plan_50' THEN 40000
    WHEN 'plan_100' THEN 50000
    WHEN 'plan_multi_100' THEN 70000
    WHEN 'plan_multi_200' THEN 100000
    ELSE NULL
  END;

  IF v_cost IS NULL THEN
    RAISE EXCEPTION '유효하지 않은 플랜입니다: %', p_plan_type;
  END IF;

  SELECT points_balance INTO v_balance
  FROM user_profiles WHERE id = auth.uid() FOR UPDATE;

  IF COALESCE(v_balance, 0) < v_cost THEN
    RAISE EXCEPTION '포인트가 부족합니다. (필요: %P, 보유: %P)', v_cost, COALESCE(v_balance, 0);
  END IF;

  v_balance := v_balance - v_cost;

  UPDATE user_profiles
  SET points_balance = v_balance,
      role = 'admin',
      plan_type = p_plan_type,
      plan_expires_at = NOW() + INTERVAL '30 days'
  WHERE id = auth.uid();

  INSERT INTO point_transactions (user_id, type, amount, balance_after, description)
  VALUES (auth.uid(), 'convert', -v_cost, v_balance, '연구자 전환 (' || p_plan_type || ')');
END;
$$;

-- 10) get_marketplace_projects: 공개 모집 프로젝트 목록
CREATE OR REPLACE FUNCTION public.get_marketplace_projects()
RETURNS TABLE(
  id UUID,
  name TEXT,
  description TEXT,
  eval_method INTEGER,
  reward_points INTEGER,
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

-- 11) join_marketplace_project: 마켓 프로젝트 자가 등록
CREATE OR REPLACE FUNCTION public.join_marketplace_project(p_project_id UUID)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_proj RECORD;
  v_user RECORD;
  v_eval_id UUID;
BEGIN
  -- 프로젝트 확인
  SELECT * INTO v_proj FROM projects WHERE id = p_project_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION '프로젝트를 찾을 수 없습니다.';
  END IF;
  IF v_proj.recruit_evaluators = FALSE OR v_proj.status <> 1 THEN
    RAISE EXCEPTION '현재 모집 중이 아닙니다.';
  END IF;
  -- 자기 프로젝트 참여 불가
  IF v_proj.owner_id = auth.uid() THEN
    RAISE EXCEPTION '본인의 프로젝트에는 참여할 수 없습니다.';
  END IF;

  -- 이미 등록 여부 확인
  SELECT id INTO v_eval_id FROM evaluators
  WHERE project_id = p_project_id AND user_id = auth.uid();
  IF FOUND THEN
    RAISE EXCEPTION '이미 참여 중인 프로젝트입니다.';
  END IF;

  -- 사용자 정보
  SELECT display_name, email INTO v_user
  FROM user_profiles WHERE id = auth.uid();

  INSERT INTO evaluators (project_id, user_id, name, email)
  VALUES (p_project_id, auth.uid(), COALESCE(v_user.display_name, v_user.email), v_user.email)
  RETURNING id INTO v_eval_id;

  RETURN v_eval_id;
END;
$$;

-- 12) sa_list_withdrawals: SA 출금 목록
CREATE OR REPLACE FUNCTION public.sa_list_withdrawals()
RETURNS TABLE(
  id UUID,
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  amount INTEGER,
  bank_name TEXT,
  account_number TEXT,
  account_holder TEXT,
  status TEXT,
  admin_note TEXT,
  created_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public
AS $$
BEGIN
  PERFORM assert_superadmin();
  RETURN QUERY
  SELECT
    w.id,
    w.user_id,
    u.email AS user_email,
    u.display_name AS user_name,
    w.amount,
    w.bank_name,
    w.account_number,
    w.account_holder,
    w.status,
    w.admin_note,
    w.created_at,
    w.processed_at
  FROM withdrawal_requests w
  LEFT JOIN user_profiles u ON u.id = w.user_id
  ORDER BY w.created_at DESC;
END;
$$;

-- 13) get_point_history: 포인트 내역 조회
CREATE OR REPLACE FUNCTION public.get_point_history(
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  type TEXT,
  amount INTEGER,
  balance_after INTEGER,
  description TEXT,
  project_name TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pt.id,
    pt.type,
    pt.amount,
    pt.balance_after,
    pt.description,
    p.name AS project_name,
    pt.created_at
  FROM point_transactions pt
  LEFT JOIN projects p ON p.id = pt.project_id
  WHERE pt.user_id = auth.uid()
  ORDER BY pt.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- 14) handle_new_user 수정: role 메타데이터 반영
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
BEGIN
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
  -- evaluator만 허용, 그 외는 user
  IF v_role <> 'evaluator' THEN
    v_role := 'user';
  END IF;

  INSERT INTO public.user_profiles (id, email, display_name, avatar_url, provider, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(NEW.raw_user_meta_data->>'provider', 'email'),
    v_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
