# 통계 분석 리커트 데이터 수정 + 변수 미리보기 추가

## 날짜
2026-03-10

## 개요
통계 분석에서 리커트 변수의 데이터가 전혀 인식되지 않는 치명적 버그를 수정하고,
변수 선택 시 데이터 미리보기와 진단 기능을 추가했다.

## 원인

### 증상
- 모든 통계 분석에서 "데이터가 없습니다" 오류 발생
- 리커트 변수는 (84명) 응답이 있지만 분석 실행 시 0개로 인식
- 독립표본 T검정: "비교할 집단이 부족합니다"
- 대응표본 T검정: "최소 2개 대응쌍이 필요합니다"
- 단순선형회귀: "최소 3개 데이터가 필요합니다"
- 상관분석/크론바흐 알파: 변수 1개만 있으면 버튼이 안 눌림

### 근본 원인
**리커트 답변이 텍스트 문자열로 저장됨**

EvalPreSurveyPage에서 리커트 라디오 버튼 클릭 시:
```javascript
onChange={() => onChange(opt)}  // opt = "매우 그렇다" (텍스트)
```
→ DB에 `{ value: "매우 그렇다" }` 형태로 저장

useStatisticalAnalysis에서 수치 추출 시:
```javascript
const v = r.answer?.value;  // "매우 그렇다"
return Number(v);            // NaN!
```
→ `Number("매우 그렇다")` = NaN → 모든 데이터 필터링 → 빈 배열

## 수정 내용

### 1. `src/hooks/useStatisticalAnalysis.js` — 리커트 텍스트→숫자 변환

**`toNumeric(answerValue, questionId)` 함수 추가:**
- `questionMap`으로 질문 객체 조회 (옵션 배열 포함)
- 리커트 질문: 옵션 텍스트를 1-based 인덱스로 변환
  - 예: options = ["매우 아니다", "아니다", "보통", "그렇다", "매우 그렇다"]
  - "매우 아니다" → 1, "보통" → 3, "매우 그렇다" → 5
- number 질문: 기존대로 `Number(v)` 파싱
- 이미 숫자인 경우: 그대로 반환

**적용 범위 — 모든 수치 추출 함수:**
- `getNumericValues()` — 기술통계, 상관분석
- `getGroupedNumericValues()` — 독립표본 T검정, ANOVA
- `getItemMatrix()` — 크론바흐 알파
- `getPairedValues()` — 대응표본 T검정, 회귀분석
- `variableSummaries` — 미리보기 요약

### 2. `src/components/statistics/VariableSelector.jsx` — 데이터 미리보기

**변수별 요약 배지 (`VarSummaryBadge`):**
- 수치형: `1~5 (5점 척도) | 평균 3.2 | 84명`
- 범주형: `3개 범주: 남(42), 여(38), 기타(4)`
- 응답 없음: 빨간 경고 배지

**선택 후 상세 미리보기 (`SelectedVarPreview`):**
- 범주형: 범주별 태그 (카운트 표시)
- 수치형: 최솟값, 최댓값, 평균, 유효 응답 수
- 리커트: 척도 매핑 표시 (1=매우 아니다, 2=아니다, ...)

**데이터 진단 패널 (`DataDiagnostic`):**
- 선택된 변수 조합에 대해 실시간 진단
- 그룹 변수 범주 수 확인 (T검정: 2개 필요, ANOVA: 3개 이상)
- 응답 없는 변수 경고
- 응답 부족 경고 (3개 미만 등)
- 정상: 유효 응답 수, 범위 표시

**데이터 없을 때 버튼 비활성화:**
- `hasDataIssue()` 체크: 선택된 변수에 응답 0개면 true
- 버튼 `disabled` 상태 + "유효한 데이터가 없습니다" 메시지

### 3. `src/components/statistics/VariableSelector.module.css` — 스타일

- `.badgeInfo`, `.badgeWarn` — 변수 요약 배지
- `.preview`, `.previewWarn` — 선택 후 미리보기 박스
- `.catTag` — 범주 태그 (pill 형태)
- `.likertMap`, `.likertMapItem` — 리커트 척도 매핑
- `.diagnostic`, `.diagOk`, `.diagWarn` — 진단 패널
- `.hintWarn` — 데이터 없음 경고
- `.checkItemDisabled` — 응답 없는 변수 반투명

## 수정 파일
- `src/hooks/useStatisticalAnalysis.js` — 리커트 변환 로직 + 변수 요약
- `src/components/statistics/VariableSelector.jsx` — 미리보기 + 진단
- `src/components/statistics/VariableSelector.module.css` — 스타일
- `src/pages/StatisticalAnalysisPage.jsx` — variableSummaries 전달

## 영향 범위
- 통계 분석 페이지 전체 — 10개 분석 모두 영향
- 리커트 질문이 있는 모든 프로젝트에서 통계 분석 정상 동작
- 기존에 "데이터가 없습니다" 오류가 발생하던 모든 케이스 해결
