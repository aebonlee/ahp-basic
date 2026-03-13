-- 029: 전화번호/접근코드 인증 속도 제한
-- 무차별 대입 공격 방지 (10,000 조합 × 속도 제한 없음 → 제한 추가)

-- 1) 인증 시도 기록 테이블
CREATE TABLE IF NOT EXISTS public.verification_attempts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ip_hash TEXT NOT NULL,           -- 클라이언트 IP 해시 (개인정보 보호)
  project_id UUID NOT NULL,
  attempt_type TEXT NOT NULL,      -- 'phone' | 'access_code'
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스: IP별 최근 시도 조회용
CREATE INDEX IF NOT EXISTS idx_verification_attempts_lookup
  ON public.verification_attempts (ip_hash, project_id, attempt_type, attempted_at DESC);

-- 오래된 기록 자동 정리 (7일 보관)
ALTER TABLE public.verification_attempts ENABLE ROW LEVEL SECURITY;

-- RLS: 아무도 직접 접근 불가 (RPC만 사용)
CREATE POLICY "verification_attempts_no_access" ON public.verification_attempts
  FOR ALL USING (false);

-- 2) 속도 제한 확인 함수
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_ip_hash TEXT,
  p_project_id UUID,
  p_attempt_type TEXT,
  p_max_attempts INT DEFAULT 5,
  p_window_minutes INT DEFAULT 15
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count INT;
BEGIN
  -- 시도 기록 추가
  INSERT INTO verification_attempts (ip_hash, project_id, attempt_type)
  VALUES (p_ip_hash, p_project_id, p_attempt_type);

  -- 윈도우 내 시도 횟수 확인
  SELECT count(*) INTO recent_count
  FROM verification_attempts
  WHERE ip_hash = p_ip_hash
    AND project_id = p_project_id
    AND attempt_type = p_attempt_type
    AND attempted_at > now() - (p_window_minutes || ' minutes')::interval;

  -- 오래된 기록 정리 (7일 이전)
  DELETE FROM verification_attempts
  WHERE attempted_at < now() - interval '7 days';

  -- true = 허용, false = 차단
  RETURN recent_count <= p_max_attempts;
END;
$$;

-- 3) verify_evaluator_phone에 속도 제한 적용
CREATE OR REPLACE FUNCTION public.verify_evaluator_phone(
  p_project_id UUID,
  p_phone_last4 TEXT,
  p_ip_hash TEXT DEFAULT 'unknown'
)
RETURNS TABLE(id UUID, name TEXT, email TEXT)
LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public
AS $$
DECLARE
  allowed BOOLEAN;
BEGIN
  -- 속도 제한 확인 (15분에 5회)
  SELECT check_rate_limit(p_ip_hash, p_project_id, 'phone') INTO allowed;
  IF NOT allowed THEN
    RAISE EXCEPTION 'Too many attempts. Please try again later.';
  END IF;

  RETURN QUERY
    SELECT evaluators.id, evaluators.name, evaluators.email
    FROM evaluators
    WHERE evaluators.project_id = p_project_id
    AND evaluators.phone_number LIKE '%' || p_phone_last4;
END;
$$;

-- 4) public_verify_access에 속도 제한 적용
CREATE OR REPLACE FUNCTION public.public_verify_access(
  p_project_id UUID,
  p_access_code TEXT,
  p_ip_hash TEXT DEFAULT 'unknown'
)
RETURNS TABLE(id UUID, name TEXT)
LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public
AS $$
DECLARE
  allowed BOOLEAN;
BEGIN
  -- 속도 제한 확인 (15분에 5회)
  SELECT check_rate_limit(p_ip_hash, p_project_id, 'access_code') INTO allowed;
  IF NOT allowed THEN
    RAISE EXCEPTION 'Too many attempts. Please try again later.';
  END IF;

  RETURN QUERY
    SELECT projects.id, projects.name
    FROM projects
    WHERE projects.id = p_project_id
      AND projects.public_access_enabled = true
      AND projects.access_code = p_access_code;
END;
$$;
