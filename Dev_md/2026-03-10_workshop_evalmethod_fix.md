# 워크숍 페이지 평가방법별 진행률 수정

## 날짜
2026-03-10

## 개요
워크숍 페이지에서 직접입력 방식 프로젝트의 평가자 진행률이 항상 0/N으로 표시되는 버그를 수정했다.

## 원인

### 증상
- 직접입력 방식 프로젝트에서 모든 평가자가 `0/40 (완료)` 형태로 표시
- 프로그레스바가 비어있는데 "완료" 표시 → 사용자 혼란

### 근본 원인
`WorkshopPage.jsx`가 프로젝트의 `eval_method`를 확인하지 않고 **항상 `pairwise_comparisons` 테이블만 조회**했다.

- 직접입력 프로젝트는 `direct_input_values` 테이블에 데이터 저장
- `pairwise_comparisons`에는 데이터가 없으므로 항상 0/N 표시
- "완료" 표시는 `evaluators.completed` 플래그(서명 기반) → 이 부분은 정상

### 비교: 올바르게 처리하는 페이지
`EvaluatorManagementPage.jsx`는 `eval_method`에 따라 테이블을 분기 조회 (49~52행)

## 수정 내용

### `src/pages/WorkshopPage.jsx`

1. **`EVAL_METHOD` 상수 import 추가**
2. **`isDirectInput` 플래그 추가**: `currentProject?.eval_method === EVAL_METHOD.DIRECT_INPUT`
3. **`loadData` — 테이블 분기 조회**:
   - 직접입력: `direct_input_values` 테이블에서 `evaluator_id, criterion_id, item_id` 조회
   - 쌍대비교: `pairwise_comparisons` 테이블에서 `evaluator_id, criterion_id, row_id, col_id` 조회
4. **Realtime 채널 — 올바른 테이블 구독**:
   - 직접입력: `direct_input_values` 테이블 변경 감지
   - 쌍대비교: `pairwise_comparisons` 테이블 변경 감지
5. **`totalRequired` 계산 분기**:
   - 직접입력: 각 페이지의 `items.length` 합계 (항목 수)
   - 쌍대비교: 각 페이지의 `pairs.length` 합계 (쌍 수, n*(n-1)/2)
6. **`progress` 카운트 키 분기**:
   - 직접입력: `criterion_id:item_id`
   - 쌍대비교: `criterion_id:row_id:col_id`

### `src/pages/EvaluatorManagementPage.jsx`

1. **`isDirectInput` 플래그 추가**
2. **`totalRequired` 계산 분기**:
   - 기존: 항상 `p.pairs.length` (쌍대비교 쌍 수)로 계산
   - 수정: 직접입력은 `p.items.length` (항목 수), 쌍대비교는 `p.pairs.length` (쌍 수)
   - DB 조회 테이블은 이미 올바르게 분기되어 있었으나, 분모(totalRequired)가 잘못됨

## 영향 범위
- 워크숍 페이지(`/project/:id/workshop`)의 평가자 진행률 표시
- 평가자 관리 페이지(`/project/:id/eval`)의 진행률 퍼센트 표시
- 직접입력 방식 프로젝트에서만 영향 (쌍대비교 프로젝트는 기존과 동일)
