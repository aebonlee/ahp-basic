# 종합 개선 계획 — AHP Basic 점수 향상

**작성일**: 2026-03-07
**상태**: 진행 중

---

## Context
세부 점수 보고서(v2)에서 식별된 미비 항목을 체계적으로 개선한다.
기능을 깨뜨리지 않으면서 접근성, CSS 토큰화, 코드 품질을 올리는 것이 목표.

---

## Phase 1: 접근성 개선 (빠른 수정 — 기존 파일만 수정)

### 1-1. LoadingSpinner 접근성
- **파일**: `src/components/common/LoadingSpinner.jsx`, `LoadingSpinner.module.css`
- JSX: `role="status"`, `aria-live="polite"`, `aria-label={message || '로딩 중'}` 추가
- spinner div에 `aria-hidden="true"` 추가
- CSS: `@media (prefers-reduced-motion: reduce)` 추가

### 1-2. EvaluationProgress ARIA
- **파일**: `src/components/evaluation/EvaluationProgress.jsx`
- bar div에 `role="progressbar"`, `aria-valuenow`, `aria-valuemin={0}`, `aria-valuemax={100}`, `aria-label` 추가

### 1-3. WeightSlider ARIA
- **파일**: `src/components/sensitivity/WeightSlider.jsx`
- buttons div에 `role="radiogroup"`, `aria-labelledby` 추가
- 각 button에 `role="radio"`, `aria-checked={idx === selected}` 추가
- h3에 `id="weight-slider-label"` 추가

### 1-4. SensitivityChart CSS Module 생성
- **파일**: `src/components/sensitivity/SensitivityChart.jsx` (수정), `SensitivityChart.module.css` (신규)
- inline 스타일 → CSS Module 클래스로 이동
- chart 영역에 `role="img"`, `aria-label` 추가

### 1-5. EvalPreSurveyPage Likert → Radio
- **파일**: `src/pages/EvalPreSurveyPage.jsx`, `EvalPreSurveyPage.module.css`
- `<div onClick>` → `<label>` + `<input type="radio" className={styles.srOnly}>` 변환
- `likertGroup`에 `role="radiogroup"`, `aria-label` 추가
- CSS에 `.srOnly` 유틸 클래스 추가

### 1-6. Brainstorming ARIA 개선
- **파일**: `KeywordItem.jsx`, `KeywordZone.jsx`, `BrainstormingBoard.jsx`
- KeywordItem: `role="listitem"`, `tabIndex={0}`, 키보드 편집(Enter/F2), delete `aria-label`
- KeywordZone: `role="region"`, `aria-label`, items에 `role="list"`, input에 `<label>`
- BrainstormingBoard: trash에 `role="button"` + keyboard, feedback에 `aria-live`, import btn에 `aria-busy`
- CSS에 `.srOnly` 추가 (global `index.css`)

### 1-7. HierarchyCanvas ARIA 개선
- **파일**: `src/components/model/HierarchyCanvas.jsx`, `src/components/model/CanvasNode.jsx`
- Canvas wrapper: `role="application"`, `aria-label`
- SVG layer: `aria-hidden="true"`
- Context menu: `role="menu"`, 각 item에 `role="menuitem"`
- CanvasNode: `tabIndex={0}`, `onKeyDown` (Enter→rename, Delete→삭제)

---

## Phase 2: CSS 토큰 통일

### 2-1. variables.css에 누락 토큰 추가
- `--color-brand: #0046C8`, `--color-brand-dark: #002E8A`
- `--color-error: #dc2626`, `--color-error-bg: #fef2f2`
- 다크모드 대응 값도 추가

### 2-2. HomePage.module.css 토큰화
- `#0046C8` → `var(--color-brand)` (9곳)
- `#002E8A` → `var(--color-brand-dark)` (2곳)
- 기타 하드코딩 색상 → CSS 변수 치환
- 다크모드 override 블록 추가

### 2-3. PublicNav.module.css 토큰화
- `#0046C8` → `var(--color-brand)` (11곳)
- `#002E8A` → `var(--color-brand-dark)` (3곳)
- 다크모드 override 블록 추가

### 2-4. AiAnalysisPage.module.css 폴백 수정
- `#4f46e5` → `#0f2b5b` (폴백 값 정정)
- `--color-bg-secondary` → `var(--color-bg-alt)` 통일

### 2-5. AiChatLayout CSS 분리
- 자체 CSS Module 생성 → AiAnalysisPage.module.css 의존성 제거

---

## Phase 3: 코드 품질 개선

### 3-1. useProjects.js deps 수정
- eslint-disable 제거, deps 배열 정리

### 3-2. EvaluatorMainPage 리팩토링
- inline async onClick → `handleStartEval` useCallback 추출
- `loadAssignedProjects` → useCallback 래핑 + deps 정리

### 3-3. DirectInputPanel DB 호출 분리
- 순차 upsert 루프 → `Promise.all` 병렬화
- useEffect deps 수정, `loadValues`를 useCallback으로 래핑

### 3-4. getCriteriaGlobal 중복 제거
- `exportUtils.js`의 `getCriteriaGlobal`을 named export로 변경
- `useAhpContext.js`의 `getGlobalPriority` → import로 대체
- `ResourceAllocationPage.jsx` 버전은 유지하되 이름 변경

---

## Phase 4: 가이드 컴포넌트 통합

### 4-1. GuideShell 공통 컴포넌트 생성
- **파일**: `src/components/admin/GuideShell.jsx` (신규), `GuideShell.module.css` (신규)
- 3개 가이드의 공통 렌더링 로직 추출

### 4-2. 기존 가이드 파일 축소
- 각 파일: SECTIONS 데이터 + `<GuideShell sections={SECTIONS}>` 호출만 남김
- ~450줄 중복 → ~120줄 공유 + ~30줄×3 데이터

---

## 신규 생성 파일

| 파일 | 용도 |
|------|------|
| `src/components/sensitivity/SensitivityChart.module.css` | SensitivityChart 스타일 |
| `src/components/ai/tools/AiChatLayout.module.css` | AI 채팅 레이아웃 스타일 |
| `src/components/admin/GuideShell.jsx` | 가이드 공통 컴포넌트 |
| `src/components/admin/GuideShell.module.css` | 가이드 공통 스타일 |

## 수정 파일 (25개)

- Phase 1: LoadingSpinner.jsx/css, EvaluationProgress.jsx, WeightSlider.jsx, SensitivityChart.jsx, EvalPreSurveyPage.jsx/css, KeywordItem.jsx, KeywordZone.jsx, BrainstormingBoard.jsx, HierarchyCanvas.jsx, CanvasNode.jsx, index.css
- Phase 2: variables.css, HomePage.module.css, PublicNav.module.css, AiAnalysisPage.module.css, AiChatLayout.jsx
- Phase 3: useProjects.js, EvaluatorMainPage.jsx, DirectInputPanel.jsx, exportUtils.js, useAhpContext.js, ResourceAllocationPage.jsx
- Phase 4: ResearcherGuide.jsx, EvaluatorGuideSidebar.jsx, PlatformGuide.jsx

---

## 검증 계획

각 Phase 완료 후:
1. `npm run build` — 빌드 성공 확인
2. 주요 페이지 기능 확인
