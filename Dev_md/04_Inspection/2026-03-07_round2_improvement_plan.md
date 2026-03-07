# 추가 개선 계획 — AHP Basic 품질 향상 (Round 2)

## Context
6개 감사 보고서(접근성, CSS 토큰, 코드 품질, SEO, 보안, 문서화)에서 식별된 남은 개선 항목을 수정한다.
이전 세션에서 Phase 1~4 + 즉시 개선(robots.txt, sitemap.xml, CSP, canonical, CSS 변수 12개)은 완료됨.
기능을 깨뜨리지 않으면서 CSS 토큰화, 접근성, 빌드 최적화를 올리는 것이 목표.

---

## Phase 1: 공개 페이지 CSS 토큰화 (13 CSS 파일, 로직 변경 0)

**목표**: 하드코딩된 `#0046C8` → `var(--color-brand)`, `#002E8A` → `var(--color-brand-dark)` 등 치환

### 1-1. 6개 공개 페이지 CSS (대량 치환)
| 파일 | 주요 치환 |
|------|----------|
| `src/pages/AboutPage.module.css` | `#0046C8` → `var(--color-brand)`, `#002E8A` → `var(--color-brand-dark)` (~10곳) |
| `src/pages/FeaturesPage.module.css` | 동일 (~10곳) |
| `src/pages/ManagementPage.module.css` | 동일 (~12곳) |
| `src/pages/GuidePage.module.css` | 동일 (~6곳) |
| `src/pages/ManualPage.module.css` | 동일 (~12곳) |
| `src/pages/SurveyStatsPage.module.css` | 동일 (~10곳) |

### 1-2. 기타 CSS 파일 토큰 수정
| 파일 | 변경 내용 |
|------|----------|
| `src/components/layout/PublicFooter.module.css` | `#111827` → `var(--color-dark)`, `#e5e7eb` → `var(--color-text-light)` |
| `src/pages/HomePage.module.css` | `#10b981` → `var(--color-evaluating)`, `#dbeafe` → `var(--color-primary-surface)` |
| `src/components/ai/AiApiKeyModal.module.css` | 폴백 `#4f46e5` → `#0f2b5b` (3곳) |
| `src/components/ai/AiChatMessage.module.css` | `--color-bg-secondary` → `var(--color-bg-alt)` (2곳), 폴백 `#4f46e5` → `#0f2b5b` |
| `src/styles/results.module.css` | `#fef2f2` → `var(--color-error-bg)`, `#059669` → `var(--color-success)` |
| `src/pages/EvaluatorManagementPage.module.css` | `#dbeafe` → `var(--color-primary-surface)` |
| `src/pages/SuperAdminPage.module.css` | `#dbeafe` → `var(--color-primary-surface)` |

**주의**: `rgba()` 안의 값은 CSS 변수로 대체 불가 → 그대로 유지. nth-child별 구분 색상(#7c3aed 등)도 유지.

---

## Phase 2: 접근성 — 폼 라벨 + Button ARIA + 모션 제어 (7 JSX + 2 CSS)

### 2-1. Button 접근성
**파일**: `src/components/common/Button.jsx`
- `<button>` 에 `aria-busy={loading || undefined}` 추가

**파일**: `src/components/common/Button.module.css`
- 파일 끝에 `@media (prefers-reduced-motion: reduce)` 추가 → spinner animation: none

### 2-2. Pairwise 모션 제어
**파일**: `src/styles/pairwise.module.css`
- 파일 끝에 `@media (prefers-reduced-motion: reduce)` 추가 → `.cell:hover { transform: none; }`

### 2-3. 폼 라벨 연결 (id + htmlFor)
| 파일 | 필드 |
|------|------|
| `src/components/admin/ProjectForm.jsx` | projectName, projectDesc, evalMethod |
| `src/components/admin/ParticipantForm.jsx` | participantEmail, participantName, participantPhone |
| `src/pages/LoginPage.jsx` | loginEmail, loginPassword |
| `src/pages/SignupPage.jsx` | signupName, signupEmail, signupPassword, signupConfirmPassword |
| `src/pages/ForgotPasswordPage.jsx` | resetEmail |

---

## Phase 3: 접근성 — 키보드 + 시맨틱 + 스킵 링크 (5 파일)

### 3-1. ConsistencyTable 키보드 접근
**파일**: `src/components/results/ConsistencyTable.jsx`
- `<tr>` 에 `tabIndex={0}`, `role="button"`, `onKeyDown` (Enter/Space) 추가

### 3-2. Navbar 로고 시맨틱
**파일**: `src/components/layout/Navbar.jsx`
- `<div onClick>` → `<button>` + `aria-label="홈으로 이동"`
**파일**: `src/components/layout/Navbar.module.css`
- `.logo` 에 button reset 스타일 추가 (border:none, background:none, cursor:pointer)

### 3-3. 스킵 링크 (Skip to main content)
**파일**: `src/styles/index.css`
- `.skip-link` 스타일 추가 (기본 숨김, focus 시 나타남)

**파일**: `src/components/layout/PublicLayout.jsx`
- `<a href="#main-content" className="skip-link">본문 바로가기</a>` 추가
- `<main>` 에 `id="main-content"` 추가

**파일**: `src/components/layout/ProjectLayout.jsx`
- `<main>` 에 `id="main-content"` 추가

---

## Phase 4: 빌드 최적화 + 404 페이지 (3 파일)

### 4-1. Vite manualChunks
**파일**: `vite.config.js`
```js
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react': ['react', 'react-dom', 'react-router-dom'],
        'vendor-supabase': ['@supabase/supabase-js'],
        'vendor-charts': ['recharts'],
      },
    },
  },
},
```

### 4-2. 404 페이지
**신규 파일**: `src/pages/NotFoundPage.jsx`, `src/pages/NotFoundPage.module.css`
- 404 코드 + 메시지 + "홈으로 돌아가기" 링크

**파일**: `src/App.jsx`
- `const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));`
- `<Route path="*" element={<Navigate to="/" replace />} />` → `<Route path="*" element={<NotFoundPage />} />`

---

## 검증 계획

각 Phase 완료 후:
1. `npm run build` — 빌드 성공 확인
2. `npm run test -- --run` — 121개 테스트 전원 통과 확인

Phase별 추가 검증:
- Phase 1: 공개 페이지 색상 변화 없음 확인, 다크모드 토글 시 brand 색상 전환 확인
- Phase 2: 폼 라벨 클릭 → 입력 필드 포커스 확인, prefers-reduced-motion 활성화 시 애니메이션 중지 확인
- Phase 3: Tab키로 ConsistencyTable 행 탐색 + Enter 실행, 스킵 링크 Tab → 본문 이동
- Phase 4: dist/assets 에 vendor 청크 분리 확인, /#/nonexistent → 404 페이지 확인

---

## 파일 변경 요약

| 구분 | 수정 파일 | 신규 파일 |
|------|----------|----------|
| Phase 1 | 13 CSS 파일 | 0 |
| Phase 2 | 7 JSX + 2 CSS | 0 |
| Phase 3 | 3 JSX + 2 CSS | 0 |
| Phase 4 | 2 (vite.config.js, App.jsx) | 2 (NotFoundPage.jsx/css) |
| **합계** | **~29 파일** | **2 파일** |
