# 결과 세부내용 바 차트 폭 제한 — 정렬 개선

**작업일**: 2026-03-09

## 변경 내용
- `.barList` grid 바 트랙 컬럼: `1fr` → `minmax(120px, 360px)`
- 바가 화면 전체를 차지하지 않고 적정 폭으로 제한
- 라벨(항목명) | 바(max 360px) | 수치(%) 순서로 깔끔하게 정렬

## 수정 파일
- `src/styles/results.module.css`

## 검증
- `npm run build` 성공
