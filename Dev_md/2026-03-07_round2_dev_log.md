# 개발 일지 — 2026-03-07 (Round 2: 품질 향상)

## 작업 목표
6개 감사 보고서(접근성, CSS 토큰, 코드 품질, SEO, 보안, 문서화) 기반 남은 개선 항목 수정.
기능 변경 없이 CSS 토큰화, 접근성, 빌드 최적화를 중심으로 품질 향상.

## 빌드 결과
- **모듈**: 1089개 / **빌드 시간**: 10.51s
- **테스트**: 121/121 전원 통과

---

## Phase 1: CSS 토큰화 (13 CSS 파일, ~79곳 치환)

### 1-1. 6개 공개 페이지 CSS — 브랜드 색상 100% 토큰화
- `AboutPage.module.css` — `#0046C8` → `var(--color-brand)`, `#002E8A` → `var(--color-brand-dark)` (~11곳)
- `FeaturesPage.module.css` — 동일 (~11곳)
- `ManagementPage.module.css` — 동일 (~13곳)
- `GuidePage.module.css` — 동일 (~7곳)
- `ManualPage.module.css` — 동일 (~13곳)
- `SurveyStatsPage.module.css` — 동일 (~11곳)

### 1-2. 기타 CSS 파일
- `AiApiKeyModal.module.css` — 폴백 `#4f46e5` → `#0f2b5b`, rgba(79,70,229) → rgba(15,43,91) (3곳)
- `AiChatMessage.module.css` — `--color-bg-secondary` → `var(--color-bg-alt)` (2곳), 폴백 정합 (1곳)
- `results.module.css` — `#fef2f2` → `var(--color-error-bg)`, `#059669` → `var(--color-success)` (2곳)
- `EvaluatorManagementPage.module.css` — `#dbeafe` → `var(--color-primary-surface)` (1곳)
- `SuperAdminPage.module.css` — `#dbeafe` → `var(--color-primary-surface)` (1곳)
- `HomePage.module.css` — `#10b981` → `var(--color-evaluating)`, `#dbeafe` → `var(--color-primary-surface)` (3곳)

**결과**: `#0046C8`, `#002E8A` 하드코딩 0건 (variables.css 정의만 잔존)

---

## Phase 2: 접근성 — 폼 라벨 + Button ARIA + 모션 제어 (7 JSX + 2 CSS)

### 2-1. Button 접근성
- `Button.jsx` — `aria-busy={loading || undefined}` 추가
- `Button.module.css` — `@media (prefers-reduced-motion: reduce)` spinner animation: none

### 2-2. Pairwise 모션 제어
- `pairwise.module.css` — `@media (prefers-reduced-motion: reduce)` → `.cell:hover { transform: none; }`

### 2-3. 폼 라벨 연결 (5파일, 14필드)
- `ProjectForm.jsx` — projectName, projectDesc, evalMethod
- `ParticipantForm.jsx` — participantEmail, participantName, participantPhone
- `LoginPage.jsx` — loginEmail, loginPassword
- `SignupPage.jsx` — signupName, signupEmail, signupPassword, signupConfirmPassword
- `ForgotPasswordPage.jsx` — resetEmail

---

## Phase 3: 접근성 — 키보드 + 시맨틱 + 스킵 링크 (5 파일)

### 3-1. ConsistencyTable 키보드 접근
- `ConsistencyTable.jsx` — `tabIndex={0}`, `role="button"`, `onKeyDown` (Enter/Space)

### 3-2. Navbar 로고 시맨틱
- `Navbar.jsx` — `<div onClick>` → `<button aria-label="홈으로 이동">`
- `Navbar.module.css` — button reset 스타일 (border:none, background:none)

### 3-3. 스킵 링크
- `index.css` — `.skip-link` 스타일 (기본 숨김, focus 시 fixed 표시)
- `PublicLayout.jsx` — `<a href="#main-content" className="skip-link">본문 바로가기</a>`, `<main id="main-content">`
- `ProjectLayout.jsx` — `<main id="main-content">`

---

## Phase 4: 빌드 최적화 + 404 페이지 (4 파일)

### 4-1. Vite manualChunks
- `vite.config.js` — vendor-react (163KB), vendor-supabase (173KB), vendor-charts (423KB) 분리

### 4-2. 404 페이지
- `NotFoundPage.jsx` (신규) — 404 코드 + 메시지 + "홈으로 돌아가기"
- `NotFoundPage.module.css` (신규) — 404 UI 스타일
- `App.jsx` — `<Navigate to="/" />` → `<NotFoundPage />`, 미사용 Navigate import 제거

---

## 추가 개선: 회원가입 페이지 소셜 로그인

- `SignupPage.jsx` — 이메일 폼 아래에 Google/Kakao 가입 버튼 추가
  - LoginPage와 동일한 SVG 아이콘 + 스타일 사용
  - `loginWithGoogle()`, `loginWithKakao()` 호출

---

## 점수 변화 (v3 → v4)

| 대분류 | v3 | v4 | 변화 |
|--------|-----|-----|------|
| 접근성 | 6.0 | 7.0 | +1.0 |
| CSS 토큰 일관성 | 5.5 | 7.0 | +1.5 |
| 코드 품질 | 8.5 | 8.5 | — |
| SEO & 메타데이터 | 6.0 | 8.0 | +2.0 |
| 성능 & 번들 최적화 | 8.5 | 9.0 | +0.5 |
| 보안 | 7.5 | 8.0 | +0.5 |
| 테스트 & 문서화 | 6.0 | 6.0 | — |
| UX & 컴포넌트 구조 | 8.0 | 8.0 | — |
| **종합** | **7.16** | **7.80** | **+0.64** |

---

## 변경 파일 목록 (총 ~32파일)

### 수정
| 파일 | 변경 유형 |
|------|----------|
| src/pages/AboutPage.module.css | CSS 토큰화 |
| src/pages/FeaturesPage.module.css | CSS 토큰화 |
| src/pages/ManagementPage.module.css | CSS 토큰화 |
| src/pages/GuidePage.module.css | CSS 토큰화 |
| src/pages/ManualPage.module.css | CSS 토큰화 |
| src/pages/SurveyStatsPage.module.css | CSS 토큰화 |
| src/pages/HomePage.module.css | CSS 토큰화 |
| src/pages/EvaluatorManagementPage.module.css | CSS 토큰화 |
| src/pages/SuperAdminPage.module.css | CSS 토큰화 |
| src/components/ai/AiApiKeyModal.module.css | 폴백 색상 수정 |
| src/components/ai/AiChatMessage.module.css | 변수 참조 수정 |
| src/styles/results.module.css | CSS 토큰화 |
| src/components/common/Button.jsx | aria-busy 추가 |
| src/components/common/Button.module.css | reduced-motion |
| src/styles/pairwise.module.css | reduced-motion |
| src/components/admin/ProjectForm.jsx | 폼 라벨 연결 |
| src/components/admin/ParticipantForm.jsx | 폼 라벨 연결 |
| src/pages/LoginPage.jsx | 폼 라벨 연결 |
| src/pages/SignupPage.jsx | 폼 라벨 + 소셜 가입 버튼 |
| src/pages/ForgotPasswordPage.jsx | 폼 라벨 연결 |
| src/components/results/ConsistencyTable.jsx | 키보드 접근 |
| src/components/layout/Navbar.jsx | 로고 시맨틱 button |
| src/components/layout/Navbar.module.css | button reset |
| src/index.css | 스킵 링크 스타일 |
| src/components/layout/PublicLayout.jsx | 스킵 링크 + main id |
| src/components/layout/ProjectLayout.jsx | main id |
| vite.config.js | manualChunks |
| src/App.jsx | NotFoundPage 라우트 |

### 신규
| 파일 | 설명 |
|------|------|
| src/pages/NotFoundPage.jsx | 404 페이지 |
| src/pages/NotFoundPage.module.css | 404 스타일 |
| Dev_md/04_Inspection/2026-03-07_round2_improvement_plan.md | 개선 계획서 |
| Dev_md/04_Inspection/2026-03-07_detailed_scoring_report_v4.md | v4 점수 보고서 |
