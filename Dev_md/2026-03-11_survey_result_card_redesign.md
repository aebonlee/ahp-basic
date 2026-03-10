# 설문 집계 카드 디자인 개선

**날짜:** 2026-03-11
**작업 범위:** `SurveyResultPage.jsx`, `SurveyResultPage.module.css`

---

## 개요

설문집계 페이지 하단의 질문별 결과 카드(QuestionResult)를 간결하고 시각적으로 매력적인 디자인으로 전면 개편.

## 변경 내역

### 1. 질문 카드 2열 그리드 배치

- 기존: 1열 세로 나열 → **2열 CSS Grid** (`.questionGrid`)
- 반응형: 900px 이하 1열 자동 전환

### 2. 카드 구조 개편 (QuestionResult)

**기존:** 단순 흰색 박스 + h3 제목 + 응답 수 텍스트
**개선:**
- 좌측 4px 컬러 보더 (질문 타입별 색상 구분)
- 헤더 영역: 타입 뱃지(컬러) + 응답 수(mono 폰트)
- 질문 텍스트: 2줄 제한 + 말줄임
- hover 시 미세한 shadow + translateY 효과

### 3. 질문 타입별 색상 시스템

| 타입 | 색상 | 적용 위치 |
|------|------|-----------|
| radio, dropdown | Blue `#2563eb` | 좌측 보더 + 뱃지 |
| checkbox | Violet `#7c3aed` | 좌측 보더 + 뱃지 |
| short_text, long_text | Teal `#0891b2` | 좌측 보더 + 뱃지 |
| number | Emerald `#059669` | 좌측 보더 + 뱃지 |
| likert | Amber `#f59e0b` | 좌측 보더 + 뱃지 |

### 4. 텍스트 응답 간결화

- **기존:** 모든 응답을 `<ul>`로 전부 나열 → 길어짐
- **개선:** 3건까지만 미리보기 (1줄 말줄임) + "외 N건" 표시
- 좌측 teal 보더 장식

### 5. 객관식/체크박스/드롭다운/리커트 → CSS 바

- **기존:** Recharts 바 차트 (250px 높이) → 무거움
- **개선:** CSS-only 수평 바로 교체
  - `옵션명 | ████████ 45.2% (12명)` 형태
  - 1위 항목: 진한 인디고 `#6366f1` 하이라이트
  - 나머지: 연한 라벤더 `#c7d2fe`
  - 바 너비는 최대 응답 수 기준 비율 계산

### 6. 숫자 통계 → 컬러 통계 박스

- **기존:** 4칸 단색 그리드
- **개선:** 각 통계 박스에 개별 색상 accent
  - 최솟값: Blue 배경 + Blue 숫자
  - 최댓값: Violet 배경 + Violet 숫자
  - 평균: Emerald 배경 + Emerald 숫자
  - 중앙값: Teal 배경 + Teal 숫자

---

## 삭제된 CSS 클래스

`.questionCard`, `.questionTitle`, `.questionType`, `.responseCount`, `.textList`, `.textItem`, `.statsGrid`, `.statBox`, `.statValue`, `.statLabel`, `.chartWrap`

## 추가된 CSS 클래스

`.questionGrid`, `.qCard`, `.qCardHeader`, `.qBadge`, `.qCount`, `.qCardTitle`, `.qCardBody`, `.qTextPreview`, `.qTextItem`, `.qTextMore`, `.qBarList`, `.qBarRow`, `.qBarLabel`, `.qBarTrack`, `.qBarFill`, `.qBarPct`, `.qStatGrid`, `.qStatBox`, `.qStatNum`, `.qStatLabel`

## 기술 참고

- Recharts 임포트는 유지 (EvalDetail 개인 결과 차트에서 계속 사용)
- `data-type` HTML 속성으로 CSS 타입별 스타일 분기 (CSS attribute selector)
- ChoiceResults에서 CSS 바 너비는 `maxCount` 기준 상대 비율로 계산
