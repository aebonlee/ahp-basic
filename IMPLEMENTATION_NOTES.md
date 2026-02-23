# 모델 구축 페이지 — 계층 캔버스 전환 구현 노트

## 기존 코드 분석

### ModelBuilderPage.jsx (현재)
- 2컬럼 그리드 레이아웃: 좌측 기준 트리, 우측 대안 트리
- `CriteriaTree`, `AlternativeTree` 컴포넌트 사용
- 상태: selectedCriterion, selectedAlternative, showCriteriaForm, showAltForm, criteriaFormMode, altFormMode, showPreview
- 핸들러: handleCriterionClick, handleAddCriterion, handleEditCriterion, handleDeleteCriterion, handleAlternativeClick, handleAddAlternative, handleAltFormSubmit

### useCriteria.js 데이터 구조
- 플랫 배열: `[{ id, name, description, project_id, parent_id, sort_order }]`
- `getTree()` → `[{ ...c, children: [...] }]` (루트 노드 배열, children 재귀)
- `getLevel(id)` → depth 계산 (0부터 시작)

### useAlternatives.js 데이터 구조
- 플랫 배열: `[{ id, name, description, project_id, parent_id, sort_order }]`
- 트리 빌더 없음 (플랫 리스트로 사용)

### constants.js
```js
LEVEL_COLORS = ['#a0a', '#0aa', '#fa0', '#e55', '#5a5'] // 5레벨 색상
MAX_CRITERIA_LEVELS = 5
```

### CriteriaForm.jsx
- Props: `mode('add'|'edit'|'addChild'), criterion, parentName, onSubmit, onClose`
- onSubmit에 `{ name, description }` 전달

### AlternativeForm.jsx
- Props: `mode('add'|'edit'|'addSub'), alternative, parentName, onSubmit, onClose`
- onSubmit에 `{ name, description }` 전달

---

## 구현 계획

### 신규 파일 (5개)
1. `src/lib/hierarchyLayout.js` — 레이아웃 알고리즘
2. `src/components/model/HierarchyCanvas.jsx` — 메인 캔버스
3. `src/components/model/HierarchyCanvas.module.css` — 캔버스 스타일
4. `src/components/model/CanvasNode.jsx` — 개별 노드
5. `src/components/model/CanvasNode.module.css` — 노드 스타일

### 수정 파일 (2개)
6. `src/pages/ModelBuilderPage.jsx` — HierarchyCanvas로 교체
7. `src/pages/ModelBuilderPage.module.css` — 2컬럼 그리드 제거

### 재사용 (변경 없음)
- CriteriaForm.jsx, AlternativeForm.jsx, EvalMethodSelect.jsx, ModelPreview.jsx
- useCriteria.js, useAlternatives.js, useConfirm.js
- constants.js (LEVEL_COLORS)

---

## 레이아웃 알고리즘 상수
- NODE_WIDTH = 140
- NODE_HEIGHT = 48
- LEVEL_GAP = 80 (레벨 간 수직 간격)
- NODE_GAP = 24 (같은 레벨 노드 간 수평 간격)
- PADDING = 40 (캔버스 여백)
