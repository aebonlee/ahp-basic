# AHP Basic 세부 점수 보고서 v3

**평가일**: 2026-03-07
**빌드**: 1087 modules / 9.83s
**테스트**: 121/121 passed (9 test files)

---

## 종합 점수

| 대분류 | 점수 | 가중치 | 가중 점수 |
|--------|------|--------|-----------|
| 1. 접근성 (Accessibility) | 6.0 / 10 | 15% | 0.90 |
| 2. CSS 토큰 일관성 | 5.5 / 10 | 10% | 0.55 |
| 3. 코드 품질 | 8.5 / 10 | 20% | 1.70 |
| 4. SEO & 메타데이터 | 6.0 / 10 | 10% | 0.60 |
| 5. 성능 & 번들 최적화 | 8.5 / 10 | 15% | 1.28 |
| 6. 보안 | 7.5 / 10 | 15% | 1.13 |
| 7. 테스트 & 문서화 | 6.0 / 10 | 10% | 0.60 |
| 8. UX & 컴포넌트 구조 | 8.0 / 10 | 5% | 0.40 |
| **종합** | | **100%** | **7.16 / 10** |

---

## 1. 접근성 (Accessibility) — 6.0/10

### 1-1. ARIA 속성 적용 현황

| 컴포넌트 | ARIA | 키보드 | 시멘틱 HTML | 점수 |
|----------|------|--------|-------------|------|
| LoadingSpinner | role="status", aria-live, aria-label | — | div (적절) | 9/10 |
| EvaluationProgress | role="progressbar", aria-valuenow/min/max | — | div (적절) | 9/10 |
| WeightSlider | role="radiogroup", aria-checked | — | button+h3 | 8/10 |
| SensitivityChart | role="img", aria-label | — | div (적절) | 8/10 |
| EvalPreSurveyPage Likert | role="radiogroup", hidden radio | — | label+input | 9/10 |
| KeywordItem (브레인스토밍) | role="listitem", tabIndex, aria-label | Enter/F2/Delete | div | 8/10 |
| KeywordZone | role="region", role="list", label | — | div | 7/10 |
| BrainstormingBoard | aria-busy, aria-live | keyboard trash | div | 7/10 |
| HierarchyCanvas | role="application", aria-label | — | div+SVG | 7/10 |
| CanvasNode | tabIndex={0} | Enter/F2/Delete | div | 7/10 |
| PublicNav | aria-label, aria-expanded, aria-current | — | header/nav | 9/10 |
| ErrorBoundary | — | — | details/summary | 7/10 |
| Modal | — | — | div (적절) | 5/10 |
| Button | — | — | button (적절) | 7/10 |

**평균: 7.6/10** (개선된 컴포넌트)

### 1-2. 접근성 미비 항목

| 항목 | 영향 | 심각도 |
|------|------|--------|
| Modal에 focus trap 없음 | Tab 키로 모달 밖 이동 가능 | Medium |
| skip-to-content 링크 없음 | 스크린리더 사용자 탐색 불편 | Medium |
| 일부 form에 label 미연결 | SurveyBuilder, ProjectForm 일부 | Low |
| prefers-reduced-motion 적용 범위 제한 | LoadingSpinner만 적용 | Low |
| AlternativeTree div에 role 없음 | 목록 시멘틱 부족 | Low |
| 색상 대비 검증 미완 | WCAG AA 자동 검증 없음 | Low |
| PairwiseCell 키보드 미지원 | 쌍대비교 마우스 전용 | Medium |
| ErrorBoundary에 role="alert" 없음 | 에러 상태 미고지 | Low |

**미비 항목 감점: -1.6**

### 1-3. prefers-reduced-motion

| 파일 | 적용 | 상태 |
|------|------|------|
| LoadingSpinner.module.css | animation-duration: 4s | 적용됨 |
| pairwise.module.css | transition 미적용 | 미적용 |
| BrainstormingBoard.module.css | DnD 애니메이션 미적용 | 미적용 |

**결론: 6.0/10** — Phase 1 개선으로 주요 위젯 ARIA 완비, 하지만 Modal focus trap, skip-to-content, PairwiseCell 키보드 등 남은 과제

---

## 2. CSS 토큰 일관성 — 5.5/10

### 2-1. 하드코딩 색상 현황 (파일별)

| 파일 | 하드코딩 수 | 심각도 | 비고 |
|------|------------|--------|------|
| AboutPage.module.css | ~25곳 | High | #0046C8, #f8fafc, #e2e8f0 등 |
| CanvasNode.module.css | ~20곳 | High | paper mode 전용 컬러 포함 |
| AiApiKeyModal.module.css | ~10곳 | Medium | #4f46e5 잘못된 primary |
| AuthPage.module.css | ~12곳 | Medium | 소셜 로그인 브랜드 색상 포함 |
| EvalResultPage.module.css | ~10곳 | Medium | warning/error 상태 |
| EvalPreSurveyPage.module.css | ~8곳 | Medium | success/warning |
| AiAnalysisPage.module.css | ~15곳 | Medium | fallback 값 수정됨 |
| AiChatLayout.module.css | ~8곳 | Medium | 분리 직후 미토큰화 |
| EvaluatorMainPage.module.css | ~10곳 | Medium | warning 색상 |
| ResourceAllocationPage.module.css | ~8곳 | Medium | error/success |
| GuideShell.module.css | ~4곳 | Low | #fff, #fde68a, #92400e |
| common.module.css | ~5곳 | Low | success/warning |
| pairwise.module.css | ~2곳 | Low | 미세한 배경색 |
| results.module.css | ~2곳 | Low | error-bg |
| Button.module.css | ~2곳 | Low | #fff (의도적) |
| ModeSwitch.module.css | ~1곳 | Low | #fff |
| **합계** | **~142곳** | | |

### 2-2. 누락 CSS 변수

| 필요 변수 | 현재 상태 | 사용처 |
|-----------|----------|--------|
| --color-warning-bg | 미정의 | EvaluatorMainPage, EvalResult 등 |
| --color-warning-text (#92400e) | 미정의 | tip 박스, 경고 상태 |
| --color-warning-border (#fde68a) | 미정의 | 경고 박스 테두리 |
| --color-info-bg (#e8f4fd) | 미정의 | AiApiKeyModal |
| --color-info-text (#1a6fa8) | 미정의 | 정보 안내 텍스트 |
| --color-success-bg (#ecfdf5) | 미정의 | 완료 상태 배경 |

### 2-3. 다크모드 지원

| 분류 | 파일 수 | 상태 |
|------|---------|------|
| variables.css (마스터) | 1 | 완비 |
| 다크모드 override 있는 CSS | ~5개 | 부분 적용 |
| 다크모드 override 없는 CSS | **~70+개** | 미적용 |

### 2-4. Phase 2 개선 효과

| 파일 | 이전 | 이후 | 개선율 |
|------|------|------|--------|
| HomePage.module.css | ~18곳 | 0곳 | 100% |
| PublicNav.module.css | ~11곳 | 0곳 | 100% |
| AiAnalysisPage.module.css | fallback 불일치 | 수정됨 | 100% |
| variables.css | brand 토큰 없음 | 4개 추가 | 신규 |

**결론: 5.5/10** — 공개 페이지(Home, Nav) 토큰화 완료, 하지만 About, Canvas, Auth 등 ~142곳 하드코딩 잔존. 다크모드 ~70개 파일 미지원.

---

## 3. 코드 품질 — 8.5/10

### 3-1. React Hooks

| 항목 | 상태 | 점수 |
|------|------|------|
| useEffect deps 배열 | eslint-disable 제거, 정확함 | 9/10 |
| useCallback 활용 | 주요 핸들러 래핑 완료 | 9/10 |
| useMemo 활용 | 계산 비용 높은 곳 적용 | 8/10 |
| 커스텀 훅 구조 | 깔끔한 분리 (useCriteria, useAlternatives 등) | 9/10 |

### 3-2. 에러 처리

| 항목 | 상태 | 점수 |
|------|------|------|
| Supabase thenable 패턴 | .then(null, fn) 정확 사용 | 10/10 |
| { data, error } 구조분해 | 전체 일관 적용 | 9/10 |
| ErrorBoundary | 앱 전체 래핑 | 9/10 |
| form 에러 표시 | role="alert" 적용 | 8/10 |

### 3-3. 인라인 함수 & 성능

| 항목 | 상태 | 점수 |
|------|------|------|
| onClick 인라인 | 복잡한 로직 useCallback 추출됨 | 9/10 |
| PairwiseRow handleCellClick | useCallback + 올바른 deps | 10/10 |
| DirectInputPanel | Promise.all 병렬화 완료 | 9/10 |
| cloneProject 순차 삽입 | 의도적 (계층 종속성) | N/A |

### 3-4. 코드 중복 & 정리

| 항목 | 상태 | 점수 |
|------|------|------|
| getCriteriaGlobal 중복 | 통합 완료 (exportUtils 단일 소스) | 9/10 |
| 가이드 컴포넌트 중복 | GuideShell 통합 완료 (~450줄→~120줄 공유) | 10/10 |
| useAhpCalculation values 중복 | 2곳 동일 빌드 로직 잔존 | 7/10 |
| import 위생 | 미사용 import 없음, 순환 의존 없음 | 10/10 |
| console.log | 2곳 (ErrorBoundary, PortOne) — 정당 | 10/10 |

### 3-5. 남은 개선 과제

| 항목 | 우선순위 | 영향 |
|------|----------|------|
| PairwiseRatingPage 설문 확인 순차 쿼리 → Promise.all | Low | 미세 성능 |
| useAhpCalculation values 빌드 로직 중복 추출 | Low | 코드 명확성 |

**결론: 8.5/10** — Phase 3 개선으로 hooks deps, 병렬화, 중복 제거 우수. 미세 최적화만 잔존.

---

## 4. SEO & 메타데이터 — 6.0/10

### 4-1. index.html 메타 태그

| 항목 | 상태 | 점수 |
|------|------|------|
| title | "AHP Basic - 의사결정 분석 도구" | 10/10 |
| meta description | 한국어 설명 완비 | 10/10 |
| og:title, og:description, og:type | 완비 | 10/10 |
| og:image (1200x630) | 이미지 + 크기 명시 | 10/10 |
| twitter:card | summary_large_image | 10/10 |
| lang="ko" | 설정됨 | 10/10 |
| viewport | 반응형 설정 | 10/10 |
| theme-color | #0f2b5b | 10/10 |
| preconnect | Supabase + CDN | 9/10 |
| Cache-Control | no-cache, must-revalidate | 9/10 |

### 4-2. SEO 미비 항목

| 항목 | 상태 | 심각도 |
|------|------|--------|
| canonical 태그 | 미설정 | Medium |
| robots.txt | 미생성 | High |
| sitemap.xml | 미생성 | High |
| JSON-LD 구조화 데이터 | 미구현 | Medium |
| React Helmet (동적 meta) | 미사용 | Medium |
| 404 전용 페이지 | Navigate to "/" (리다이렉트만) | Low |

**결론: 6.0/10** — 정적 메타 태그 우수, 하지만 robots.txt, sitemap.xml, 구조화 데이터 미구현.

---

## 5. 성능 & 번들 최적화 — 8.5/10

### 5-1. 코드 스플리팅

| 항목 | 상태 | 점수 |
|------|------|------|
| React.lazy 페이지 | 27개 페이지 lazy 로딩 | 10/10 |
| Suspense fallback | LoadingSpinner 적용 | 10/10 |
| HomePage/LoginPage eager | 초기 로딩용 직접 import | 10/10 |
| CSS Modules per-page | 페이지별 독립 CSS | 10/10 |

### 5-2. 대형 라이브러리 관리

| 라이브러리 | 크기 | 로딩 방식 | 점수 |
|-----------|------|----------|------|
| xlsx | ~430KB | dynamic import (사용 시) | 10/10 |
| file-saver | ~30KB | dynamic import (사용 시) | 10/10 |
| recharts | ~250KB | **미사용이나 package.json에 잔존** | 3/10 |
| qrcode.react | ~15KB | static import (SurveyBuilder) | 7/10 |

### 5-3. Vite 빌드 설정

| 항목 | 상태 | 점수 |
|------|------|------|
| 기본 빌드 | 동작함 (1087 modules) | 8/10 |
| manualChunks | 미설정 | 5/10 |
| minify 명시 | 미설정 (기본값 esbuild) | 6/10 |
| sourcemap | 미설정 | 5/10 |
| target | 미설정 (기본값 사용) | 6/10 |

### 5-4. 로딩 상태 & 에러 처리

| 항목 | 상태 | 점수 |
|------|------|------|
| 전역 Suspense fallback | 적용됨 | 10/10 |
| 페이지별 로딩 스피너 | 주요 async 페이지 적용 | 9/10 |
| ErrorBoundary | 앱 전체 래핑 + UI | 10/10 |
| React.StrictMode | main.jsx에 적용 | 10/10 |

**결론: 8.5/10** — lazy loading, dynamic import 우수. recharts 미사용 잔존, Vite 빌드 최적화 설정 부족.

---

## 6. 보안 — 7.5/10

### 6-1. 인증 & 세션

| 항목 | 상태 | 점수 |
|------|------|------|
| PKCE 흐름 | Supabase Auth 적용 | 10/10 |
| autoRefreshToken | true 설정 | 10/10 |
| 로그아웃 정리 | API 키 + 세션 전체 정리 | 9/10 |
| onAuthStateChange + RPC 분리 | 별도 useEffect 분리됨 | 10/10 |

### 6-2. 라우트 보호

| 가드 | 대상 | 검증 방식 | 점수 |
|------|------|----------|------|
| ProtectedRoute | 로그인 필수 | 세션 확인 | 9/10 |
| AdminGuard | 관리자 페이지 | role 확인 | 9/10 |
| EvaluatorGuard | 평가 페이지 | DB 검증 + sessionStorage | 9/10 |
| SuperAdminGuard | 슈퍼관리자 | email 체크 | 8/10 |

### 6-3. XSS 방어

| 항목 | 상태 | 점수 |
|------|------|------|
| dangerouslySetInnerHTML | 0건 (전무) | 10/10 |
| innerHTML 직접 사용 | 0건 | 10/10 |
| React JSX 자동 이스케이프 | 전체 적용 | 10/10 |
| 사용자 입력 렌더링 | 안전 (텍스트 노드) | 10/10 |

### 6-4. 보안 미비 항목

| 항목 | 심각도 | 설명 |
|------|--------|------|
| CSP 헤더 미설정 | Medium | Content-Security-Policy 없음 |
| BOOTSTRAP_ADMIN_EMAILS 하드코딩 | Medium | DB 기반 역할 관리 권장 |
| .env 파일 이력 노출 가능 | Low | anon key는 공개용이나 best practice 위반 |
| RLS 정책 코드 레벨 검증 불가 | Medium | Supabase 대시보드에서 확인 필요 |
| localStorage에 AI API 키 저장 | Low | 로그아웃 시 삭제되나 XSS 리스크 |
| 이메일 validator 약함 | Low | `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` |

**결론: 7.5/10** — XSS 방어 완벽, 라우트 보호 우수. CSP 미설정, 관리자 이메일 하드코딩이 감점 요소.

---

## 7. 테스트 & 문서화 — 6.0/10

### 7-1. 테스트 커버리지

| 테스트 파일 | 테스트 수 | 대상 모듈 |
|-----------|----------|----------|
| ahpEngine.test.js | 13 | 행렬 빌드, 우선순위, CR |
| ahpAggregation.test.js | 7 | 기하평균, 그룹 집계 |
| ahpBestFit.test.js | 2 | 최적 피팅 |
| directInputEngine.test.js | 10 | 직접입력 검증 |
| pairwiseUtils.test.js | 12 | 쌍 생성, 값 변환 |
| evaluatorUtils.test.js | 12 | 평가자 유틸 |
| sensitivityAnalysis.test.js | 6 | 민감도 분석 |
| statsDistributions.test.js | 29 | 통계 분포 |
| statsEngine.test.js | 30 | 통계 엔진 |
| **합계** | **121** | **9 lib 모듈** |

### 7-2. 테스트 커버리지 갭

| 영역 | 테스트 | 상태 |
|------|--------|------|
| src/lib/ (핵심 엔진) | 9개 파일 테스트 | 우수 |
| src/components/ (42개+) | 0개 테스트 | 미비 |
| src/pages/ (30개) | 0개 테스트 | 미비 |
| src/contexts/ (4개) | 0개 테스트 | 미비 |
| src/hooks/ (8개+) | 0개 테스트 | 미비 |

**테스트 범위: ~15%** (lib만 커버, UI/통합 테스트 없음)

### 7-3. 문서화

| 항목 | 상태 | 점수 |
|------|------|------|
| README.md | 기본 정보 포함 | 6/10 |
| IMPLEMENTATION_NOTES.md | 개발일지 (상세) | 8/10 |
| JSDoc (lib 파일) | ahpEngine, exportUtils 등 주요 함수 | 7/10 |
| JSDoc (컴포넌트) | GuideShell만 적용, 대부분 미적용 | 3/10 |
| PropTypes | 미사용 (JS 프로젝트) | N/A |
| API 문서 | 없음 | 0/10 |

### 7-4. 개발 도구

| 항목 | 상태 | 점수 |
|------|------|------|
| ESLint | vite 기본 설정 | 6/10 |
| Prettier | 미설정 | 0/10 |
| Husky/lint-staged | 미설정 | 0/10 |
| CI/CD | GitHub Actions 배포 완비 | 9/10 |
| Vitest | 설정 완비 + CI 연동 | 9/10 |

**결론: 6.0/10** — 핵심 엔진(lib) 테스트 우수, 하지만 UI/통합 테스트 0건. Prettier, pre-commit hook 미설정.

---

## 8. UX & 컴포넌트 구조 — 8.0/10

### 8-1. 컴포넌트 아키텍처

| 항목 | 상태 | 점수 |
|------|------|------|
| 공통 컴포넌트 (Button, Modal, LoadingSpinner) | 잘 추출됨 | 9/10 |
| CSS Modules 아키텍처 | 전체 적용 (inline style 최소) | 9/10 |
| 가이드 통합 (GuideShell) | Phase 4에서 완료 | 10/10 |
| Context 분리 (Auth, Project, Evaluation, Toast) | 관심사 잘 분리 | 9/10 |
| 레이아웃 계층 (Public/Admin/Evaluator) | 명확한 역할 구분 | 9/10 |
| 라우팅 구조 | 중첩 라우트 + 가드 | 8/10 |

### 8-2. 페이지별 완성도

| 메뉴/페이지 | 기능 | UI | 점수 |
|------------|------|------|------|
| 홈페이지 | 완비 | 반응형 | 9/10 |
| About/Features/Guide | 완비 | 일관된 UI | 8/10 |
| 로그인/회원가입 | Email+Social | 에러 처리 | 9/10 |
| 관리자 대시보드 | CRUD 완비 | 카드 UI | 8/10 |
| 모델 빌더 | Canvas+DnD | 세로/가로/논문용 | 9/10 |
| 브레인스토밍 | DnD 키워드 | 3 존 구조 | 8/10 |
| 설문 빌더 | 4단계 탭 | 다양한 질문 유형 | 8/10 |
| 쌍대비교 평가 | 17셀 슬라이더 | 실시간 저장 | 9/10 |
| 직접입력 평가 | % 입력 + 검증 | 100% 합계 체크 | 8/10 |
| 결과 집계 | 자동 가중치 | 차트 시각화 | 8/10 |
| 민감도 분석 | What-if 슬라이더 | 실시간 그래프 | 8/10 |
| 자원 배분 | 예산 배분 + 제약 | 시나리오 저장 | 8/10 |
| 통계 분석 | 다양한 분석 도구 | 교차분석, 상관 | 8/10 |
| AI 분석도구 | 3종 AI 채팅 | SSE 스트리밍 | 7/10 |
| 사전설문 | Likert+객관식 | radio 접근성 | 8/10 |

**결론: 8.0/10** — 컴포넌트 구조 우수, 전 페이지 기능 완비. AI도구 UI 개선 여지.

---

## 메뉴/기능별 종합 점수

| 메뉴 | 기능 | 접근성 | CSS | 코드 | 보안 | 종합 |
|------|------|--------|-----|------|------|------|
| 공개 홈페이지 | 10 | 8 | 9 | 9 | 9 | **9.0** |
| About/Features | 9 | 7 | 4 | 8 | 9 | **7.4** |
| 이용가이드/설명서 | 9 | 7 | 7 | 9 | 9 | **8.2** |
| 로그인/회원가입 | 9 | 8 | 5 | 9 | 9 | **8.0** |
| 관리자 대시보드 | 9 | 7 | 7 | 8 | 8 | **7.8** |
| 모델 빌더 | 9 | 7 | 5 | 8 | 8 | **7.4** |
| 브레인스토밍 | 8 | 8 | 5 | 8 | 8 | **7.4** |
| 설문 빌더 | 9 | 6 | 6 | 8 | 8 | **7.4** |
| 평가자 관리 | 8 | 6 | 6 | 8 | 9 | **7.4** |
| 쌍대비교 평가 | 9 | 5 | 7 | 9 | 9 | **7.8** |
| 직접입력 평가 | 8 | 6 | 7 | 9 | 8 | **7.6** |
| 사전설문 | 8 | 8 | 5 | 8 | 8 | **7.4** |
| 결과 집계 | 9 | 6 | 5 | 8 | 8 | **7.2** |
| 민감도 분석 | 8 | 8 | 7 | 8 | 8 | **7.8** |
| 자원 배분 | 9 | 6 | 5 | 8 | 8 | **7.2** |
| 통계 분석 | 8 | 6 | 5 | 8 | 8 | **7.0** |
| AI 분석도구 | 7 | 5 | 5 | 7 | 7 | **6.2** |
| 슈퍼관리자 | 8 | 5 | 6 | 8 | 7 | **6.8** |

---

## 이전 버전 대비 개선도

| 항목 | v2 (이전) | v3 (현재) | 변화 |
|------|-----------|-----------|------|
| LoadingSpinner ARIA | 없음 | role, aria-live, aria-label | +3 |
| EvaluationProgress ARIA | 없음 | role="progressbar" 완비 | +3 |
| WeightSlider ARIA | 없음 | radiogroup + radio | +3 |
| Likert 접근성 | div onClick | label + radio | +4 |
| 브레인스토밍 키보드 | 없음 | Enter/F2/Delete | +3 |
| Canvas 키보드 | 없음 | tabIndex + onKeyDown | +2 |
| HomePage CSS 토큰 | 18곳 하드코딩 | 0곳 | +5 |
| PublicNav CSS 토큰 | 11곳 하드코딩 | 0곳 | +5 |
| useProjects deps | eslint-disable | 올바른 deps | +2 |
| DirectInputPanel | 순차 upsert | Promise.all | +2 |
| getCriteriaGlobal | 3곳 중복 | 1곳 통합 | +3 |
| 가이드 컴포넌트 | ~450줄 중복 | GuideShell 통합 | +4 |
| 변수 토큰 | brand 없음 | brand/error 추가 | +2 |
| SensitivityChart | inline style | CSS Module | +3 |
| AiChatLayout | 공유 CSS | 독립 CSS Module | +2 |

---

## 우선순위별 개선 로드맵

### 즉시 개선 (High Impact, Low Effort)

1. **robots.txt / sitemap.xml 생성** — SEO +2점
2. **recharts 패키지 제거** — 번들 ~250KB 절감
3. **누락 CSS 변수 추가** (warning, info, success-bg) — 토큰 기반 확보
4. **CSP 메타 태그 추가** — 보안 +1점

### 중기 개선 (High Impact, Medium Effort)

5. **AboutPage.module.css 토큰화** (~25곳) — CSS 점수 +1점
6. **AuthPage.module.css 토큰화** (~12곳)
7. **CanvasNode.module.css 토큰화** (~20곳)
8. **Modal focus trap 구현** — 접근성 +1점
9. **PairwiseCell 키보드 지원** — 핵심 기능 접근성
10. **Vite manualChunks 설정** — 번들 최적화

### 장기 개선 (Medium Impact, High Effort)

11. **다크모드 ~70개 파일 override** — CSS 일관성 대폭 개선
12. **컴포넌트 테스트 추가** (React Testing Library)
13. **React Helmet 도입** — 동적 SEO
14. **Prettier + husky 설정** — 코드 스타일 자동화
15. **JSON-LD 구조화 데이터** — SEO 구조화

---

## 결론

**종합 7.16/10** — 핵심 기능(AHP 엔진, 평가, 집계)은 매우 우수하고, Phase 1~4 개선으로 접근성과 코드 품질이 크게 향상됨. CSS 토큰 일관성(5.5)과 테스트 커버리지(6.0)가 가장 큰 개선 여지. 즉시 개선 4개 항목 적용 시 **7.5+** 예상.
