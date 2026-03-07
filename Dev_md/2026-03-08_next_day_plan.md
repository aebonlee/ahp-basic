# 내일 작업 계획 — 2026-03-08 (Round 3: 8.0+ 목표)

## 현재 상태
- **v4 종합 점수**: 7.80 / 10
- **빌드**: 1089 modules / 10.57s, 121/121 테스트 통과
- **배포**: GitHub Actions 자동 배포 (main push)

---

## 목표
v4 → v5: **7.80 → 8.3+** (중기 개선 항목 완료)

---

## Phase 1: 접근성 강화 — Modal focus trap + PairwiseCell 키보드 (예상 +0.6)

### 1-1. Modal focus trap 구현
- **대상**: 모든 모달 컴포넌트 (AiApiKeyModal, confirm 다이얼로그 등)
- **구현**:
  - 모달 열림 시 첫 포커스 가능 요소로 자동 포커스
  - Tab/Shift+Tab으로 모달 내부만 순환
  - Escape 키로 모달 닫기
  - 모달 닫힘 시 트리거 요소로 포커스 복귀
- **영향**: 접근성 +0.3

### 1-2. PairwiseCell 키보드 지원
- **대상**: `src/components/evaluation/PairwiseCell.jsx` (또는 관련 컴포넌트)
- **구현**:
  - 각 셀에 `tabIndex={0}`, `role="button"` 추가
  - Enter/Space 키로 선택 가능
  - 화살표 키로 셀 간 이동
- **영향**: 접근성 +0.3 (핵심 기능 접근성)

---

## Phase 2: CSS 구조색 토큰화 (~200곳) (예상 +0.5)

### 2-1. 공개 페이지 구조색
- **대상**: AboutPage, FeaturesPage, ManagementPage, GuidePage, ManualPage, SurveyStatsPage
- **치환 대상**:
  - `#f8fafc` → `var(--color-bg-alt)` 또는 신규 변수
  - `#e2e8f0` → `var(--color-border)` 또는 신규 변수
  - `#0f172a` → `var(--color-dark)` 또는 기존 변수
  - `#64748b` → `var(--color-text-muted)` 또는 신규 변수
  - `#1e293b`, `#334155` → 텍스트 변수
- **주의**: 장식색(nth-child별 다색), 소셜 브랜드색, 흰색/검정은 제외

### 2-2. 관리자/평가자 페이지 구조색
- **대상**: CanvasNode (~20곳), AuthPage (~12곳)
- **치환**: 위와 동일한 패턴

### 2-3. variables.css 변수 보완
- 필요 시 신규 CSS 변수 추가 (--color-text-secondary, --color-bg-subtle 등)

---

## Phase 3: SEO 구조화 데이터 (예상 +0.3)

### 3-1. JSON-LD 구조화 데이터
- **대상**: `index.html` 또는 공개 페이지
- **구현**: WebApplication, Organization 스키마
- **영향**: SEO +0.3

### 3-2. React Helmet 도입 (선택적)
- **대상**: 공개 페이지 (About, Features, Guide 등)
- **구현**: 페이지별 동적 title/description/og 태그
- **영향**: SEO +0.2
- **판단**: 작업량 대비 효과 검토 후 결정

---

## Phase 4: 테스트 커버리지 확대 (선택적, 예상 +1.0)

### 4-1. 핵심 컴포넌트 테스트
- **대상**: Button, LoadingSpinner, ErrorBoundary, ConsistencyTable
- **도구**: React Testing Library (이미 설치됨)
- **영향**: 테스트 & 문서화 +0.5

### 4-2. 페이지 스모크 테스트
- **대상**: LoginPage, SignupPage, HomePage 렌더링 테스트
- **영향**: 테스트 & 문서화 +0.5

---

## 예상 점수 변화

| 대분류 | v4 | v5 (예상) | 변화 |
|--------|-----|-----------|------|
| 접근성 | 7.0 | 8.0 | +1.0 |
| CSS 토큰 | 7.0 | 8.0 | +1.0 |
| 코드 품질 | 8.5 | 8.5 | — |
| SEO | 8.0 | 8.5 | +0.5 |
| 성능 | 9.0 | 9.0 | — |
| 보안 | 8.0 | 8.0 | — |
| 테스트 | 6.0 | 7.0~8.0 | +1.0~2.0 |
| UX | 8.0 | 8.0 | — |
| **종합** | **7.80** | **8.15~8.35** | **+0.35~0.55** |

---

## 작업 순서 권장

1. Phase 1 (접근성) — 사용자 경험 직접 영향, 기능 변경 없음
2. Phase 2 (CSS 토큰) — 대량 치환이나 로직 변경 없음, 안전
3. Phase 3 (SEO) — index.html 수정, 영향 범위 작음
4. Phase 4 (테스트) — 시간 여유 시 진행

---

## 검증 체크리스트

- [ ] `npm run build` — 빌드 성공
- [ ] `npm run test -- --run` — 전원 통과
- [ ] Modal Tab 순환 확인
- [ ] PairwiseCell 키보드 선택 확인
- [ ] CSS 색상 변화 없음 시각 확인
- [ ] Lighthouse 접근성 점수 확인
