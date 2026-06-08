# DreamIT 통합 Supabase 보안 점검·수정 준비 (검증 + 파일 생성)

- **프로젝트**: `hcmgdztsgjvzcyxyayaj` (public 451 테이블 · 181 함수 · ~70 사이트 공유, 1 anon key)
- **상태**: ✅ 읽기 전용 검증 완료 + 수정 SQL "파일" 생성 완료. **라이브 DB 미수정, 미커밋, 미적용.**
- **브랜치**: `security/remediation-prep`
- **검증 방법**: Management API `database/query`(읽기 전용) + `pg_get_functiondef` + `pg_policies` + 로컬 ahp-basic `src` grep

---

## Phase A — 검증 결과

### A-1. 고위험 함수 18개 본문 감사 (이름이 아니라 정의로 판정)

| 함수(인자) | 분류 | 근거 (본문) |
|------------|------|-------------|
| `admin_delete_user(uuid)` | **GUARDED** | `auth.uid()`→이메일 allowlist 검증 후 삭제, 최고관리자 보호. (search_path 누락-경미) |
| `admin_get_all_users()` | **GUARDED** | jwt email allowlist + `search_path` 설정. 관리자만 전체조회 |
| `admin_update_user_profile(uuid,text)` | **GUARDED** | 이메일 allowlist (search_path 누락) |
| `admin_update_user_profile(uuid,text,text)` | **GUARDED** | 이메일 allowlist + search_path |
| `admin_update_user_status(...)` | **GUARDED** | 이메일 allowlist + 상태값 검증 + 최고관리자 보호 |
| `set_user_role(uuid,text)` | **GUARDED** | `caller_email='aebon@kakao.com'` + role∈(student,teacher), 대상=`pymaster_users` |
| `update_user_role(uuid,text)` | **GUARDED** | 이메일 allowlist. (단 new_role 값 무검증 — 관리자 한정이라 수용) |
| `reset_company_password(uuid)` | **GUARDED** | `knc_user_roles` role∈(superadmin,manager) 검증. (crypt/gen_salt 비수식 — search_path 보강 권장) |
| `grant_license(uuid,uuid,text,text)` | **GUARDED** | 주문 소유+`payment_status='paid'` 검증(결제 게이트) |
| `grant_coupon_license(uuid,uuid,text,text)` | **★UNGUARDED** | 검증 전무 → 임의 사용자에 라이선스 무단 발급(전 허브 유료화). ahp 프론트 미사용 |
| `activate_project_plan(uuid,text,uuid)` | **★UNGUARDED** | `p_user_id` 인자, 결제 미검증 → 임의 유료플랜 발급(결제 우회) |
| `get_user_plans(uuid)` | **UNGUARDED(IDOR)** | `p_user_id`로 타인 플랜 열람 + 만료 UPDATE |
| `get_project_plan(uuid)` | **UNGUARDED(IDOR)** | 임의 project의 user_id·order_id 열람 + 만료 UPDATE |
| `increment_sms_used(uuid,int)` | **UNGUARDED** | 임의 project SMS 사용량 증가 → 할당량 고갈 DoS |
| `grant_free_plan(uuid)` | **UNGUARDED** | `p_user_id` 무검증(저영향) |
| `check_user_license(uuid,text)` | **BYPASSABLE** | `p_user_id` IDOR(boolean 반환, 저영향) |
| `verify_evaluator_phone(uuid,text)` | **BYPASSABLE+PII** | 레이트리밋 없는 레거시, anon에 **이메일** 반환 |
| `verify_evaluator_phone(uuid,text,text)` | **BYPASSABLE+PII** | `p_ip_hash`=클라이언트 입력 → 레이트리밋 우회, 이메일 반환 |
| `get_marketplace_projects()` | **PII 누수** | `COALESCE(display_name, email)` → 소유자 이메일 anon 노출 |
| `marketplace_register_evaluator(uuid,text,text)` | GUARDED(설계상 anon) | recruit+status 검증. 레이트리밋 없음(스팸) → P3 |

> 결론: 이름상 위험해 보이던 `admin_*`/`set_user_role`/`reset_company_password`는 **본문에 권한 게이트가 있어 GUARDED**. 실제 REVOKE 대상은 검증이 전무한 **결제/라이선스/플랜 함수**.

### A-2. RLS-off 13개 테이블 분류 + 권장 정책

| 테이블 | 분류 | 권장 정책 | 플래그 |
|--------|------|-----------|--------|
| `forjob_orders` | PRIVATE-OWNER | 본인(user_id) + `is_forjob_admin()` | 결제 콜백 주체 확인 |
| `sb_code_submissions`/`sb_study_progress`/`sb_test_results` | PRIVATE-OWNER | `user_id=auth.uid()` ALL | sb 레포 없음·익명학습 여부 |
| `sb_profiles` | PRIVATE-OWNER | `id=auth.uid()` ALL | 닉네임 공개조회 여부 |
| `franchise_applications` | INSERT-ONLY | public INSERT + 관리자 SELECT | 신청자 본인 조회 화면 여부 |
| `joongang_articles` | PUBLIC-READ | `is_published OR staff` SELECT + staff write | **깨짐 위험 高**: 공개 필터 컬럼 확인 |
| `joongang_sections` | PUBLIC-READ | `true` SELECT + staff write | — |
| `pub_reports` | PUBLIC-READ | `is_published` SELECT + 관리자 write | 유료 body 숨김 여부 |
| `instructor_schedules` | PUBLIC-READ | `true` SELECT + 관리자 write | — |
| `documents` | PUBLIC-READ(추정) | `true` SELECT + 관리자 write | 용도 불명확 |
| `joongang_staff` | PRIVATE-ADMIN | 본인/편집장 SELECT + 편집장 write | role 값·자기참조 |
| `_debug_log` | DENY | 정책 없음(=기본거부) | anon 로깅 INSERT 여부 |

### A-3. C-1 (user_profiles 자가 권한상승) — **확정 CRITICAL**

- `pg_policies` 조회: `user_profiles`에 UPDATE 정책 **6종이 중첩**, **전부 `WITH CHECK = NULL` + `USING (auth.uid()=id)`**.
- RLS는 컬럼 변경을 제한하지 못함 + `authenticated`에 테이블 전체 UPDATE 권한 존재.
- ⇒ 로그인 사용자가 자기 행의 **`role='superadmin'` 직접 UPDATE 가능** → 공유 user_profiles이므로 **전 사이트 SA 탈취**.
- *role 자가승격은 읽기로만 확인했고 실제 시도하지 않음.*
- 프론트 직접 UPDATE 흐름 grep: ahp-basic만 로컬 존재(타 사이트 미확인) → 허용 컬럼 산정은 보수적 + 플래그 처리.

---

## Phase B — 생성한 파일 (적용 금지)

| 파일 | 목적 | 깨뜨릴 수 있는 것 |
|------|------|-------------------|
| `supabase/migrations/042_P0_rls_enable.sql` | RLS-off 13개 ENABLE + 정책 | **joongang 뉴스 공개 노출**(필터 컬럼 불일치 시), forjob 결제 콜백, sb 익명학습, 관리자 쓰기(staff 미등록 시) |
| `supabase/migrations/043_P1_user_profiles_column_lock.sql` | C-1 수정: 컬럼 단위 UPDATE 잠금 | 프로필 편집 폼이 허용목록 외 컬럼 저장 시 `permission denied`; 관리자 role 직접변경(→RPC 전환 필요) |
| `supabase/migrations/044_P2_revoke_unguarded_funcs.sql` | UNGUARDED 5개 anon 회수(+1 보류) | 해당 RPC를 **비로그인** 상태에서 호출하는 화면(있으면). `grant_coupon_license`는 주석처리(보류) |
| `supabase/migrations/P3_logic_fixes.md` | BYPASSABLE/PII 로직수정 설계 | (문서) 적용 시 프론트 인자 동시수정 필요 |

> ⚠️ `grant_coupon_license` REVOKE는 **주석 처리(보류)** 상태 — 허브 사이트 프론트 호출 확인 전 적용 금지.

---

## 단계별 적용 순서 · 테스트 · 롤백

권장 순서: **P1 → P2 → P0** (위험 낮고 영향범위 명확한 것부터, 광역 RLS는 마지막에 1테이블씩).

### 1단계 — P1 (user_profiles 컬럼 잠금) · *가장 시급, 영향 명확*
- 테스트: ① 일반사용자 프로필 편집(이름/전화/표시명) 저장 OK ② role 자가변경 시도→`permission denied` ③ `sa_update_user_role` RPC로 role 변경 OK
- 영향 사이트: 전 사이트(프로필 편집 폼). 특히 snu(student_no/major), comp(grp/subgrp) 폼 컬럼 점검
- 롤백: `GRANT UPDATE ON public.user_profiles TO authenticated;` (취약점도 복귀 — 비상시만)

### 2단계 — P2 (UNGUARDED 함수 anon 회수)
- 테스트: 연구자 **로그인** 상태에서 결제→플랜발급/내플랜조회/SMS카운트 정상(authenticated 보존), **비로그인** 호출 시 권한오류
- 영향: ahp-basic 결제/플랜 흐름(로그인 사용자 영향 없음 예상)
- 롤백: 함수별 `GRANT EXECUTE ON FUNCTION public.<함수>(<인자>) TO anon;`

### 3단계 — P0 (RLS 활성화) · *테이블 1개씩 적용·검증*
- 우선순위: `_debug_log`/`sb_*`/`franchise_applications`(저위험) → `forjob_orders` → `pub_reports`/`instructor_schedules`/`documents` → **`joongang_*`(최후, 라이브 뉴스 영향 大)**
- 각 테이블 적용 직후: 해당 사이트 공개 페이지 읽기 + 관리자 쓰기 동시 확인
- joongang 적용 전 필수: 프론트 `.from('joongang_articles')` 공개 필터 컬럼(`is_published` vs `status`) 확인, 편집자 계정이 `joongang_staff(is_active)`에 등록됐는지 확인
- 롤백: `ALTER TABLE public.<t> DISABLE ROW LEVEL SECURITY;` + `DROP POLICY ...`

---

## 미해결·후속 (별도 처리)
- **P3 로직수정**: 결제/플랜 함수 `p_user_id`→`auth.uid()`, `get_project_plan`/`increment_sms_used` 소유검증, `verify_evaluator_phone` 이메일 미반환+서버 레이트리밋, `get_marketplace_projects` 이메일 폴백 제거 — 프론트 동시수정 필요
- user_profiles UPDATE 정책 6종 중복 정리(회귀테스트 후)
- 함수 search_path 누락 일괄 보강(GUARDED 함수 포함 하드닝)
- 전반: 신규 함수 기본 PUBLIC EXECUTE 관행 → 사이트별 화이트리스트 GRANT 정책 수립

**라이브 적용은 승인 대기. 위 1→2→3 순서로 지시 주시면 단계별로 진행하겠습니다.**
