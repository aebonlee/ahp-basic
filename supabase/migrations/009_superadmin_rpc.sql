-- 009: Super Admin 전용 RPC 함수
-- aebon@kakao.com 전용 슈퍼관리자 기능

-- 헬퍼: 슈퍼관리자 확인
CREATE OR REPLACE FUNCTION public.assert_superadmin()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF coalesce(auth.jwt()->>'email','') <> 'aebon@kakao.com' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
END; $$;

-- 1) 전체 사용자 목록 (auth.users + user_profiles JOIN)
CREATE OR REPLACE FUNCTION public.sa_list_users()
RETURNS TABLE(id UUID, email TEXT, created_at TIMESTAMPTZ, role TEXT, display_name TEXT)
LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public AS $$
BEGIN
  PERFORM assert_superadmin();
  RETURN QUERY
    SELECT u.id, u.email::TEXT, u.created_at,
           coalesce(p.role,'user') AS role,
           coalesce(p.display_name,'') AS display_name
    FROM auth.users u
    LEFT JOIN user_profiles p ON p.id = u.id
    ORDER BY u.created_at DESC;
END; $$;

-- 2) 사용자 역할 변경
CREATE OR REPLACE FUNCTION public.sa_update_user_role(p_user_id UUID, p_role TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM assert_superadmin();
  INSERT INTO user_profiles(id, role) VALUES(p_user_id, p_role)
    ON CONFLICT(id) DO UPDATE SET role = EXCLUDED.role;
END; $$;

-- 3) 전체 프로젝트 목록 (소유자 이메일 포함)
CREATE OR REPLACE FUNCTION public.sa_list_projects()
RETURNS TABLE(id UUID, name TEXT, description TEXT, status INTEGER,
              created_at TIMESTAMPTZ, owner_email TEXT)
LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public AS $$
BEGIN
  PERFORM assert_superadmin();
  RETURN QUERY
    SELECT pr.id, pr.name, pr.description, pr.status, pr.created_at,
           u.email::TEXT AS owner_email
    FROM projects pr
    LEFT JOIN auth.users u ON u.id = pr.owner_id
    ORDER BY pr.created_at DESC;
END; $$;

-- 4) 프로젝트 삭제
CREATE OR REPLACE FUNCTION public.sa_delete_project(p_project_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM assert_superadmin();
  DELETE FROM projects WHERE id = p_project_id;
END; $$;
