# 코드베이스 분석 및 미완성 기능 개발 완료

> 작업일: 2026-02-23
> 상태: 완료

---

## 1. 프로젝트 현황 분석

### 기술 스택
| 항목 | 기술 |
|------|------|
| Frontend | React 18 + Vite 5 |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| 차트 | Recharts |
| 테스트 | Vitest + jsdom |
| 배포 | GitHub Pages (Actions) |

### 분석 시점 완성된 기능
| 기능 | 핵심 파일 |
|------|-----------|
| AHP 엔진 (고유벡터법) | `src/lib/ahpEngine.js` |
| 쌍대비교 평가 UI | `PairwiseRatingPage.jsx` |
| 관리자 대시보드 | `AdminDashboard.jsx` |
| 프로젝트/기준/대안 CRUD | Context + Hooks |
| 평가자 관리/초대 | `EvaluatorManagementPage.jsx` |
| 가중 기하평균 집계 | `ahpAggregation.js` |
| 종합 결과 차트 | `ComprehensiveChart.jsx` |
| 민감도 분석 엔진 | `sensitivityAnalysis.js` |
| 풍선도움말 시스템 | `HelpButton.jsx` + `helpData.js` |
| RLS 순환참조 수정 | `001_user_profiles.sql` |

### 발견된 미완성 기능 (버그/누락)
| 우선순위 | 기능 | 문제 |
|----------|------|------|
| CRITICAL | 직접입력 평가 | DB 테이블 미존재, 계산엔진 미구현 |
| HIGH | AdminResultPage 검증 | `allConsistent: true, allComplete: true` 하드코딩 |
| HIGH | WorkshopPage 진행률 | `max={100}` 하드코딩, 총 비교 수 미계산 |
| HIGH | ResourceAllocationPage | 기준 가중치 무시, 단순 합산 버그 |
| MEDIUM | SensitivityPage | 에러 핸들링 없음, 빈 데이터 크래시 가능 |
| MEDIUM | 도움말 누락 | 민감도/자원배분/워크숍 페이지 HelpButton 없음 |
| LOW | 테스트 | 엔진 테스트만 존재, 집계/직접입력 테스트 없음 |
| LOW | CI/CD | 배포 시 테스트 미실행 |

---

## 2. 구현 결과

### Phase 0: 분석 문서 + 기존 작업 커밋
- `bad2178` — `feat: 풍선도움말 시스템 구현 및 RLS 순환참조 수정`
  - 신규: `HelpButton.jsx`, `HelpButton.module.css`, `helpData.js`
  - 수정: `ParticipantPanel.jsx`, `ProjectForm.jsx`, `ProjectPanel.jsx`, `ConsistencyDisplay.jsx`, `PairwiseRatingPage.jsx`, `001_user_profiles.sql`
- `772d338` — `docs: 코드베이스 분석 및 미완성 기능 개발 계획`

### Phase 1: 직접입력(Direct Input) 평가 완성
- `5aa852a` — `feat: 직접입력 평가 기능 완성 (DB + 엔진 + UI)`
- **신규 파일**:
  - `supabase/migrations/002_direct_input_values.sql` — 이미 배포된 DB용 단독 마이그레이션
  - `src/lib/directInputEngine.js` — `calculateDirectPriorities()`, `aggregateDirectInputs()` 구현
- **수정 파일**:
  - `001_user_profiles.sql` — `direct_input_values` 테이블 + RLS 정책 추가
  - `DirectInputPanel.jsx` — `onValidationChange` 콜백, 완료 여부 표시, 미입력 하이라이트
  - `DirectInputPage.jsx` — 실시간 우선순위 미리보기 바, 전체 완료 검증 후 결과 이동
  - `EvaluationContext.jsx` — `directInputValues` 상태, `saveDirectInput()` 함수, `direct_input_values` 테이블 병렬 쿼리
  - `AdminResultPage.jsx` — `eval_method === DIRECT_INPUT` 분기, `aggregateDirectInputs` 사용, 하드코딩 제거 (Phase 2 포함)

### Phase 2: AdminResultPage 검증 로직
- Phase 1 커밋에 통합 구현
- `allConsistent: true, allComplete: true` 하드코딩 → 실제 `expectedPairs vs completedPairs`, `CR > CR_THRESHOLD` 검증
- 완료/일관성 상태 배너 UI 추가

### Phase 3: WorkshopPage 진행률 계산
- `c31d049` — `fix: WorkshopPage 진행률 계산 정확도 개선`
- `useCriteria`, `useAlternatives` import 추가
- `buildPageSequence` + `pairCount`로 `totalRequired` 계산
- `ProgressBar max={100}` → `max={totalRequired}`, 텍스트 `{count} / {totalRequired}` 형식

### Phase 4: ResourceAllocationPage 공식 수정
- `caf0d86` — `fix: ResourceAllocationPage 계층 가중치 반영 공식 수정`
- **기존 버그**: 리프 기준별 대안 우선순위를 단순 합산 (기준 가중치 무시)
- **수정**: `getCriteriaGlobal()` 함수 추가, `globalScore(alt) = Σ(criteriaGlobal(leaf) × altPriority(alt, leaf))`
- 계층적 기준 트리를 따라 올라가며 각 레벨의 로컬 우선순위를 곱해 전역 가중치 산출

### Phase 5: SensitivityPage 안전성 강화
- `e506c3d` — `fix: SensitivityPage 에러 핸들링 및 안전성 강화`
- `analysisData` useMemo에 try-catch 래핑
- `rootResult.priorities` 전부 0인 경우 null 반환
- `selectedCriterion` 범위 초과 방지 (`Math.min`)
- 빈 데이터 메시지 → 필요 조건 안내 (기준 2개 이상, 대안 1개 이상, 비교 완료)

### Phase 6: 누락된 Help 키 추가
- `bf712d4` — `feat: 민감도/자원배분/워크숍 페이지 도움말 추가`
- `helpData.js`에 3개 키 추가: `sensitivityAnalysis`, `resourceAllocation`, `workshopProgress`
- `SensitivityPage.jsx`, `ResourceAllocationPage.jsx`, `WorkshopPage.jsx` 각 `<h1>` 옆에 `<HelpButton>` 배치

### Phase 7: 테스트 보강
- `5a323de` — `test: 집계/직접입력/민감도 엔진 테스트 추가`
- **신규 파일**:
  - `src/lib/__tests__/directInputEngine.test.js` — 10개 테스트 (정규화, 집계, 가중치, 엣지케이스)
  - `src/lib/__tests__/ahpAggregation.test.js` — 7개 테스트 (기하평균, 글로벌 우선순위)
  - `src/lib/__tests__/sensitivityAnalysis.test.js` — 6개 테스트 (데이터포인트 수, 경계값, 합계)
- **전체 결과**: 5개 파일, 38개 테스트 모두 통과

### Phase 8: CI/CD 테스트 단계 추가
- `914b596` — `ci: 배포 파이프라인에 테스트 단계 추가`
- `.github/workflows/deploy.yml`에 `npm run test` 단계 삽입 (`npm ci` 후, `npm run build` 전)

---

## 3. 커밋 이력 (총 9개)

| 커밋 해시 | 메시지 |
|-----------|--------|
| `bad2178` | `feat: 풍선도움말 시스템 구현 및 RLS 순환참조 수정` |
| `772d338` | `docs: 코드베이스 분석 및 미완성 기능 개발 계획` |
| `5aa852a` | `feat: 직접입력 평가 기능 완성 (DB + 엔진 + UI)` |
| `c31d049` | `fix: WorkshopPage 진행률 계산 정확도 개선` |
| `caf0d86` | `fix: ResourceAllocationPage 계층 가중치 반영 공식 수정` |
| `e506c3d` | `fix: SensitivityPage 에러 핸들링 및 안전성 강화` |
| `bf712d4` | `feat: 민감도/자원배분/워크숍 페이지 도움말 추가` |
| `5a323de` | `test: 집계/직접입력/민감도 엔진 테스트 추가` |
| `914b596` | `ci: 배포 파이프라인에 테스트 단계 추가` |

---

## 4. 검증 결과

| 항목 | 결과 |
|------|------|
| `npm run test` | 38 tests passed (5 files) |
| `npm run build` | 빌드 성공 (dist 생성) |
| `git push` | `origin/main`에 push 완료 |
| GitHub Actions | 자동 배포 트리거 됨 |

---

## 5. 수정된 파일 전체 목록

| 파일 | Phase | 작업 |
|------|-------|------|
| `supabase/migrations/001_user_profiles.sql` | 1 | direct_input_values 테이블 + RLS |
| `supabase/migrations/002_direct_input_values.sql` | 1 | 신규 (단독 마이그레이션) |
| `src/lib/directInputEngine.js` | 1 | 신규 (계산 엔진) |
| `src/components/evaluation/DirectInputPanel.jsx` | 1 | 검증 강화 |
| `src/pages/DirectInputPage.jsx` | 1 | 실시간 시각화 + 검증 |
| `src/contexts/EvaluationContext.jsx` | 1 | 직접입력 상태 관리 |
| `src/pages/AdminResultPage.jsx` | 1, 2 | 직접입력 통합 + 검증 로직 |
| `src/pages/WorkshopPage.jsx` | 3, 6 | 진행률 계산 + 도움말 |
| `src/pages/ResourceAllocationPage.jsx` | 4, 6 | 계층 가중치 + 도움말 |
| `src/pages/SensitivityPage.jsx` | 5, 6 | 안전성 + 도움말 |
| `src/lib/helpData.js` | 6 | 3개 키 추가 |
| `src/lib/__tests__/directInputEngine.test.js` | 7 | 신규 (10 tests) |
| `src/lib/__tests__/ahpAggregation.test.js` | 7 | 신규 (7 tests) |
| `src/lib/__tests__/sensitivityAnalysis.test.js` | 7 | 신규 (6 tests) |
| `.github/workflows/deploy.yml` | 8 | 테스트 단계 추가 |
