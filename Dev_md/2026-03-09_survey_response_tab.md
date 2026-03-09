# 평가 결과 페이지 - 설문 응답 탭 추가

**날짜**: 2026-03-09

## 개요
평가자가 평가 완료 전에 자신의 설문 응답을 확인할 수 있도록 결과 페이지에 "설문 응답" 탭을 추가.

## 변경 사항

### 1. 새 컴포넌트: `src/components/results/SurveyResponseView.jsx`
- 평가자 본인의 설문 응답을 읽기 전용 Q&A 카드 형식으로 표시
- 질문 카테고리별 분리: 인구통계학적(demographic) / 연구자 질문(custom)
- 각 질문에 타입 라벨 표시 (단답형, 객관식, 체크박스 등)
- 미응답 질문은 "(미응답)" 표시 + 이탤릭 스타일

### 2. `src/pages/EvalResultPage.jsx`
- `useSurveyQuestions`, `useSurveyResponses` 훅 통합
- 조건부 4번째 탭 "설문 응답" 추가 (설문 질문이 있는 경우만)
- 기존 "설문 응답 확인" 네비게이션 버튼 제거 (탭으로 대체)
- `hasSurvey` state 제거 → hooks 데이터 직접 사용
- `supabase` 직접 import 제거 (더 이상 필요 없음)

### 3. `src/components/results/SignaturePanel.jsx`
- `hasSurveyResponses` prop 추가
- 평가 완료 확인 다이얼로그에 설문 응답 확인 안내 메시지 추가

### 4. `src/styles/results.module.css`
- `.surveyQA`, `.surveyQ`, `.surveyType`, `.surveyA`, `.surveyNoAnswer` 스타일 추가

## 동작
- 설문이 있는 프로젝트: 결과 페이지에 4개 탭 (종합결과, 세부내용, 비일관성비율, 설문 응답)
- 설문이 없는 프로젝트: 기존대로 3개 탭
- "설문 응답" 탭에서 본인의 Q&A가 읽기 전용으로 표시
- "평가 완료" 클릭 시 설문 응답 확인 안내 포함
