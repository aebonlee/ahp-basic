# 설문집계 페이지 마스터-디테일 레이아웃 개선

## 날짜
2026-03-11

## 개요
설문집계(survey-result) 페이지의 평가자별 현황 영역을 **마스터-디테일 레이아웃**으로 재구성.
왼쪽 절반에 평가자 이름 목록(2열 넘버링), 오른쪽 절반에 선택된 평가자의 설문 응답 및 평가 진행 상세를 표시.

## 변경 전 문제
- 평가자 목록이 단순 뱃지(설문 완료/미응답, 평가 완료/미완료) 형태로만 표시
- `ev.completed`(DB 트리거 기반)를 사용하여 실제 비교 진행률과 불일치
- 개별 평가자의 설문 응답 내용을 확인할 방법이 없었음

## 수정 내용

### 1. 마스터-디테일 레이아웃 (`SurveyResultPage.jsx`)
- **왼쪽 (masterList)**: 평가자 이름 2열 그리드 (스크롤 없이 전체 나열)
  - 각 행: `번호 | 이름 | 설문완료 뱃지 | 평가완료 뱃지 | [세부내역] 버튼`
  - 뱃지 텍스트: 설문완료/미응답, 평가완료/진행중(n/N)/미시작
  - 선택된 평가자 하이라이트 (primary 색상 테두리)
  - [세부내역] 버튼 클릭 시 오른쪽 패널에 상세 표시
- **오른쪽 (detailPanel)**: 선택된 평가자 상세 (sticky)
  - 평가자 이름 헤더
  - 평가 진행: `count/totalRequired` + ProgressBar
  - 설문 응답: Q번호 + 질문텍스트 + 답변값 테이블 형태
  - 미선택 시 "[세부내역] 버튼을 클릭하면..." 안내 메시지

### 2. 실제 비교 데이터 기반 진행률
- `pairwise_comparisons` / `direct_input_values` 테이블에서 `.limit(10000)`으로 로드
- `buildPageSequence()`로 필요한 비교 키 Set 생성
- 유효한 키만 카운트하여 `evalProgress[evaluator_id]` 계산
- `ev.completed` 대신 `count >= totalRequired`로 완료 판정

### 3. 개인별 설문 응답 표시
- `useSurveyResponses` 훅의 `getResponsesByEvaluator(evaluatorId)` 활용
- 질문별 `answerMap` 구성 → Q번호 + 질문텍스트 + 답변값 그리드 표시
- 미응답 질문은 `-` 표시

### 4. 반응형
- 900px 이하: 마스터-디테일 상하 배치 (목록 위, 상세 아래)
- 600px 이하: 이름 목록 1열

## 수정 파일
| 파일 | 변경 |
|------|------|
| `src/pages/SurveyResultPage.jsx` | 마스터-디테일 구조, 비교 데이터 로드, EvalDetail 컴포넌트 |
| `src/pages/SurveyResultPage.module.css` | masterDetail 그리드, evalItem, detailPanel 스타일 |

## 기술 상세
- **데이터 흐름**: `useEvaluators` → 목록 / `useSurveyResponses` → 설문 / Supabase 직접 쿼리 → 비교 진행률
- **상태 관리**: `selectedEval` (선택된 평가자 ID), `rawCompData` (비교 데이터 원본)
- **성능**: `useMemo`로 `respondedIds`, `evalProgress`, `answerMap` 캐싱
- **키 포맷**: pairwise `${criterion_id}:${row_id}:${col_id}` / direct `${criterion_id}:${item_id}`

## 커밋 이력
| 커밋 | 내용 |
|------|------|
| `601d598` | 원래 디자인 복구, 명단 2열 |
| `b2c9a3f` | 4열 넘버링 + 클릭 상세 펼침 |
| `a90d042` | 마스터-디테일 레이아웃 |
| (latest) | 명단에 설문/평가 뱃지 + [세부내역] 버튼, 스크롤 제거, 테이블 형태 응답 |
