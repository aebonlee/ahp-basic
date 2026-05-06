-- 041: 슈퍼관리자 전체 프로젝트 접근 권한
-- 슈퍼관리자(role='superadmin')가 AdminDashboard에서 모든 프로젝트를 조회/관리할 수 있도록
-- is_project_owner()를 수정하고 RLS 정책을 추가한다.

-- (a) is_superadmin() 헬퍼 생성 (SECURITY DEFINER로 RLS 우회)
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'superadmin'
  );
$$;

-- (b) is_project_owner() 수정 — 슈퍼관리자는 모든 프로젝트 owner 취급
CREATE OR REPLACE FUNCTION public.is_project_owner(p_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects WHERE id = p_id AND owner_id = auth.uid()
  ) OR public.is_superadmin();
$$;

-- (c) projects 테이블에 슈퍼관리자 SELECT 정책 추가
CREATE POLICY "projects_superadmin_select" ON public.projects
  FOR SELECT USING (public.is_superadmin());

-- (d) user_profiles 슈퍼관리자 SELECT 정책 추가 (소유자 정보 조회용)
CREATE POLICY "user_profiles_superadmin_select" ON public.user_profiles
  FOR SELECT USING (public.is_superadmin());
