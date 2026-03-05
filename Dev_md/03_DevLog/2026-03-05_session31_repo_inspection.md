# 2026-03-05 — 세션 31: 리포지토리 & 로컬 환경 전체 점검

> **날짜**: 2026-03-05
> **커밋**: 1건 (개발일지)
> **목적**: GitHub 리포지토리와 로컬 작업 환경의 동기화 상태 및 프로젝트 현황 전면 점검

---

## 점검 항목 요약

| 항목 | 상태 |
|------|------|
| 로컬 ↔ 리모트 동기화 | **완전 동기화** (ahead 0, behind 0) |
| 미커밋 코드 변경 | 없음 (`.claude/settings.local.json` 로컬 설정만 수정) |
| Untracked 파일 | `supabase/.temp/` (임시 폴더, 무시 가능) |
| 빌드 상태 | 정상 |
| 배포 사이트 | `ahp-basic.dreamitbiz.com` 정상 운영 중 |

---

## 1. GitHub 리포지토리 현황

| 항목 | 값 |
|------|-----|
| URL | `https://github.com/aebonlee/ahp-basic` |
| 공개 여부 | Public |
| 총 커밋 수 | **154 commits** |
| 브랜치 | `main` (기본), `gh-pages` (배포) |
| 언어 비율 | JavaScript 61% / CSS 23.5% / HTML 13% / PLpgSQL 2.5% |
| 배포 도메인 | `ahp-basic.dreamitbiz.com` (GitHub Pages + CNAME) |
| README | 제목만 존재 (설명 미작성) |

---

## 2. 로컬 프로젝트 구조

### 디렉토리 구성

```
D:\ahp_basic\
├── src/                    — React 소스 코드
│   ├── pages/ (29개)       — 페이지 컴포넌트
│   ├── components/         — UI 컴포넌트
│   │   ├── admin/          — 관리자 패널 (ProjectForm, ParticipantForm 등)
│   │   ├── evaluation/     — 평가 UI (PairwiseGrid, DirectInput 등)
│   │   ├── model/          — 모델 구축 (CriteriaTree, AlternativeForm 등)
│   │   ├── results/        — 결과 표시 (ConsistencyTable, ExportButtons 등)
│   │   ├── sensitivity/    — 민감도 분석 (SensitivityChart, WeightSlider)
│   │   ├── brainstorming/  — 브레인스토밍 (KeywordZone, KeywordItem)
│   │   ├── common/         — 공통 (ProtectedRoute, ErrorBoundary 등)
│   │   └── layout/         — 레이아웃 (PageLayout, PublicLayout 등)
│   ├── lib/                — 핵심 엔진 (ahpEngine, ahpAggregation 등)
│   ├── hooks/              — 커스텀 훅 (useAuth, useProjects 등)
│   ├── contexts/           — Context (Auth, Project, Toast)
│   └── utils/              — 유틸 (formatters, validators, portone)
├── supabase/               — Supabase 마이그레이션 (12개 SQL)
├── Dev_md/                 — 개발 문서 (설계, 개발일지, 검사, 평가, 참조)
├── copy_code/              — 참조 소스 (imakeit 분석)
├── pdf/                    — 문서 자료
└── public/                 — 정적 파일 (CNAME, og-image.png 등)
```

### 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | React 18.3 + Vite 5.4 |
| 라우팅 | react-router-dom 6.28 (HashRouter) |
| 백엔드 | Supabase (Auth + DB + RPC) |
| 차트 | Recharts 2.13 |
| 엑셀 | xlsx (SheetJS) 0.18 |
| 테스트 | Vitest 2.1 + @testing-library/react 16 |
| 배포 | gh-pages → GitHub Pages |

### 주요 페이지 (29개)

| 분류 | 페이지 |
|------|--------|
| 공개 | HomePage, AboutPage, FeaturesPage, GuidePage, ManualPage, ManagementPage, SurveyStatsPage |
| 인증 | LoginPage, SignupPage, ForgotPasswordPage |
| 관리자 | AdminDashboard, ModelBuilderPage, AdminResultPage, EvaluatorManagementPage, SurveyBuilderPage, SuperAdminPage |
| 평가 | EvaluatorMainPage, PairwiseRatingPage, DirectInputPage, EvalPreSurveyPage, EvalResultPage |
| 분석 | StatisticalAnalysisPage, SensitivityPage, ResourceAllocationPage, SurveyResultPage |
| 기타 | BrainstormingPage, ModelConfirmPage, WorkshopPage, InviteLandingPage |

### Supabase 마이그레이션 (12개)

| # | 파일 | 내용 |
|---|------|------|
| 001 | `user_profiles.sql` | 사용자 프로필 테이블 |
| 002 | `direct_input_values.sql` | 직접 입력 값 테이블 |
| 003 | `fix_all_rls.sql` | RLS 정책 전면 수정 |
| 004 | `survey_tables.sql` | 설문 테이블 |
| 005 | `set_admin_roles.sql` | 관리자 역할 설정 |
| 006 | `add_phone_to_evaluators.sql` | 평가자 전화번호 필드 |
| 007 | `invite_anon_rpc.sql` | 익명 초대 RPC |
| 008 | `anon_evaluator_rls.sql` | 익명 평가자 RLS |
| 009 | `superadmin_rpc.sql` | 슈퍼관리자 RPC |
| 010 | `tighten_anon_rls.sql` | 익명 RLS 강화 |
| 011 | `signup_domain_tracking.sql` | 가입 도메인 추적 |
| 012 | `add_fk_indexes.sql` | FK 인덱스 추가 |

---

## 3. 점검 결론

- **코드 동기화**: 로컬과 GitHub가 완벽히 일치. 밀린 커밋이나 충돌 없음.
- **프로젝트 규모**: 29개 페이지, 154 커밋, 12개 DB 마이그레이션으로 성숙한 프로덕션 수준.
- **개선 권고사항**:
  - README 보강 필요 (현재 제목만 존재)
  - `supabase/.temp/` 를 `.gitignore`에 추가 고려
  - gh CLI 인증 설정 필요 (현재 미인증 상태)

---

## 검증

- `git fetch origin` 성공 (리모트 동기화 확인)
- `git status` — 코드 변경 없음 확인
- GitHub 리포지토리 접근 정상 확인
