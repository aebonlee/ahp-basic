-- =============================================
-- 037: 중복 참여 방지 — completed 필드 반환 추가
-- QR/공개접속 후 마켓플레이스 재접속 시 완료 여부 확인
-- =============================================

-- 1) marketplace_register_evaluator — completed 필드 추가
DROP FUNCTION IF EXISTS public.marketplace_register_evaluator(UUID, TEXT, TEXT);
CREATE FUNCTION public.marketplace_register_evaluator(
  p_project_id UUID,
  p_name TEXT,
  p_phone TEXT
)
RETURNS TABLE(id UUID, name TEXT, is_existing BOOLEAN, completed BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project RECORD;
  v_existing_id UUID;
  v_email TEXT;
BEGIN
  SELECT * INTO v_project FROM projects
  WHERE projects.id = p_project_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION '프로젝트를 찾을 수 없습니다.';
  END IF;

  IF v_project.recruit_evaluators = FALSE OR v_project.status <> 1 THEN
    RAISE EXCEPTION '현재 모집 중이 아닙니다.';
  END IF;

  -- 동일 전화번호 기존 평가자 확인
  SELECT evaluators.id INTO v_existing_id
  FROM evaluators
  WHERE evaluators.project_id = p_project_id
    AND evaluators.phone_number = p_phone;

  IF v_existing_id IS NOT NULL THEN
    RETURN QUERY
      SELECT evaluators.id, evaluators.name, TRUE, COALESCE(evaluators.completed, FALSE)
      FROM evaluators
      WHERE evaluators.id = v_existing_id;
    RETURN;
  END IF;

  v_email := p_phone || '@marketplace.local';

  RETURN QUERY
    INSERT INTO evaluators (project_id, name, email, phone_number, registration_source)
    VALUES (p_project_id, p_name, v_email, p_phone, 'public')
    RETURNING evaluators.id, evaluators.name, FALSE, FALSE;
END;
$$;

-- 2) public_register_evaluator — completed 필드 추가
DROP FUNCTION IF EXISTS public.public_register_evaluator(UUID, TEXT, TEXT, TEXT);
CREATE FUNCTION public.public_register_evaluator(
  p_project_id UUID,
  p_access_code TEXT,
  p_name TEXT,
  p_phone TEXT
)
RETURNS TABLE(id UUID, name TEXT, is_existing BOOLEAN, completed BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_exists BOOLEAN;
  v_existing_id UUID;
  v_email TEXT;
BEGIN
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
      SELECT evaluators.id, evaluators.name, TRUE, COALESCE(evaluators.completed, FALSE)
      FROM evaluators
      WHERE evaluators.id = v_existing_id;
    RETURN;
  END IF;

  v_email := p_phone || '@public.local';

  RETURN QUERY
    INSERT INTO evaluators (project_id, name, email, phone_number, registration_source)
    VALUES (p_project_id, p_name, v_email, p_phone, 'public')
    RETURNING evaluators.id, evaluators.name, FALSE, FALSE;
END;
$$;
