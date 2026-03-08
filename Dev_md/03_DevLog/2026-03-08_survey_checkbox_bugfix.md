# 설문 체크박스 응답 그래프 미표시 버그 수정 (2026-03-08)

## 증상
- 설문 결과 페이지에서 checkbox 타입 질문(예: AI 사용 관련)의 그래프에 값이 0으로 표시됨
- radio, dropdown, likert 등 다른 타입은 정상 작동

## 원인 분석

### 저장 측 (`src/hooks/useSurvey.js:117`)
```js
// 기존 코드
answer: typeof answer === 'object' ? answer : { value: answer }
```
- checkbox 응답은 배열 `["옵션1", "옵션2"]`
- `typeof []` === `'object'` → 배열이 그대로 저장됨 (래핑 안 됨)
- DB에 `["옵션1", "옵션2"]`로 저장 (`.value` 없음)

### 읽기 측 (`src/pages/SurveyResultPage.jsx:192`)
```js
const val = r.answer?.value;  // → undefined (배열에 .value 없음)
```
- `Array.isArray(undefined)` → false
- `undefined !== undefined` → false
- 결과: **카운트 0** → 그래프 빈 상태

## 수정 내용

### 1. 저장 측 수정 (`useSurvey.js`)
```js
// 수정 후: 배열(checkbox)도 { value: [...] }로 래핑
answer: (typeof answer === 'object' && !Array.isArray(answer)) ? answer : { value: answer }
```

### 2. 읽기 측 수정 (`SurveyResultPage.jsx`)
```js
// 수정 후: 기존 레거시 데이터(배열 직접 저장)도 호환 처리
const val = r.answer?.value !== undefined ? r.answer.value : (Array.isArray(r.answer) ? r.answer : undefined);
```

## 수정 파일
| 파일 | 변경 |
|------|------|
| `src/hooks/useSurvey.js` | 배열 응답 `{ value: [...] }` 래핑 |
| `src/pages/SurveyResultPage.jsx` | 레거시 배열 데이터 호환 읽기 |

## 검증
- `npm run build` — 빌드 성공
- `npx vitest run` — 121개 테스트 통과
- 기존 레거시 데이터(배열 직접 저장)도 그래프에 정상 표시
- 새 응답은 `{ value: [...] }` 형태로 정규화 저장
