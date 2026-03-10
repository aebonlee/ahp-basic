# Supabase 1000행 기본 제한 수정 + CSP WebSocket 허용

## 날짜
2026-03-11

## 개요
Supabase PostgREST의 기본 행 제한(1000행)으로 인해 워크숍/집계결과 페이지에서
평가 데이터가 불완전하게 로드되는 문제를 수정하고,
CSP(Content Security Policy)에서 WebSocket(wss://) 연결이 차단되던 문제를 함께 해결.

## 근본 원인
- Supabase `.from().select()` 쿼리는 `.limit()`을 지정하지 않으면 **최대 1000행**만 반환
- 프로젝트 `332159be...`의 경우 34명 × 40쌍 = **1,360행**이지만 1,000행만 로드됨
- 워크숍 페이지: 0/40 (일부 평가자 데이터 누락)
- 집계결과 페이지: 비율 수치 미표시 (불완전한 비교행렬)

## 수정 내용

### 1. `.limit(10000)` 추가 — 4개 파일
| 파일 | 테이블 |
|------|--------|
| `src/pages/WorkshopPage.jsx` | pairwise_comparisons, direct_input_values |
| `src/pages/AdminResultPage.jsx` | pairwise_comparisons, direct_input_values |
| `src/hooks/useAhpContext.js` | pairwise_comparisons, direct_input_values |
| `src/contexts/EvaluationContext.jsx` | pairwise_comparisons, direct_input_values |

### 2. CSP WebSocket 허용 — `index.html`
- `connect-src`에 `wss://hcmgdztsgjvzcyxyayaj.supabase.co wss://*.supabase.co` 추가
- Supabase Realtime(WebSocket) 연결 차단 해소

### 3. 디버그 로그 제거
- AdminResultPage.jsx, WorkshopPage.jsx에서 디버그용 console.log/error/warn 제거

## 수정 파일
- `index.html` — CSP connect-src에 wss:// 추가
- `src/pages/WorkshopPage.jsx` — .limit(10000) 추가, 디버그 로그 제거
- `src/pages/AdminResultPage.jsx` — .limit(10000) 추가, 디버그 로그 제거
- `src/hooks/useAhpContext.js` — .limit(10000) 추가
- `src/contexts/EvaluationContext.jsx` — .limit(10000) 추가

## 영향 범위
- 1000행 초과 프로젝트에서 워크숍/집계결과가 정상 표시됨
- Supabase Realtime WebSocket 연결이 CSP에 의해 차단되지 않음
- 기존 1000행 이하 프로젝트에는 영향 없음
