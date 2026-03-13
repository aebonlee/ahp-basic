-- 028: 슈퍼관리자 role 설정 + assert_superadmin() role 기반 전환
-- 클라이언트 코드에서 이메일 하드코딩 제거를 위해 DB role로 전환

-- 1) aebon@kakao.com → superadmin role (다른 관리자는 admin 유지)
UPDATE public.user_profiles
SET role = 'superadmin'
WHERE email = 'aebon@kakao.com';

-- 2) assert_superadmin()을 role 기반으로 변경 (이메일 하드코딩 제거)
CREATE OR REPLACE FUNCTION public.assert_superadmin()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF (SELECT role FROM public.user_profiles WHERE id = auth.uid()) <> 'superadmin' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
END; $$;
