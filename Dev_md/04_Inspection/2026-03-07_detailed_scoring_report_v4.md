# AHP Basic 세부 점수 보고서 v4

**평가일**: 2026-03-07
**빌드**: 1089 modules / 10.57s
**테스트**: 121/121 passed (9 test files)
**이전 버전**: v3 (7.16/10)

---

## 종합 점수

| 대분류 | v3 | v4 | 변화 | 가중치 | v4 가중 점수 |
|--------|-----|-----|------|--------|-------------|
| 1. 접근성 (Accessibility) | 6.0 | **7.0** | +1.0 | 15% | 1.05 |
| 2. CSS 토큰 일관성 | 5.5 | **7.0** | +1.5 | 10% | 0.70 |
| 3. 코드 품질 | 8.5 | 8.5 | — | 20% | 1.70 |
| 4. SEO & 메타데이터 | 6.0 | **8.0** | +2.0 | 10% | 0.80 |
| 5. 성능 & 번들 최적화 | 8.5 | **9.0** | +0.5 | 15% | 1.35 |
| 6. 보안 | 7.5 | **8.0** | +0.5 | 15% | 1.20 |
| 7. 테스트 & 문서화 | 6.0 | 6.0 | — | 10% | 0.60 |
| 8. UX & 컴포넌트 구조 | 8.0 | 8.0 | — | 5% | 0.40 |
| **종합** | **7.16** | | **+0.64** | **100%** | **7.80 / 10** |

---

## Round 2 개선 내역 요약

### Phase 1: CSS 토큰화 (13 CSS 파일)

| 파일 | 개선 내용 | 치환 수 |
|------|----------|---------|
| AboutPage.module.css | `#0046C8` → `var(--color-brand)`, `#002E8A` → `var(--color-brand-dark)` | ~11곳 |
| FeaturesPage.module.css | 동일 | ~11곳 |
| ManagementPage.module.css | 동일 | ~13곳 |
| GuidePage.module.css | 동일 | ~7곳 |
| ManualPage.module.css | 동일 | ~13곳 |
| SurveyStatsPage.module.css | 동일 | ~11곳 |
| AiApiKeyModal.module.css | 폴백 `#4f46e5` → `#0f2b5b`, rgba 정합 | 3곳 |
| AiChatMessage.module.css | `--color-bg-secondary` → `var(--color-bg-alt)`, 폴백 정합 | 3곳 |
| results.module.css | `#fef2f2` → `var(--color-error-bg)`, `#059669` → `var(--color-success)` | 2곳 |
| EvaluatorManagementPage.module.css | `#dbeafe` → `var(--color-primary-surface)` | 1곳 |
| SuperAdminPage.module.css | `#dbeafe` → `var(--color-primary-surface)` | 1곳 |
| HomePage.module.css | `#10b981` → `var(--color-evaluating)`, `#dbeafe` → `var(--color-primary-surface)` | 3곳 |
| PublicFooter.module.css | 이전 세션에서 완료 확인 | — |
| **합계** | | **~79곳** |

### Phase 2: 접근성 — 폼 라벨 + Button ARIA + 모션 제어

| 파일 | 개선 내용 |
|------|----------|
| Button.jsx | `aria-busy={loading \|\| undefined}` 추가 |
| Button.module.css | `@media (prefers-reduced-motion: reduce)` → spinner 정지 |
| pairwise.module.css | `@media (prefers-reduced-motion: reduce)` → hover transform 제거 |
| ProjectForm.jsx | id="projectName/Desc/evalMethod" + htmlFor 연결 (3필드) |
| ParticipantForm.jsx | id="participantEmail/Name/Phone" + htmlFor 연결 (3필드) |
| LoginPage.jsx | id="loginEmail/Password" + htmlFor 연결 (2필드) |
| SignupPage.jsx | id="signupName/Email/Password/ConfirmPassword" + htmlFor 연결 (4필드) |
| ForgotPasswordPage.jsx | id="resetEmail" + htmlFor 연결 (1필드) |

### Phase 3: 접근성 — 키보드 + 시맨틱 + 스킵 링크

| 파일 | 개선 내용 |
|------|----------|
| ConsistencyTable.jsx | `tabIndex={0}`, `role="button"`, `onKeyDown` (Enter/Space) |
| Navbar.jsx | `<div onClick>` → `<button aria-label="홈으로 이동">` |
| Navbar.module.css | `.logo` button reset 스타일 추가 |
| index.css | `.skip-link` 스타일 (기본 숨김, focus 시 표시) |
| PublicLayout.jsx | `<a href="#main-content" className="skip-link">본문 바로가기</a>` + `id="main-content"` |
| ProjectLayout.jsx | `<main id="main-content">` |

### Phase 4: 빌드 최적화 + 404 페이지

| 파일 | 개선 내용 |
|------|----------|
| vite.config.js | `manualChunks`: vendor-react (163KB), vendor-supabase (173KB), vendor-charts (423KB) |
| NotFoundPage.jsx | 404 UI + "홈으로 돌아가기" 링크 (신규) |
| NotFoundPage.module.css | 404 스타일 (신규) |
| App.jsx | `<Navigate to="/" />` → `<NotFoundPage />`, unused import 제거 |

---

## 1. 접근성 (Accessibility) — 6.0 → 7.0 (+1.0)

### 1-1. ARIA 속성 적용 현황 (v4 업데이트)

| 컴포넌트 | ARIA | 키보드 | 시멘틱 HTML | v3 | v4 |
|----------|------|--------|-------------|-----|-----|
| LoadingSpinner | role="status", aria-live, aria-label | — | div (적절) | 9 | 9 |
| EvaluationProgress | role="progressbar", aria-valuenow/min/max | — | div (적절) | 9 | 9 |
| WeightSlider | role="radiogroup", aria-checked | — | button+h3 | 8 | 8 |
| SensitivityChart | role="img", aria-label | — | div (적절) | 8 | 8 |
| EvalPreSurveyPage Likert | role="radiogroup", hidden radio | — | label+input | 9 | 9 |
| KeywordItem | role="listitem", tabIndex, aria-label | Enter/F2/Delete | div | 8 | 8 |
| KeywordZone | role="region", role="list", label | — | div | 7 | 7 |
| BrainstormingBoard | aria-busy, aria-live | keyboard trash | div | 7 | 7 |
| HierarchyCanvas | role="application", aria-label | — | div+SVG | 7 | 7 |
| CanvasNode | tabIndex={0} | Enter/F2/Delete | div | 7 | 7 |
| PublicNav | aria-label, aria-expanded, aria-current | — | header/nav | 9 | 9 |
| ErrorBoundary | — | — | details/summary | 7 | 7 |
| Modal | — | — | div (적절) | 5 | 5 |
| **Button** | **aria-busy={loading}** | — | button | 7 | **8** |
| **ConsistencyTable** | — | **Enter/Space** | **role="button"** | — | **8** |
| **Navbar logo** | **aria-label** | — | **button** | — | **9** |

### 1-2. v4에서 해결된 미비 항목

| 항목 | v3 상태 | v4 상태 | 비고 |
|------|---------|---------|------|
| skip-to-content 링크 없음 | 미구현 | **해결** | PublicLayout + ProjectLayout |
| 일부 form에 label 미연결 | 미연결 | **해결** | 5개 파일, 14개 필드 id+htmlFor |
| prefers-reduced-motion 제한 | LoadingSpinner만 | **확장** | + Button spinner + pairwise cell |
| ConsistencyTable 키보드 | 미지원 | **해결** | tabIndex, role, onKeyDown |
| Navbar 로고 시맨틱 | div onClick | **해결** | button + aria-label |

### 1-3. 잔존 미비 항목

| 항목 | 심각도 | 영향 |
|------|--------|------|
| Modal focus trap 없음 | Medium | Tab 키로 모달 밖 이동 가능 |
| PairwiseCell 키보드 미지원 | Medium | 쌍대비교 마우스 전용 |
| AlternativeTree div role 없음 | Low | 목록 시멘틱 부족 |
| 색상 대비 WCAG AA 자동 검증 없음 | Low | 수동 확인 필요 |
| ErrorBoundary role="alert" 없음 | Low | 에러 상태 미고지 |

**감점: -1.0** (이전 -1.6에서 개선 — 5개 항목 해결)

### 1-4. prefers-reduced-motion 적용 범위

| 파일 | 적용 대상 | v3 | v4 |
|------|----------|-----|-----|
| LoadingSpinner.module.css | animation-duration | 적용 | 적용 |
| Button.module.css | spinner animation | — | **적용** |
| pairwise.module.css | cell:hover transform | — | **적용** |

**결론: 7.0/10** — 스킵 링크, 폼 라벨, 키보드 접근, Button ARIA, 모션 제어 개선. Modal focus trap, PairwiseCell 키보드 잔존.

---

## 2. CSS 토큰 일관성 — 5.5 → 7.0 (+1.5)

### 2-1. 브랜드 색상 토큰화 (핵심 지표)

| 색상 | v3 잔존 | v4 잔존 | 개선율 |
|------|---------|---------|--------|
| `#0046C8` (brand) | ~66곳 | **0곳** (variables.css 정의만) | **100%** |
| `#002E8A` (brand-dark) | ~6곳 | **0곳** (variables.css 정의만) | **100%** |
| `#4f46e5` (잘못된 primary) | ~6곳 | **0곳** (AI 모듈 전체 수정) | **100%** |
| `#dbeafe` (primary-surface) | ~8곳 | 변수 사용으로 전환 | ~75% |
| `#10b981` (evaluating) | 3곳 | 변수 사용으로 전환 | ~66% |

### 2-2. 파일별 토큰화 상태

| 파일 | v3 상태 | v4 상태 |
|------|---------|---------|
| 6개 공개 페이지 CSS | brand 하드코딩 ~66곳 | **brand 0곳** (구조색상 잔존) |
| HomePage.module.css | 부분 토큰 | **brand+기능색 완료** |
| PublicNav.module.css | 부분 토큰 | 완료 (이전 세션) |
| AiApiKeyModal.module.css | 잘못된 폴백 | **폴백 정합 완료** |
| AiChatMessage.module.css | 폐기 변수 참조 | **올바른 변수 참조** |
| results.module.css | 하드코딩 2곳 | **토큰 치환 완료** |
| EvaluatorManagement.module.css | 하드코딩 1곳 | **토큰 치환 완료** |
| SuperAdminPage.module.css | 하드코딩 1곳 | **토큰 치환 완료** |

### 2-3. 잔존 하드코딩 분류

| 분류 | 설명 | 잔존 수 | 조치 필요 여부 |
|------|------|---------|---------------|
| 구조색 (#f8fafc, #e2e8f0, #0f172a 등) | 공개 페이지 배경/테두리/텍스트 | ~200곳 | 중기 — 변수 존재하나 미적용 |
| 장식색 (nth-child #7c3aed, #0891b2 등) | 다색 카드 구분 | ~120곳 | 불필요 — 의도적 멀티컬러 |
| 흰색/검정 (#fff, #000) | 범용 색상 | ~80곳 | 불필요 — 의도적 |
| 소셜 브랜드 (#4285F4, #3C1E1E 등) | Google/Kakao 로고 | ~10곳 | 불필요 — 브랜드 규정 |
| **브랜드+기능색 (핵심)** | **#0046C8, #002E8A 등** | **0곳** | **완료** |

### 2-4. 다크모드 지원

| 분류 | 파일 수 | 상태 |
|------|---------|------|
| variables.css (마스터) | 1 | 완비 (light + dark) |
| 다크모드 override 있는 CSS | ~5개 | 부분 적용 |
| 다크모드 override 없는 CSS | ~70개 | 미적용 (장기 과제) |

**결론: 7.0/10** — 브랜드 색상 100% 토큰화 완료, 기능색 대부분 치환. 구조색 ~200곳 잔존하나 장식색/브랜드규정색은 의도적. 다크모드 확장은 장기 과제.

---

## 3. 코드 품질 — 8.5 (변동 없음)

Round 2에서 코드 품질 관련 변경 없음. v3과 동일.

---

## 4. SEO & 메타데이터 — 6.0 → 8.0 (+2.0)

### 4-1. v4 개선 항목

| 항목 | v3 상태 | v4 상태 | 점수 변화 |
|------|---------|---------|-----------|
| canonical 태그 | 미설정 | `<link rel="canonical">` 설정 | +1.0 |
| robots.txt | 미생성 | `public/robots.txt` 생성 | +0.5 |
| sitemap.xml | 미생성 | `public/sitemap.xml` 생성 | +0.5 |
| CSP 메타 태그 | 미설정 | `Content-Security-Policy` 완비 | (보안으로 반영) |
| 404 전용 페이지 | `<Navigate to="/" />` | NotFoundPage 컴포넌트 | +0.5 |

### 4-2. 항목별 점수

| 항목 | v3 | v4 |
|------|-----|-----|
| title / description | 10/10 | 10/10 |
| og:title, og:description, og:type | 10/10 | 10/10 |
| og:image (1200x630) | 10/10 | 10/10 |
| twitter:card | 10/10 | 10/10 |
| lang="ko" | 10/10 | 10/10 |
| viewport | 10/10 | 10/10 |
| theme-color | 10/10 | 10/10 |
| preconnect | 9/10 | 9/10 |
| Cache-Control | 9/10 | 9/10 |
| **canonical** | 0/10 | **10/10** |
| **robots.txt** | 0/10 | **9/10** |
| **sitemap.xml** | 0/10 | **9/10** |
| **404 페이지** | 2/10 | **8/10** |
| JSON-LD 구조화 데이터 | 0/10 | 0/10 |
| React Helmet (동적 meta) | 0/10 | 0/10 |

### 4-3. 잔존 과제

| 항목 | 심각도 | 비고 |
|------|--------|------|
| JSON-LD 구조화 데이터 | Medium | 검색 결과 리치 스니펫 |
| React Helmet (동적 meta) | Medium | 페이지별 meta 태그 |
| og:url 동적 갱신 | Low | SPA에서 페이지별 URL |

**결론: 8.0/10** — 정적 SEO 완비 (canonical, robots, sitemap, 404). 구조화 데이터와 동적 meta만 잔존.

---

## 5. 성능 & 번들 최적화 — 8.5 → 9.0 (+0.5)

### 5-1. Vite 빌드 설정 (v4)

| 항목 | v3 | v4 | 비고 |
|------|-----|-----|------|
| manualChunks | 미설정 (5/10) | **설정 완료 (9/10)** | 3개 vendor 청크 분리 |
| 기본 빌드 | 8/10 | 9/10 | 1089 modules, 10.57s |
| minify | 6/10 | 6/10 | 기본값 esbuild |
| sourcemap | 5/10 | 5/10 | 미설정 |

### 5-2. 번들 청크 분리 결과

| 청크 | 크기 | gzip | 비고 |
|------|------|------|------|
| vendor-react | 163.43 KB | 53.38 KB | react + react-dom + react-router-dom |
| vendor-supabase | 173.25 KB | 45.68 KB | @supabase/supabase-js |
| vendor-charts | 423.39 KB | 113.03 KB | recharts |
| xlsx | 429.03 KB | 143.08 KB | 동적 import (사용 시 로드) |
| index (앱 코드) | 54.53 KB | 18.47 KB | 앱 엔트리 |

### 5-3. recharts 사용 현황 (v3 오류 정정)

v3에서 "recharts 미사용이나 package.json에 잔존 (3/10)"으로 평가했으나, 빌드 결과 `vendor-charts-BKei4WL9.js (423KB)`로 정상 번들링됨. SensitivityChart, AdminResultPage 등에서 실제 사용 확인. → **8/10**으로 정정.

**결론: 9.0/10** — manualChunks 분리 완료, vendor 캐싱 최적화. sourcemap/minify 명시 설정만 잔존.

---

## 6. 보안 — 7.5 → 8.0 (+0.5)

### 6-1. v4 개선 항목

| 항목 | v3 | v4 | 비고 |
|------|-----|-----|------|
| CSP 헤더 | 미설정 | **설정 완료** | meta http-equiv 방식 |

### 6-2. CSP 정책 상세

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
font-src 'self' https://cdn.jsdelivr.net;
img-src 'self' data: https:;
connect-src 'self' https://hcmgdztsgjvzcyxyayaj.supabase.co https://*.supabase.co https://api.openai.com https://api.anthropic.com;
frame-src 'none';
```

### 6-3. 잔존 과제

| 항목 | 심각도 | 비고 |
|------|--------|------|
| BOOTSTRAP_ADMIN_EMAILS 하드코딩 | Medium | DB 기반 역할 관리 권장 |
| localStorage에 AI API 키 저장 | Low | 로그아웃 시 삭제됨 |
| 이메일 validator 약함 | Low | 기본 정규식 |

**결론: 8.0/10** — CSP 추가로 보안 계층 강화. XSS 방어 완벽, 라우트 보호 우수.

---

## 7. 테스트 & 문서화 — 6.0 (변동 없음)

Round 2에서 테스트/문서 관련 변경 없음. v3과 동일.

---

## 8. UX & 컴포넌트 구조 — 8.0 (변동 없음)

Round 2에서 UX/구조 관련 변경 없음. v3과 동일.

---

## v3 → v4 개선 항목 총정리

| # | 개선 항목 | 영향 분류 | 점수 영향 |
|---|----------|----------|-----------|
| 1 | 6개 공개 페이지 CSS 브랜드 토큰화 (~66곳) | CSS 토큰 | +1.0 |
| 2 | 7개 기능 CSS 파일 토큰 치환 (~13곳) | CSS 토큰 | +0.5 |
| 3 | Button aria-busy 추가 | 접근성 | +0.1 |
| 4 | prefers-reduced-motion 확장 (Button + pairwise) | 접근성 | +0.2 |
| 5 | 폼 라벨 id+htmlFor 연결 (5파일, 14필드) | 접근성 | +0.2 |
| 6 | ConsistencyTable 키보드 접근 | 접근성 | +0.2 |
| 7 | Navbar 로고 시맨틱 button | 접근성 | +0.1 |
| 8 | 스킵 링크 (PublicLayout + ProjectLayout) | 접근성 | +0.2 |
| 9 | Vite manualChunks 3개 vendor 분리 | 성능 | +0.5 |
| 10 | NotFoundPage 404 전용 페이지 | SEO | +0.5 |
| 11 | canonical 태그 추가 | SEO | +0.5 |
| 12 | robots.txt 생성 | SEO | +0.5 |
| 13 | sitemap.xml 생성 | SEO | +0.5 |
| 14 | CSP Content-Security-Policy 메타 태그 | 보안 | +0.5 |

---

## 메뉴/기능별 종합 점수 (v4)

| 메뉴 | 기능 | 접근성 | CSS | 코드 | 보안 | v3 | v4 |
|------|------|--------|-----|------|------|------|------|
| 공개 홈페이지 | 10 | **9** | 9 | 9 | **10** | 9.0 | **9.4** |
| About/Features | 9 | 7 | **7** | 8 | 9 | 7.4 | **8.0** |
| 이용가이드/설명서 | 9 | 7 | **8** | 9 | 9 | 8.2 | **8.4** |
| 로그인/회원가입 | 9 | **9** | 5 | 9 | 9 | 8.0 | **8.2** |
| 관리자 대시보드 | 9 | 7 | 7 | 8 | 8 | 7.8 | 7.8 |
| 모델 빌더 | 9 | 7 | 5 | 8 | 8 | 7.4 | 7.4 |
| 브레인스토밍 | 8 | 8 | 5 | 8 | 8 | 7.4 | 7.4 |
| 설문 빌더 | 9 | 6 | 6 | 8 | 8 | 7.4 | 7.4 |
| 평가자 관리 | 8 | 6 | **7** | 8 | 9 | 7.4 | **7.6** |
| 쌍대비교 평가 | 9 | **6** | 7 | 9 | 9 | 7.8 | **8.0** |
| 직접입력 평가 | 8 | 6 | 7 | 9 | 8 | 7.6 | 7.6 |
| 사전설문 | 8 | 8 | 5 | 8 | 8 | 7.4 | 7.4 |
| 결과 집계 | 9 | **7** | **6** | 8 | 8 | 7.2 | **7.6** |
| 민감도 분석 | 8 | 8 | 7 | 8 | 8 | 7.8 | 7.8 |
| 자원 배분 | 9 | 6 | 5 | 8 | 8 | 7.2 | 7.2 |
| 통계 분석 | 8 | 6 | 5 | 8 | 8 | 7.0 | 7.0 |
| AI 분석도구 | 7 | 5 | **6** | 7 | 7 | 6.2 | **6.4** |
| 슈퍼관리자 | 8 | 5 | **7** | 8 | 7 | 6.8 | **7.0** |

---

## 우선순위별 남은 개선 로드맵

### 즉시 개선 (High Impact, Low Effort)

1. ~~robots.txt / sitemap.xml 생성~~ → **완료 (v4)**
2. ~~CSP 메타 태그 추가~~ → **완료 (v4)**
3. ~~manualChunks 설정~~ → **완료 (v4)**
4. ~~공개 페이지 브랜드 토큰화~~ → **완료 (v4)**
5. ~~skip-to-content 링크~~ → **완료 (v4)**
6. ~~404 전용 페이지~~ → **완료 (v4)**

### 중기 개선 (Medium Impact, Medium Effort)

7. **Modal focus trap 구현** — 접근성 +0.3
8. **PairwiseCell 키보드 지원** — 핵심 기능 접근성 +0.3
9. **구조색 CSS 토큰화** (~200곳 #f8fafc, #e2e8f0 등) — CSS +0.5
10. **CanvasNode CSS 토큰화** (~20곳) — CSS +0.2
11. **AuthPage CSS 토큰화** (~12곳, 소셜 브랜드 제외) — CSS +0.1
12. **JSON-LD 구조화 데이터** — SEO +0.5

### 장기 개선 (Lower Impact, High Effort)

13. **다크모드 ~70개 파일 override** — CSS 대폭 개선
14. **컴포넌트 테스트 추가** (React Testing Library) — 테스트 +2.0
15. **React Helmet 도입** — 동적 SEO +0.5
16. **Prettier + husky 설정** — 개발 도구 +0.5
17. **sourcemap 빌드 설정** — 성능 +0.2

---

## 결론

**v3 → v4: 7.16 → 7.80 (+0.64)**

Round 2 개선으로 6개 대분류에서 점수 향상:
- **SEO (+2.0)**: canonical, robots.txt, sitemap.xml, 404 페이지 완비
- **CSS 토큰 (+1.5)**: 브랜드 색상 100% 토큰화, 기능색 대부분 치환
- **접근성 (+1.0)**: 스킵 링크, 폼 라벨, 키보드, ARIA, 모션 제어
- **보안 (+0.5)**: CSP Content-Security-Policy 추가
- **성능 (+0.5)**: manualChunks 3개 vendor 청크 분리

남은 최대 개선 여지: **테스트 & 문서화 (6.0)** — 컴포넌트/페이지 테스트 추가 시 8.0+ 도달 가능.
중기 과제(Modal focus trap, PairwiseCell 키보드, 구조색 토큰화) 완료 시 **8.0+** 예상.
