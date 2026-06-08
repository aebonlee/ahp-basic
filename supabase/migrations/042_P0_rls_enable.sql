-- ============================================================================
-- 042 / P0: RLS-off 13개 테이블 RLS 활성화 + 용도별 정책 — 동기화본
-- 갱신: 2026-06-06
--   [변경 1] joongang_articles 공개읽기: USING(is_published=true ...) → USING(true)
--            사유: 기사 행이 is_published=true가 아니어서 공개 페이지가 빈 화면이 됨(실측).
--   [변경 2] pub_reports: 동일한 is_published=true 패턴 → [검토] 경고 강화(미확인).
--   ※ joongang_articles의 최종 상태는 실제 적용 방식과 일치하는지 확인 필요.
-- ============================================================================
-- ⚠️ 절대규칙 #3: ENABLE만 하면 정상 읽기도 막힘 → 각 ENABLE에 정책 동반.
-- ⚠️ 적용 시 아래 사이트 읽기/쓰기 영향 가능:
--    joongang(기사·지면·직원), forjob(주문), sb(코딩학습), instructor(일정),
--    pub_reports, documents, franchise 신청. 테이블 1개씩 적용·검증 권장.
--
-- 관리자 판별 헬퍼(DB 존재 확인): is_platform_admin(), is_site_admin(text),
--   is_forjob_admin(). joongang 전용 헬퍼 없음 → joongang_staff 멤버십으로 대체.
-- ============================================================================


-- ────────────────────────────────────────────────────────────────────────
-- [그룹 A] PRIVATE-OWNER : 본인 데이터만 (user_id = auth.uid())
-- ────────────────────────────────────────────────────────────────────────

-- A-1) forjob_orders — 결제 주문 (user_id 보유). 본인 + forjob 관리자.
ALTER TABLE public.forjob_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "forjob_orders_owner_select" ON public.forjob_orders
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_forjob_admin());

CREATE POLICY "forjob_orders_owner_insert" ON public.forjob_orders
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "forjob_orders_admin_update" ON public.forjob_orders
  FOR UPDATE TO authenticated
  USING (public.is_forjob_admin()) WITH CHECK (public.is_forjob_admin());
-- [검토] 결제완료 콜백이 anon 키로 INSERT/UPDATE한다면 위 정책에 막힘.
--        forjob 결제 흐름이 서버(service_role)인지 클라이언트(anon)인지 프론트 확인 필요.

-- A-2) sb_code_submissions / sb_study_progress / sb_test_results — 학습 데이터(user_id)
ALTER TABLE public.sb_code_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sb_code_submissions_owner_all" ON public.sb_code_submissions
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE public.sb_study_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sb_study_progress_owner_all" ON public.sb_study_progress
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE public.sb_test_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sb_test_results_owner_all" ON public.sb_test_results
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
-- [검토] sb_* 사이트 레포가 로컬에 없어 프론트 미확인.
--        익명(비로그인) 학습을 허용하는 사이트라면 anon 정책이 추가로 필요 → 깨질 수 있음.

-- A-3) sb_profiles — PK(id)가 곧 auth.uid. 본인 read/write.
ALTER TABLE public.sb_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sb_profiles_owner_all" ON public.sb_profiles
  FOR ALL TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
-- [검토] 닉네임을 랭킹 등에서 공개 조회한다면 별도 public SELECT 정책 필요.


-- ────────────────────────────────────────────────────────────────────────
-- [그룹 B] INSERT-ONLY : 누구나 제출, 읽기는 관리자만 (신청서류)
-- ────────────────────────────────────────────────────────────────────────

-- B-1) franchise_applications — 가맹 신청(이름·이메일·전화 PII). 제출만, 열람은 관리자.
ALTER TABLE public.franchise_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "franchise_apps_public_insert" ON public.franchise_applications
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);   -- 비로그인 신청 허용(폼 제출). user_id는 NULL 가능.

CREATE POLICY "franchise_apps_admin_select" ON public.franchise_applications
  FOR SELECT TO authenticated
  USING (public.is_platform_admin());
-- [검토] 신청자가 자기 신청내역을 조회하는 화면이 있으면 user_id=auth.uid() SELECT 추가 필요.
--        관리자 판별을 is_platform_admin()으로 가정 — 실제 운영 관리자 기준 확인 필요.


-- ────────────────────────────────────────────────────────────────────────
-- [그룹 C] PUBLIC-READ : 공개 읽기 + 쓰기는 관리자/작성자
--   ⚠️ ENABLE 시 SELECT 정책이 곧 라이브 사이트 노출을 좌우 → 깨짐 위험 최상.
-- ────────────────────────────────────────────────────────────────────────

-- C-1) joongang_articles — 뉴스 기사. 공개 읽기(USING true), 쓰기는 staff.
--   [수정 적용 2026-06-06] 초안의 USING(is_published=true OR staff)는 기사 행이
--     is_published=true가 아니어서 공개 페이지가 빈 화면이 됨 → 공개 읽기를 USING(true)로 변경.
--   ※ 추후 "초안 숨김"이 필요하면, 실제 게시 컬럼(status 등) 확인 후 그 조건으로 좁힐 것.
--   ※ 이 블록은 네 실제 조치와 일치해야 함(USING(true) 적용 / RLS 비활성 / 데이터 수정 중 무엇이었는지).
ALTER TABLE public.joongang_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "joongang_articles_public_select" ON public.joongang_articles
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "joongang_articles_staff_write" ON public.joongang_articles
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.joongang_staff s
                 WHERE s.user_id = auth.uid() AND s.is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.joongang_staff s
                      WHERE s.user_id = auth.uid() AND s.is_active = true));
-- [검토] 편집자 계정이 joongang_staff(is_active)에 실제 등록돼 있는지 확인(미등록 시 편집 불가).

-- C-2) joongang_sections — 지면/섹션 구조. 활성 섹션 공개.
ALTER TABLE public.joongang_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "joongang_sections_public_select" ON public.joongang_sections
  FOR SELECT TO anon, authenticated
  USING (true);   -- 섹션 트리는 메뉴 렌더링에 필요 → 전체 공개 읽기.

CREATE POLICY "joongang_sections_staff_write" ON public.joongang_sections
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.joongang_staff s
                 WHERE s.user_id = auth.uid() AND s.is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.joongang_staff s
                      WHERE s.user_id = auth.uid() AND s.is_active = true));

-- C-3) pub_reports — 공개 리포트. 게시본 공개, 관리는 플랫폼 관리자.
ALTER TABLE public.pub_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pub_reports_public_select" ON public.pub_reports
  FOR SELECT TO anon, authenticated
  USING (is_published = true);

CREATE POLICY "pub_reports_admin_write" ON public.pub_reports
  FOR ALL TO authenticated
  USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());
-- ⚠️ [검토 — joongang_articles와 동일 위험!] is_published=true 필터.
--   pub_reports 행이 is_published=true가 아니면 공개 페이지가 "빈 화면"이 됨.
--   → pub_reports를 쓰는 화면을 직접 열어 확인. 비어 있으면:
--     SELECT is_published, count(*) FROM public.pub_reports GROUP BY is_published;
--     로 상태 확인 후, USING(true)로 바꾸거나 실제 게시 컬럼 조건으로 수정.
-- [검토] 유료 리포트(price>0) body 전문을 비구매자에게 숨겨야 하면 별도 컬럼/RPC 필요.

-- C-4) instructor_schedules — 강의 일정(개인정보 없음). 공개 읽기, 관리는 관리자.
ALTER TABLE public.instructor_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "instructor_schedules_public_select" ON public.instructor_schedules
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "instructor_schedules_admin_write" ON public.instructor_schedules
  FOR ALL TO authenticated
  USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());

-- C-5) documents — 문서 라이브러리(slug/title/file_url/tags). 공개 다운로드로 추정.
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents_public_select" ON public.documents
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "documents_admin_write" ON public.documents
  FOR ALL TO authenticated
  USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());
-- [검토] 용도 불명확. 공개 라이브러리가 아니라면 위 public SELECT를 제거하고 기본거부로.


-- ────────────────────────────────────────────────────────────────────────
-- [그룹 D] PRIVATE-ADMIN / DENY : 공개·일반 접근 차단
-- ────────────────────────────────────────────────────────────────────────

-- D-1) joongang_staff — 직원 명부(이메일·전화·permissions). 민감 → 관리자만.
ALTER TABLE public.joongang_staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "joongang_staff_self_select" ON public.joongang_staff
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.joongang_staff s
               WHERE s.user_id = auth.uid() AND s.is_active = true
                 AND s.role IN ('admin','editor_in_chief'))
  );

CREATE POLICY "joongang_staff_admin_write" ON public.joongang_staff
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.joongang_staff s
                 WHERE s.user_id = auth.uid() AND s.is_active = true
                   AND s.role IN ('admin','editor_in_chief')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.joongang_staff s
                      WHERE s.user_id = auth.uid() AND s.is_active = true
                        AND s.role IN ('admin','editor_in_chief')));
-- [검토 — 자기참조 주의] 기사 정책(C-1 staff_write)이 staff를 참조하므로,
--   staff SELECT(본인 행 = user_id=auth.uid())가 막히면 기사 staff-쓰기도 영향.
--   현재는 본인 행을 볼 수 있어 EXISTS 동작 OK. role 값('admin','editor_in_chief')이
--   실제 데이터와 일치하는지 확인 필요.

-- D-2) _debug_log — 내부 디버그 로그. 정책 없음 = 기본거부(service_role/소유자만).
ALTER TABLE public._debug_log ENABLE ROW LEVEL SECURITY;
-- [검토] 앱 코드가 _debug_log에 anon으로 INSERT한다면 그 호출도 막힘 → 로깅 누락 가능.