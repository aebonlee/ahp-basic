# 참고 자료 수집 및 분석 인덱스

> 정리일: 2026-02-22
> 분석 대상: imakeit.kr AHP 서비스 9개 페이지
> 커버리지: ~85%

---

## 1. 자료 수집 일자별 정리

### 2026-02-22 (전체 수집)

모든 참고 자료는 2026-02-22에 수집 및 분석되었다.

---

## 2. 항목별 분류

### 2.1 서비스 분석 자료

| # | 분류 | 파일 경로 | 내용 요약 |
|---|------|-----------|-----------|
| 1 | 서비스 정보 | `Dev_md/06_Reference/imakeit_service_info.md` | I Make It 서비스 개요, 요금제, 기능 목록 |
| 2 | PDF 분석 | `Dev_md/06_Reference/pdf_analysis_complete.md` | AHP_IMakeIt_QuickStart.pdf (41p), quick_start_for_participant.pdf (10p) 분석 |
| 3 | www 저장소 | `Dev_md/06_Reference/www_repo_analysis.md` | www.dreamitbiz.com 소스코드 분석 결과 |

### 2.2 페이지별 소스 분석 (copy_code/)

| # | 페이지명 | 폴더 | 분석 파일 | 핵심 내용 |
|---|----------|------|-----------|-----------|
| 1 | 관리자 대시보드 | `copy_code/2026-02-22_imakeit_default_page/` | `source_analysis.md` | 프로젝트 상태 관리, 4단계 흐름, 좌측패널 구조 |
| 2 | 모델 빌더 | `copy_code/2026-02-22_imakeit_model_builder/` | `source_analysis.md`, `model_builder_full_analysis.md` | 트리 차트 JS 로직, 기준/대안 CRUD, 클릭 이벤트 |
| 3 | 브레인스토밍 | `copy_code/2026-02-22_imakeit_brainstorming/` | `source_analysis.md`, `brainstorming_usage_guide.md` | 4개 존 구조, 드래그앤드롭, 6단계 사용법 |
| 4 | 모델 확정 | `copy_code/2026-02-22_imakeit_model_confirm/` | `source_analysis.md` | 모델 확정 흐름, 상태 전환 (대기중→평가중) |
| 5 | 평가 시작 | `copy_code/2026-02-22_imakeit_eval_start/` | `source_analysis.md` | 평가자 초대, 평가 시작 프로세스 |
| 6 | 평가자 메인 | `copy_code/2026-02-22_imakeit_evaluator_main/` | `source_analysis.md` | 평가자용 프로젝트 목록, 평가방법 소개 |
| 7 | 쌍대비교 평가 | `copy_code/2026-02-22_imakeit_pairwise_rating/` | `source_analysis.md`, `visual_render_analysis.md` | 17셀 그리드, CSS 패턴, AJAX 흐름, 셀 크기/색상 |
| 8 | 평가 Mock-up | `copy_code/2026-02-22_imakeit_eval_mockup/` | `source_analysis.md` | 평가 UI 목업, 레이아웃 참고 |
| 9 | 평가 결과 | `copy_code/2026-02-22_imakeit_eval_result/` | `source_analysis.md` | 결과 표시, Excel 내보내기, 서명 확인 |

### 2.3 개발 문서 (Dev_md/)

| # | 분류 | 파일 경로 | 내용 |
|---|------|-----------|------|
| 1 | 가이드 | `Dev_md/01_Guide/development_guide.md` | 프로젝트 개요, 기술 스택, 폴더 구조, 개발 프로세스 |
| 2 | 디자인 | `Dev_md/02_Design/design_system.md` | 색상 팔레트, 타이포그래피, 레이아웃, 컴포넌트 |
| 3 | 개발일지 | `Dev_md/03_DevLog/2026-02-22_project_init.md` | 초기 프로젝트 설정 기록 |
| 4 | 개발일지 | `Dev_md/03_DevLog/2026-02-22_source_analysis_complete.md` | 9개 페이지 소스 분석 완료 보고 |
| 5 | 개발일지 | `Dev_md/03_DevLog/2026-02-22_full_development_plan.md` | 전체 11 Phase 개발 계획 |
| 6 | 개발일지 | `Dev_md/03_DevLog/2026-02-22_implementation_complete.md` | 구현 완료 보고 (파일 현황, 테스트 결과) |
| 7 | 개발일지 | `Dev_md/03_DevLog/2026-02-22_post_deployment_fixes.md` | 배포 후 수정 기록 (인증, 리다이렉트, 도메인, SQL) |
| 8 | 개발계획 | `Dev_md/03_DevLog/2026-02-22_claude_plan_backup.md` | Claude 개발 계획 원본 백업 (11 Phase, 130 tasks) |
| 9 | 검수 | `Dev_md/04_Inspection/inspection_template.md` | 검수 체크리스트 템플릿 |
| 10 | 평가 | `Dev_md/05_Evaluation/evaluation_template.md` | 평가 점수 템플릿 |

---

## 3. 핵심 분석 결과 요약

### 3.1 데이터 구조 매핑 (원본 → 구현)

| 원본 (ASP.NET) | 구현 (React + Supabase) |
|----------------|------------------------|
| SQL Server 테이블 | Supabase PostgreSQL |
| `p_idx` (프로젝트 ID) | `projects.id` (UUID) |
| `ssang_item_no1`, `ssang_item_no2` | `pairwise_comparisons.item1_id`, `item2_id` |
| `ssang_value` (-9~9) | `pairwise_comparisons.value` |
| `btn_ajax_ssang()` JS 함수 | `usePairwiseComparison` 훅 |
| Server-side AHP 계산 | 클라이언트 `ahpEngine.js` |
| GridView/Label 렌더링 | React 컴포넌트 렌더링 |

### 3.2 CSS 패턴 매핑

| 원본 | 구현 |
|------|------|
| `td { width: 30px; height: 30px; }` (데스크탑) | `--cell-size-desktop: 30px` |
| `td { width: 17px; height: 17px; }` (모바일) | `--cell-size-mobile: 17px` |
| 파랑 그라데이션: `#38d` | `--color-pairwise-left: #38d` |
| 빨강 그라데이션: `#e77` | `--color-pairwise-right: #e77` |
| 선택 배경: `rgba(30,250,200,0.3)` | `--color-pairwise-selected: rgba(30,250,200,0.3)` |

### 3.3 API 엔드포인트 매핑

| 원본 (AJAX) | 구현 (Supabase) |
|-------------|----------------|
| `AjaxProcess.aspx?mode=ssang_write` | `supabase.from('pairwise_comparisons').upsert()` |
| `AjaxProcess.aspx?mode=delete` | `supabase.from('criteria').delete()` |
| `AjaxProcess.aspx?mode=insert` | `supabase.from('criteria').insert()` |
| 서버 세션 기반 인증 | Supabase Auth (JWT) |

---

### 2.4 www.dreamitbiz.com 분석 자료

| # | 분류 | 파일 경로 | 내용 |
|---|------|-----------|------|
| 1 | 인증 패턴 | `Dev_md/06_Reference/www_repo_analysis.md` | Supabase Auth 구조, Google/Kakao OAuth, 프로필 트리거, 관리자 이메일 목록 |
| 2 | 결제 패턴 | `Dev_md/06_Reference/www_repo_analysis.md` | PortOne V2 SDK, KG Inicis, 카드/계좌이체 |
| 3 | 가드 패턴 | `Dev_md/06_Reference/www_repo_analysis.md` | AuthGuard, AdminGuard 컴포넌트 |

### 2.5 적용 결과 (2026-02-22 배포 후)

| # | 작업 | 관련 커밋 | 결과 |
|---|------|-----------|------|
| 1 | 인증 시스템 적용 | `ea0b592` | Google/Kakao OAuth + 이메일 로그인/회원가입/비밀번호 재설정 |
| 2 | 랜딩 페이지 | `89e3425` | HomePage.jsx 신규 생성 |
| 3 | 리다이렉트 수정 | `8a1be2f` | 하위 도메인별 동적 리다이렉트 |
| 4 | 코드 감사 | `cc2c3b9` | 15개 이슈 분석, 7개 수정 |
| 5 | 네비게이션 | `0bc2e0f` | 로고 클릭 → 홈 이동 |
| 6 | PKCE 설정 | `5ab3b17` | Supabase Auth PKCE flow 명시적 설정 |
| 7 | URL 수정 | `2282862` | OAuth redirectTo trailing slash 제거 |
| 8 | 도메인 변경 | `c2d39d4` | ahp_basic → ahp-basic (DNS RFC 952) |
| 9 | SQL 재구성 | `bc0f40e` | DB 마이그레이션 테이블 순서 재구성 |

---

## 4. 미분석 영역 (~15%)

- 관리자 설정 페이지 (계정 관리, 프로필 편집)
- 결제/구독 관리 (요금제 관련)
- 워크숍 실시간 기능 (원본의 SignalR 기반)
- 자원배분 상세 알고리즘
- 관리자 집계 결과의 상세 통계

---

## 5. copy_code/ 파일 목록 (실제)

```
copy_code/
├── README.md                                    # 전체 인덱스
├── 2026-02-22_imakeit_default_page/
│   ├── default.aspx.html                        # ✅ 관리자 대시보드 HTML
│   └── source_analysis.md
├── 2026-02-22_imakeit_model_builder/
│   ├── model_builder.aspx.html                  # ✅ 모델 빌더 HTML
│   ├── source_analysis.md
│   └── model_builder_full_analysis.md           # 상세 JS 분석
├── 2026-02-22_imakeit_brainstorming/
│   ├── brainstorming.aspx.html                  # ✅ 브레인스토밍 HTML
│   ├── source_analysis.md
│   └── brainstorming_usage_guide.md             # 6단계 사용법
├── 2026-02-22_imakeit_model_confirm/
│   └── source_analysis.md                       # ❌ HTML 미저장 (분석만)
├── 2026-02-22_imakeit_eval_start/
│   └── source_analysis.md                       # ❌ HTML 미저장 (분석만)
├── 2026-02-22_imakeit_evaluator_main/
│   └── source_analysis.md                       # ❌ HTML 미저장 (분석만)
├── 2026-02-22_imakeit_pairwise_rating/
│   ├── pairwise_subcriteria.aspx.html           # ✅ 2차 기준 쌍대비교 HTML
│   ├── source_analysis.md
│   └── visual_render_analysis.md                # CSS/시각 분석
├── 2026-02-22_imakeit_eval_mockup/
│   ├── eval_mockup.aspx.html                    # ✅ 평가 목업 HTML
│   └── source_analysis.md
└── 2026-02-22_imakeit_eval_result/
    └── source_analysis.md                       # ❌ HTML 미저장 (분석만)
```

> HTML 원본 5개 보유, 분석 메모만 4개 (model_confirm, eval_start, evaluator_main, eval_result)
