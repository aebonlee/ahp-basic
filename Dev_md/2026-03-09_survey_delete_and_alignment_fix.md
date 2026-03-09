# 2026-03-09 개발 내역: 설문 질문 삭제 UX 개선 + 평가 화면 정렬 수정

## 1. 설문 질문 추가/삭제 자유도 개선

### 배경
인구통계학적 설문(Step 3)과 연구자 설문항목(Step 4) 모두 GFormCard를 통해 개별 편집/삭제/복제/이동이 가능했으나:
- **전체 삭제** 기능 없음 — 템플릿 11개 로드 후 모두 지우려면 하나씩 삭제해야 함
- **삭제 확인** 없음 — 🗑 클릭 즉시 삭제되어 실수로 날릴 수 있음
- **템플릿 재로드** 불가 — 질문이 1개라도 있으면 "템플릿 로드" 버튼이 사라짐

### 변경 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/hooks/useSurvey.js` | `deleteQuestionsByCategory(category)` 함수 추가 — category별 전체 삭제 (DB + 로컬 state) |
| `src/pages/SurveyBuilderPage.jsx` | ConfirmDialog 연동, 개별/전체 삭제 확인, 헤더에 "전체 삭제" + "템플릿 추가" 버튼 |
| `src/pages/SurveyBuilderPage.module.css` | `.headerActions`, `.headerActionBtn`, `.headerActionBtnDanger` 스타일 추가 |

### 동작
- **개별 삭제**: 🗑 클릭 → ConfirmDialog "이 질문을 삭제하시겠습니까?" → 확인 시 삭제
- **전체 삭제**: 섹션 헤더의 "전체 삭제" 버튼 → ConfirmDialog "모든 {카테고리} 질문(N개)을 삭제하시겠습니까?" → 확인 시 일괄 삭제
- **템플릿 추가**: 질문이 있어도 헤더에 "+ 템플릿 추가" 버튼 표시 → 기존 질문 유지한 채 템플릿 질문 뒤에 추가
- **빈 상태**: 기존과 동일하게 큰 템플릿 로드 영역 표시

### 헤더 UI (질문이 있을 때)
```
┌──────────────────────────────────────────┐
│ STEP 3  인구통계학적 설문     12개 질문  │
│ 설명 텍스트...                           │
│  [+ 템플릿 추가]  [전체 삭제]            │
└──────────────────────────────────────────┘
```

---

## 2. 평가자 모드 9점 척도 + 중요도 차트 정렬 수정

### 배경
- 9점 척도: 양쪽 라벨이 `min-width/max-width`로 글자 길이에 따라 너비가 달라져 셀 그리드가 행마다 어긋남
- 중요도 바 차트: 라벨 너비가 가변이라 바 트랙 시작점이 행마다 달라 삐뚤삐뚤해 보임

### 변경 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/styles/pairwise.module.css` | `labelLeft`/`labelRight`를 `width: var(--label-width-desktop)` 고정폭으로 변경, `word-break: keep-all` 추가, 모바일도 고정폭 적용 |
| `src/components/evaluation/PriorityBarChart.module.css` | `.container`를 CSS Grid(`grid-template-columns: auto 1fr auto`)로 변경, `.row`를 `display: contents`로 변경하여 모든 행이 동일 컬럼 너비 공유 |

### 정렬 방식
- **9점 척도**: 모든 행의 라벨이 `--label-width-desktop` (200px) 고정 → 스케일 헤더/숫자 행과 완벽 정렬
- **중요도 차트**: CSS Grid의 `auto` 컬럼이 전체 행에서 가장 긴 라벨 너비를 자동 계산 → 바 트랙 시작점 일치, 말 줄임 없이 정렬 유지

---

## 수정 파일 요약

| # | 파일 | 변경 |
|---|------|------|
| 1 | `src/hooks/useSurvey.js` | `deleteQuestionsByCategory` 추가 |
| 2 | `src/pages/SurveyBuilderPage.jsx` | 삭제 확인 + 전체 삭제 + 템플릿 재로드 |
| 3 | `src/pages/SurveyBuilderPage.module.css` | 헤더 액션 버튼 스타일 |
| 4 | `src/styles/pairwise.module.css` | 9점 척도 라벨 고정폭 정렬 |
| 5 | `src/components/evaluation/PriorityBarChart.module.css` | CSS Grid 정렬 |

**총 5개 파일 수정, 신규 파일 0개 (문서 1개 추가)**
