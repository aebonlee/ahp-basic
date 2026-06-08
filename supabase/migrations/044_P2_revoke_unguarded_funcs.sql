-- ============================================================================
-- 044 / P2: UNGUARDED 함수의 anon EXECUTE 회수 (개별 명시) — 검증본
-- ============================================================================
-- ⚠️ 절대규칙 #2: "ALL FUNCTIONS IN SCHEMA" 회수 절대 금지. 아래는 함수 1개씩 명시.
--
-- [현재 권한 상태 — proacl 조회 확인]
--   대상 함수들은 anon/authenticated/service_role/PUBLIC 모두 명시적 EXECUTE 보유.
--   → 'REVOKE FROM anon, public' 시 authenticated/service_role 명시적 권한은 유지됨.
--   안전벨트로 authenticated GRANT를 함께 명시(상태가 달라도 로그인 사용자는 보존).
--
-- ============================================================================
-- ⚠️⚠️ 중요 — P2의 한계 (반드시 인지)
--   P2(anon 회수)는 공격면을 "인터넷 전체 → 로그인 사용자"로 *축소*할 뿐,
--   아래 IDOR/우회 함수의 결함을 *닫지는 못함*. REVOKE 후에도 로그인 사용자가:
--     · activate_project_plan : self 호출로 무결제 유료플랜 자가발급(결제 우회)
--     · get_user_plans        : 타인 user_id로 플랜 열람(IDOR)
--     · get_project_plan      : 타 project IDOR
--     · increment_sms_used    : 타 프로젝트 SMS 할당량 고갈(DoS)
--   → 이 4개는 P3(로직수정: p_user_id→auth.uid 결합, 결제검증, 프로젝트 소유검증) 필수.
--   P2 적용은 즉각적 피해 축소로 의미 있으나, 이 함수들을 "수정 완료"로 간주하지 말 것.
-- ============================================================================
--
-- [대상 선정 기준]
--   A-1 본문 감사 UNGUARDED + ahp 프론트 grep "비로그인(anon) 평가자 흐름 아님, 로그인
--   연구자만 호출" → anon 차단이 정상 흐름을 깨지 않음.
--   (anon 유지 함수: verify_evaluator_phone / marketplace_register_evaluator /
--    public_register_evaluator / public_verify_access / get_marketplace_projects /
--    anon_get_evaluators / get_project_for_invite / get_shared_result / record_page_view
--    / get_community_posts → 이번 REVOKE 대상에서 제외. 로직수정은 P3 참고.)
-- ============================================================================

-- 1) activate_project_plan — 결제검증·auth.uid 결합 없이 임의 사용자 유료플랜 발급(결제 우회)
--    → P3 필수: REVOKE-anon 후에도 로그인 사용자 무결제 자가발급 잔존.
REVOKE EXECUTE ON FUNCTION public.activate_project_plan(uuid, text, uuid) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.activate_project_plan(uuid, text, uuid) TO authenticated;

-- 2) get_user_plans — p_user_id 인자로 임의 사용자 플랜 열람(IDOR) + 만료 UPDATE
--    → P3 필수: auth.uid() 결합 전까지 로그인 사용자 IDOR 잔존.
REVOKE EXECUTE ON FUNCTION public.get_user_plans(uuid) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.get_user_plans(uuid) TO authenticated;

-- 3) get_project_plan — 임의 project_id의 user_id·order_id 열람(IDOR) + 만료 UPDATE
--    → P3 필수: 타 project IDOR 잔존.
REVOKE EXECUTE ON FUNCTION public.get_project_plan(uuid) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.get_project_plan(uuid) TO authenticated;

-- 4) increment_sms_used — 임의 project SMS 사용량 증가(타 프로젝트 할당량 고갈 DoS)
--    → P3 필수: 프로젝트 소유 검증 전까지 DoS 잔존.
REVOKE EXECUTE ON FUNCTION public.increment_sms_used(uuid, integer) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.increment_sms_used(uuid, integer) TO authenticated;

-- 5) grant_free_plan — 검증 없이 임의 사용자 free 플랜 생성(저영향)
--    → P3 권장(저영향). REVOKE-anon으로 일차 축소.
REVOKE EXECUTE ON FUNCTION public.grant_free_plan(uuid) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.grant_free_plan(uuid) TO authenticated;

-- 6) grant_coupon_license — ⚠️ 검증·결제확인 전무. 임의 사용자에 라이선스 무단 발급
--    (전 허브 유료콘텐츠 무료화). ahp 프론트 미사용(0건).
--    [적용 보류] 허브 사이트(ah_/biz_/csh_ 등) 레포가 로컬에 없어 "결제완료 후 클라이언트가
--    anon 키로 직접 호출"하는지 미확인. 그렇다면 깨짐 → 먼저 그 호출을 서버(service_role/
--    Edge)로 옮긴 뒤 아래 주석을 해제하여 적용할 것.
-- REVOKE EXECUTE ON FUNCTION public.grant_coupon_license(uuid, uuid, text, text) FROM anon, public;
-- GRANT  EXECUTE ON FUNCTION public.grant_coupon_license(uuid, uuid, text, text) TO authenticated;

-- ============================================================================
-- [REVOKE 대상에서 의도적으로 제외 — 사유]
--   • grant_license(uuid,uuid,text,text)        → GUARDED: 주문 소유+payment_status='paid' 검증
--   • assign_plan_to_project(uuid,uuid)         → GUARDED: v_user_id<>auth.uid() 차단(로그인 전용)
--   • activate_multi_plan(uuid,uuid)            → BYPASSABLE(약한 검증) → 로직수정 P3
--   • reset_company_password(uuid)              → GUARDED: knc_user_roles role 검증
--   • admin_* / set_user_role / update_user_role → GUARDED: 이메일 allowlist/auth.uid 게이트
--   • check_user_license(uuid,text)             → 읽기전용 boolean(IDOR 저영향) → 로직수정 P3
--   • verify_evaluator_phone / get_marketplace_projects / marketplace_register_evaluator 등
--       → anon 평가자/마켓 흐름에 필수. 차단 대신 P3에서 PII·레이트리밋 로직수정.
--
-- [P3로 넘길 함수 총정리]
--   (A) IDOR/우회 — P2 REVOKE했으나 로직수정 필수:
--       activate_project_plan, get_user_plans, get_project_plan, increment_sms_used
--   (B) anon 유지라 REVOKE 불가 — 로직수정만이 해법:
--       verify_evaluator_phone(PII), get_marketplace_projects(이메일 폴백),
--       marketplace_register_evaluator 등 평가자 흐름
--   (C) 약한 검증:
--       activate_multi_plan, check_user_license
--
-- [적용 후 테스트]
--   - 연구자 로그인 상태: 결제→플랜발급, 내 플랜 조회, SMS 발송 카운트 정상(authenticated 보존).
--   - 비로그인(anon): 위 RPC 호출 시 권한오류(permission denied) 확인.
--   - 함수 시그니처 불일치로 'function ... does not exist' 뜨면 인자 타입 재확인(\df).
--
-- [롤백]  GRANT EXECUTE ON FUNCTION public.<함수>(<인자>) TO anon;  -- 함수별 개별 원복
-- ============================================================================