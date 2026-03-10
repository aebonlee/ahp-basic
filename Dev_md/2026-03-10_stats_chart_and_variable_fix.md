# 통계분석 차트 렌더링 수정 + 변수 선택 UX 개선

## 날짜
2026-03-10

## 개요
통계 분석에서 차트(그래프)가 그려지지 않는 문제를 수정하고,
변수가 부족한 경우 명확한 안내 메시지를 표시하도록 개선했다.

## 수정 내용

### 1. 차트 렌더링 수정 — ResponsiveContainer width 버그

**문제:**
- 모든 통계분석 결과에서 차트(히스토그램, 막대 그래프, 산점도)가 표시되지 않음
- recharts의 ResponsiveContainer가 `width="100%"` 사용 시 부모 컨테이너 크기를 감지하지 못하는 알려진 버그

**수정:**
- `ResultRenderers.jsx`: 모든 `<ResponsiveContainer width="100%">` → `width="99%"` 변경
- `ResultRenderers.module.css`: `.chartContainer`에 `min-width: 0; overflow: hidden;` 추가

**영향 범위:**
- 기술통계 히스토그램
- T검정/ANOVA 그룹별 평균 막대 그래프
- 상관분석/Spearman 산점도
- 회귀분석 회귀선 + 잔차도
- 크론바흐 알파 항목 삭제 차트
- 카이제곱/교차분석 누적 막대 그래프

### 2. 변수 부족 시 안내 패널 추가

**문제:**
- 상관분석, Spearman, 크론바흐 알파: 수치 변수 2개 이상 필요하지만 1개뿐일 때 분석 실행 불가능하지만 이유가 불명확
- 대응표본 T검정, 회귀분석: 2개의 서로 다른 수치 변수가 필요하지만 1개뿐일 때 안내 없음

**수정 — `VariableSelector.jsx`:**

**`InsufficientVarsNotice` 컴포넌트 추가:**
- 변수 부족 시 전체 화면 안내 패널 표시
- 필요한 변수 수 vs 현재 변수 수 비교
- 해결 방법 제시 (설문에 질문 추가)
- 대체 분석 제안 (현재 변수로 가능한 분석)

**`ANALYSIS_CONFIG` 확장:**
- 각 분석별 `minNumeric`, `minCategorical` 최소 변수 수 추가
- `noDuplicate` 설정 추가 (같은 변수 중복 선택 방지)

### 3. 중복 변수 선택 방지

**문제:**
- 대응표본 T검정에서 변수 1과 변수 2에 같은 변수를 선택할 수 있음
- 회귀분석에서 X와 Y에 같은 변수 선택 가능
- 카이제곱/교차분석에서도 같은 범주 변수 중복 선택 가능

**수정:**
- `noDuplicate` 설정: `['var1', 'var2']` — 같은 그룹 내 중복 방지
- `getFilteredOptions()`: 다른 필드에서 선택된 변수를 드롭다운에서 제외
- `hasDuplicate()`: 중복 선택 시 실행 버튼 비활성화 + 경고 메시지

### 4. 스타일 추가 — `VariableSelector.module.css`

- `.insufficientWrap` — 변수 부족 안내 패널 (노란 테두리)
- `.insufficientTitle` — 안내 제목 (경고색)
- `.insufficientMsg` — 오류 메시지 (빨간색)
- `.insufficientSuggestions` — 해결 방법 박스 (파란색)
- `.insufficientAlternatives` — 대체 분석 박스 (초록색)
- `.insufficientInfo` — 현재 변수 현황

## 수정 파일
- `src/components/statistics/ResultRenderers.jsx` — chart width 99% 수정
- `src/components/statistics/ResultRenderers.module.css` — chartContainer min-width
- `src/components/statistics/VariableSelector.jsx` — 변수 부족 안내 + 중복 방지
- `src/components/statistics/VariableSelector.module.css` — 안내 패널 스타일

## 영향 범위
- 통계 분석 10개 모든 차트가 정상 렌더링
- 변수 부족 시 명확한 안내 (분석 실행 전 사전 체크)
- 중복 변수 선택 불가 (대응표본, 회귀, 카이제곱, 교차분석)
