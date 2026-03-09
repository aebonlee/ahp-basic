# SMS 모달 UX 튜닝 — 특수문자 & 기본문구 템플릿

**작업일**: 2026-03-09

## 개요
SMS 발송 모달에 특수문자 빠른 삽입과 기본문구 템플릿 기능을 추가하여 사용 편의성 향상.

## 수정 파일
- `src/components/admin/SmsModal.jsx`
- `src/components/admin/SmsModal.module.css`

## 추가 기능

### 1. 특수문자 빠른 삽입
- textarea 위에 [특수문자] / [기본문구] 탭 전환 UI 추가
- 22종 특수문자: ★ ☆ ♥ ♡ ◆ ◇ ■ □ ● ○ ▶ ◀ △ ▽ ☎ ♠ ♣ ♧ → ← ↑ ↓
- 클릭 시 textarea 커서 위치에 삽입 (`selectionStart/End` + `useRef`)
- 삽입 후 바이트 카운터 자동 갱신 및 커서 위치 복원

### 2. 기본문구 템플릿 (3종)
| 이름 | 내용 |
|------|------|
| 평가 참여 요청 | `[AHP 설문] 평가에 참여해 주세요.\n{링크}` |
| 평가 독촉 | `[AHP 설문] 아직 평가가 완료되지 않았습니다. 참여 부탁드립니다.\n{링크}` |
| 평가 감사 | `[AHP 설문] 평가에 참여해 주셔서 감사합니다.` |

- 클릭 시 `{링크}`를 실제 inviteUrl(`#/eval/invite/{projectId}`)로 치환
- 기존 메시지가 있으면 `confirm()`으로 대체 확인

### 3. UI/CSS
- `.toolbar` — 탭 + 콘텐츠 컨테이너
- `.tabBar` / `.tabBtn` / `.tabBtnActive` — 탭 버튼 스타일
- `.symbolGrid` / `.symbolBtn` — 특수문자 flex wrap 그리드 (32x32 버튼, hover 확대)
- `.templateList` / `.templateItem` — 템플릿 카드 목록

## 검증
- `npm run build` 성공
