-- ============================================================================
-- 043 / P1: user_profiles 컬럼 단위 UPDATE 잠금 (C-1 CRITICAL 수정) — 검증본
-- 적용: 2026-06-06 (실제 컬럼 대조 검증. grp/subgrp/student_no 제외)
-- ============================================================================
-- [문제 — A-3에서 확정]
--   user_profiles의 UPDATE 정책 6종이 전부 USING(auth.uid()=id) + WITH CHECK=null.
--   RLS는 "어느 컬럼을 바꾸는지"는 제한하지 못함(행 단위만). 컬럼 제한은 GRANT로만 가능.
--   현재 authenticated에 테이블 전체 UPDATE 권한이 있어,
--   로그인 사용자가 자기 행의 role='superadmin'/plan_type/points_balance 를 직접 변경 가능.
--   → 공유 user_profiles이므로 70개 사이트 전체 권한체계가 무력화됨(SA 자가승격).
--
-- [수정 전략]
--   테이블 전체 UPDATE 권한을 회수하고, "사용자가 직접 고쳐도 안전한 프로필 컬럼"만 재부여.
--   role/plan/points/status/sms/grp 등 보안·과금·접근통제 컬럼은 직접 UPDATE 불가.
--   ⇒ 이들 컬럼 변경은 반드시 SECURITY DEFINER RPC(예: sa_update_user_role,
--      activate_*_plan 등)를 통해서만. SECURITY DEFINER 함수는 소유자(postgres) 권한으로
--      실행되어 컬럼 GRANT 제약을 받지 않으므로 기존 RPC 경로는 그대로 동작함.
--
-- [실제 컬럼 대조로 검증됨 — CC 초안 대비 변경점]
--   grp, subgrp, student_no 를 허용목록에서 제외(잠금).
--   사유: grp/subgrp = 그룹 소속(접근 통제), student_no = 식별자(충돌·사칭 소지).
--        사용자 자가편집 부적절 → RPC/트리거/운영자만 설정.
-- ============================================================================

-- 1) 직접 UPDATE 권한 회수 (anon/public 포함 — 방어적 회수)
REVOKE UPDATE ON public.user_profiles FROM anon, authenticated, public;

-- 2) 사용자 자가편집이 안전한 "프로필 표시/개인정보" 컬럼만 재부여
GRANT UPDATE (
  display_name,
  avatar_url,
  name,
  phone,
  gender,
  job,
  position,
  country,
  age,
  edulevel,
  major,
  updated_at
) ON public.user_profiles TO authenticated;

-- ============================================================================
-- [직접 UPDATE에서 제외된 컬럼 — RPC/트리거/운영자만 변경]
--   role, usertype, provider, email, id                ← 신원/권한
--   grp, subgrp                                         ← 그룹 소속(접근 통제)
--   student_no                                          ← 식별자(기관 부여)
--   plan_type, plan_expires_at, trial_started_at, trial_expires_at  ← 과금
--   sms_used_this_month, sms_month_reset, points_balance            ← 과금/포인트
--   status, suspended_until, status_reason, status_changed_at,
--   status_changed_by, ban_reason, deleted_at           ← 계정 상태(관리자 전용)
--   signup_domain, visited_sites                        ← RPC/트리거
--   last_login_at, last_sign_in_at, last_active_at       ← 트리거/RPC
--   created_at                                           ← 불변
-- ============================================================================

-- ⚠️ [검토 필요 — 깨질 수 있는 지점]
-- (1) 어떤 사이트의 프로필/가입 폼이 위 허용목록 외 컬럼을 직접 UPDATE하면
--     'permission denied for column ...' 에러 발생(시끄러운 실패 → 즉시 감지 가능).
--     - grp/subgrp 를 가입 시 배정한다면 → 재허용 말고 RPC/트리거로 이전(안 그러면
--       사용자가 아무 때나 자기 그룹 변경 가능).
--     - student_no/major 를 학생이 직접 입력하는 사이트(snu 등)면 → 해당 컬럼만 GRANT에 추가.
-- (2) 관리자가 'role'을 관리자 화면에서 user_profiles 직접 UPDATE로 바꾸던 흐름이 있으면
--     깨짐 → sa_update_user_role/set_user_role/update_user_role RPC 경유로 전환.
-- (3) 기존 UPDATE RLS 정책 6종은 중복이나 본 수정과 무관하게 동작. 정리(중복 DROP)는
--     사이트 회귀테스트 후 별도 마이그레이션에서 신중히.
--
-- [적용 후 테스트 — 사이트 1개 말고 2~3개 대표로]
--   - 단순 프로필 사이트: 이름/전화/표시명 저장 정상.
--   - snu(student_no/major), comp(grp) 등: 프로필/가입 저장 시 컬럼 에러 여부 확인.
--   - 일반 사용자: role='superadmin' 자가변경 시도 → 'permission denied' 확인.
--   - 관리자 RPC: sa_update_user_role로 role 변경 정상 동작 확인.
--
-- [롤백]  GRANT UPDATE ON public.user_profiles TO authenticated;
--         (전체 권한 원복 — 단, C-1 취약점도 함께 복귀하므로 비상시에만)
-- ============================================================================