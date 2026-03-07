# 세션 33: AI 분석도구 활용 — 12번 메뉴 구현

**날짜:** 2026-03-07
**작업 유형:** 신규 기능 (대규모)

---

## 작업 요약

대시보드 12번째 메뉴 "AI분석도구활용"을 추가하였다.
연구자가 자신의 OpenAI/Anthropic API 키를 등록하고, AHP 연구 결과 데이터를 AI에 전달하여 심층 분석·해석·보고서 초안을 생성하는 챗봇 인터페이스를 제공한다.

**신규 파일 12개, 수정 파일 2개. 새 npm 의존성 없음** (native fetch + ReadableStream SSE 스트리밍)

---

## 변경 파일 목록

| # | 파일 | 작업 | 설명 |
|---|------|------|------|
| 1 | `src/lib/aiService.js` | 신규 | AI 제공자별 API 호출 + SSE 스트리밍 + API 키 관리 (localStorage) |
| 2 | `src/lib/aiPromptTemplates.js` | 신규 | 분석 프롬프트 템플릿 6종 + 시스템 프롬프트 |
| 3 | `src/hooks/useAhpContext.js` | 신규 | AHP 결과 데이터 수집 → 텍스트 포맷 (기준·대안·CR 포함) |
| 4 | `src/components/ai/AiChatMessage.jsx` | 신규 | 채팅 메시지 버블 (마크다운 렌더링, 스트리밍 커서) |
| 5 | `src/components/ai/AiChatMessage.module.css` | 신규 | 채팅 버블 스타일 |
| 6 | `src/components/ai/AiApiKeyModal.jsx` | 신규 | API 키 설정 모달 (3종 제공자) |
| 7 | `src/components/ai/AiApiKeyModal.module.css` | 신규 | 모달 스타일 |
| 8 | `src/components/ai/AiProviderSelector.jsx` | 신규 | 제공자 탭 선택 UI (등록 상태 점 표시) |
| 9 | `src/components/ai/AiProviderSelector.module.css` | 신규 | 탭 셀렉터 스타일 |
| 10 | `src/pages/AiAnalysisPage.jsx` | 신규 | 메인 챗봇 페이지 (템플릿 카드 + 대화) |
| 11 | `src/pages/AiAnalysisPage.module.css` | 신규 | 페이지 스타일 |
| 12 | `docs/plan-ai-analysis-menu.md` | 신규 | 구현 계획서 |
| 13 | `src/components/layout/ProjectSidebar.jsx` | 수정 | STEPS 배열에 step 12 메뉴 항목 추가 |
| 14 | `src/App.jsx` | 수정 | lazy import + `/admin/project/:id/ai-analysis` 라우트 추가 |

---

## 1. AI 서비스 레이어 (`aiService.js`)

### 지원 제공자 3종

| 제공자 | API 엔드포인트 | 모델 | 스트리밍 |
|--------|---------------|------|----------|
| ChatGPT (OpenAI) | `api.openai.com/v1/chat/completions` | gpt-4o-mini | SSE ✅ |
| Claude (Anthropic) | `api.anthropic.com/v1/messages` | claude-sonnet-4-20250514 | SSE ✅ |
| 커스텀 챗봇 | 사용자 지정 URL | OpenAI 호환 | 비스트리밍 폴백 |

### API 키 관리
- `localStorage` 저장 (서버 전송 없음)
- 키: `ahp_openai_api_key`, `ahp_anthropic_api_key`, `ahp_custom_api_url`, `ahp_custom_api_key`
- 함수: `getApiKey()`, `setApiKey()`, `removeApiKey()`, `hasApiKey()`

### 핵심 함수
- `sendChatMessage(provider, messages, systemPrompt, onStream)` → SSE 스트리밍 응답
- `readSSE(response, parseChunk, onStream)` → 범용 SSE 리더

---

## 2. AHP 컨텍스트 훅 (`useAhpContext.js`)

AdminResultPage와 동일한 데이터 로딩·집계 패턴을 재사용하여 AHP 결과를 텍스트로 포맷한다.

### 재사용한 기존 모듈
- `useProject`, `useEvaluators`, `useCriteria`, `useAlternatives`
- `aggregateComparisons()`, `aggregateDirectInputs()`
- `buildPageSequence()`

### 생성되는 컨텍스트 텍스트 구조
```
## AHP 연구 분석 결과
### 프로젝트 정보 (이름, 평가방법, 평가자수, 기준수, 대안수)
### 기준 계층 구조 (로컬/글로벌 가중치, CR)
### 대안 종합 순위 (종합점수 기준)
### 기준별 대안 우선순위
### 일관성 검증 (CR 통과 여부)
```

---

## 3. 프롬프트 템플릿 6종

| 키 | 라벨 | 아이콘 | 용도 |
|----|------|--------|------|
| `comprehensive` | 종합 분석 리포트 | 📊 | 전체 결과 해석 + 시사점 |
| `criteria` | 기준 가중치 해석 | ⚖️ | 기준 중요도 심층 분석 |
| `alternatives` | 대안 순위 분석 | 🏆 | 대안 강약점 + 순위 격차 |
| `consistency` | 일관성 비율 평가 | ✅ | CR 값 의미 + 신뢰도 |
| `report` | 연구 보고서 초안 | 📝 | 학술 논문 "결과 및 논의" 초안 |
| `sensitivity` | 민감도 해석 | 🔍 | 결과 안정성 + 핵심 기준 |

---

## 4. UI 컴포넌트

### AiProviderSelector
- 3개 탭 (ChatGPT / Claude / 커스텀)
- 키 등록 상태 표시 (초록 ● / 회색 ○)
- "API 키 설정" 버튼

### AiApiKeyModal
- 기존 `Modal` 컴포넌트 재사용
- 제공자별 password 입력 (커스텀은 URL + 키)
- "API 키는 브라우저 localStorage에만 저장" 안내 문구

### AiChatMessage
- 사용자 메시지: 우측 정렬 (primary 배경)
- AI 응답: 좌측 정렬 (secondary 배경)
- 간단 마크다운 렌더링 (제목, 볼드, 리스트, 코드블록, 인라인코드)
- 스트리밍 중 커서(▍) 깜빡임 애니메이션

---

## 5. 메인 페이지 (`AiAnalysisPage.jsx`)

### 레이아웃
```
┌─────────────────────────────────────────────┐
│ [ChatGPT] [Claude] [커스텀]  [API 키 설정]   │  ← 헤더
├─────────────────────────────────────────────┤
│  ┌───────┐ ┌───────┐ ┌───────┐             │
│  │종합분석│ │기준해석│ │대안분석│ ...         │  ← 템플릿 카드
│  └───────┘ └───────┘ └───────┘             │
│  👤 기준 가중치를 분석해주세요               │  ← 채팅 메시지
│  🤖 분석 결과를 살펴보겠습니다...           │
├─────────────────────────────────────────────┤
│ [메시지 입력 textarea]          [전송]       │  ← 입력 영역
└─────────────────────────────────────────────┘
```

### 주요 동작
- 템플릿 카드 클릭 → 프롬프트 자동 전송
- Enter로 전송, Shift+Enter로 줄바꿈
- 메시지 20개 초과 시 API에는 최근 10개만 전송 (UI 전체 표시)
- 데이터 없으면 안내: "평가를 완료한 후 AI 분석을 이용할 수 있습니다"
- API 키 미등록 시 자동으로 키 설정 모달 열림

---

## 기술적 특이사항

- **npm 의존성 추가 없음** — `fetch()` + `ReadableStream` 네이티브 SSE 스트리밍
- **Anthropic 브라우저 직접 호출** — `anthropic-dangerous-direct-browser-access: true` 헤더
- **보안** — API 키는 localStorage에만 저장, 서버 전송 없음
- **기존 코드 재사용** — AdminResultPage의 데이터 로딩·집계 패턴 그대로 활용
