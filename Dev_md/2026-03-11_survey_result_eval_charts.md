# 설문집계 페이지 — 개인별 AHP 평가 결과 차트 추가

## 날짜
2026-03-11

## 개요
설문집계(survey-result) 페이지의 세부내역 패널에 **개인별 AHP 평가 결과**(우선순위 바 차트 + CR 일관성 비율)를 추가.
기존에는 설문 응답 내역과 진행률만 표시했으나, 이제 실제 평가 계산 결과를 관리자가 바로 확인 가능.

## 변경 전 상태
- 세부내역 패널: 설문 응답 테이블 + 평가 진행 ProgressBar만 표시
- 개별 평가자의 AHP 계산 결과(우선순위, CR)를 보려면 집계결과 페이지로 이동 필요

## 수정 내용

### 1. 비교 데이터 확장 로드 (`SurveyResultPage.jsx`)
- `pairwise_comparisons` 테이블에서 `value` 컬럼 추가 로드
- `direct_input_values` 테이블에서 `value` 컬럼 추가 로드
- 두 테이블 동시 `Promise.all` 로드
- 별도 상태: `rawCompData` (쌍대비교), `rawDirectData` (직접입력)

### 2. 평가자별 비교 데이터 맵 (`compByEvaluator`, `directByEvaluator`)
- `useMemo`로 평가자 ID 기준 비교 데이터 맵 구성
- pairwise: `compByEvaluator[evaluatorId] = [{criterion_id, row_id, col_id, value}, ...]`
- direct: `directByEvaluator[evaluatorId] = [{criterion_id, item_id, value}, ...]`

### 3. EvalDetail 컴포넌트 — AHP 결과 계산
- `aggregateComparisons(itemIds, [{values, weight: 1}])` → `{matrix, priorities, cr}`
- `aggregateDirectInputs(itemIds, [{values, weight: 1}])` → `{priorities, cr: 0}`
- `pageSequence` 기반으로 각 비교 페이지별 결과 계산
- `computeAltScores()` — 최종 대안 종합 점수 산출 (기준별 가중치 × 대안 우선순위)

### 4. 결과 시각화
- **종합 대안 점수**: Recharts `BarChart` (수평 바 차트)
  - 각 대안별 가중 점수 퍼센트 표시
  - 최대값 대안 강조 색상 (primary vs primary-light)
- **기준별 상세**: 각 비교 페이지별 카드
  - 기준 이름 + CR 값 (통과: 초록, 미통과: 빨간 배경)
  - 항목별 우선순위 바 (0~100% 기준 너비)

### 5. CSS 스타일 추가 (`SurveyResultPage.module.css`)
- `.miniChart` — 바 차트 컨테이너
- `.crList` / `.crItem` / `.crHeader` — 기준별 결과 카드
- `.crName` / `.crPass` / `.crFail` — CR 통과/미통과 표시
- `.priBars` / `.priRow` / `.priName` / `.priBarWrap` / `.priBar` / `.priVal` — 우선순위 바

## 수정 파일
| 파일 | 변경 |
|------|------|
| `src/pages/SurveyResultPage.jsx` | 비교 데이터 확장 로드, 평가자별 맵, AHP 결과 계산/시각화 |
| `src/pages/SurveyResultPage.module.css` | 차트/CR/우선순위바 스타일 추가 |

## 기술 상세
- **데이터 흐름**: Supabase → rawCompData/rawDirectData → compByEvaluator/directByEvaluator → individualResults
- **AHP 엔진**: `aggregateComparisons` (ahpAggregation.js), `aggregateDirectInputs` (directInputEngine.js)
- **차트**: Recharts BarChart (ResponsiveContainer)
- **CR 임계값**: `CR_THRESHOLD = 0.1` (constants.js)
- **성능**: `useMemo`로 모든 계산 결과 캐싱, 선택 평가자 변경 시만 재계산
