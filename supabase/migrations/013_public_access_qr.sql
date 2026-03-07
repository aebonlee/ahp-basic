-- ============================================
-- 013: 공개 접근 (QR) 배포 기능
-- projects에 access_code/public_access_enabled 추가
-- evaluators에 registration_source 추가
-- 비로그인 사용자용 RPC 함수 2개 추가
-- get_project_for_invite 확장
-- ============================================

-- 1) 스키마 변경
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS access_code TEXT,
  ADD COLUMN IF NOT EXISTS public_access_enabled BOOLEAN DEFAULT FALSE;

ALTER TABLE public.evaluators
  ADD COLUMN IF NOT EXISTS registration_source TEXT DEFAULT 'admin';

-- 2) get_project_for_invite 확장 — public_access_enabled 반환 추가
CREATE OR REPLACE FUNCTION public.get_project_for_invite(p_project_id UUID)
RETURNS TABLE(id UUID, name TEXT, public_access_enabled BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
    SELECT projects.id, projects.name, projects.public_access_enabled
    FROM projects
    WHERE projects.id = p_project_id;
END;
$$;

-- 3) public_verify_access — 비밀번호 검증
CREATE OR REPLACE FUNCTION public.public_verify_access(p_project_id UUID, p_access_code TEXT)
RETURNS TABLE(id UUID, name TEXT)
LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
    SELECT projects.id, projects.name
    FROM projects
    WHERE projects.id = p_project_id
      AND projects.public_access_enabled = TRUE
      AND projects.access_code = p_access_code;
END;
$$;

-- 4) public_register_evaluator — 자가 등록
CREATE OR REPLACE FUNCTION public.public_register_evaluator(
  p_project_id UUID,
  p_access_code TEXT,
  p_name TEXT,
  p_phone TEXT
)
RETURNS TABLE(id UUID, name TEXT)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_exists BOOLEAN;
  v_existing_id UUID;
  v_email TEXT;
BEGIN
  -- 비밀번호 재검증
  SELECT EXISTS(
    SELECT 1 FROM projects
    WHERE projects.id = p_project_id
      AND projects.public_access_enabled = TRUE
      AND projects.access_code = p_access_code
  ) INTO v_project_exists;

  IF NOT v_project_exists THEN
    RAISE EXCEPTION 'Invalid access code';
  END IF;

  -- 동일 전화번호 기존 평가자 확인
  SELECT evaluators.id INTO v_existing_id
  FROM evaluators
  WHERE evaluators.project_id = p_project_id
    AND evaluators.phone_number = p_phone;

  IF v_existing_id IS NOT NULL THEN
    RETURN QUERY
      SELECT evaluators.id, evaluators.name
      FROM evaluators
      WHERE evaluators.id = v_existing_id;
    RETURN;
  END IF;

  -- 새 평가자 등록
  v_email := p_phone || '@public.local';

  RETURN QUERY
    INSERT INTO evaluators (project_id, name, email, phone_number, registration_source)
    VALUES (p_project_id, p_name, v_email, p_phone, 'public')
    RETURNING evaluators.id, evaluators.name;
END;
$$;
