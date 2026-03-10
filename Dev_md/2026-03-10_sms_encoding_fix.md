# SMS 한글 인코딩 수정

## 날짜
2026-03-10

## 개요
SMS 발송 시 한글이 깨지는 문제(글자깨짐/물음표 표시)를 수정했다.

## 원인 분석

### 1. JSON 빌드 시 특수문자 미이스케이프 (이전 수정)
- `buildRequestJson()` 함수가 template literal로 JSON을 조립
- 메시지에 개행(`\n`), 쌍따옴표(`"`), 백슬래시(`\`) 포함 시 JSON 문법 오류
- **SMS 템플릿은 전부 줄바꿈 포함** → 템플릿 사용 시 100% 실패
- `JSON.stringify()` 사용으로 해결

### 2. 한글 인코딩 문제 (핵심)
- icode korea TCP 서버(`211.172.232.124:9201`)에 JSON 전송 시 한글 처리 방식
- **문제**: 서버가 JSON을 UTF-8로 파싱하지만, SMS 게이트웨이는 EUC-KR 기반
- **시도한 방법들:**
  - `\uXXXX` 유니코드 이스케이프 (Java 원본 방식) → 초기에는 JSON 문법 오류와 결합되어 실패
  - Raw UTF-8 → 깨짐 (curl의 Windows CP949 인코딩이 원인)
  - `npm:iconv-lite` EUC-KR 인코딩 → Deno Deploy에서 미지원
  - EUC-KR 룩업 테이블 임베딩 → 서버의 UTF-8 JSON 파서가 거부
- **최종 해결**: `JSON.stringify()` + 비ASCII 문자를 `\uXXXX` JSON 이스케이프로 변환 → 순수 ASCII JSON 생성

### 3. curl 테스트 인코딩 문제
- Windows Git Bash의 curl이 한글을 **CP949/EUC-KR 바이트**로 전송
- Edge Function은 UTF-8을 기대 → CP949 바이트가 U+FFFD(대체 문자)로 변환
- **모든 curl 테스트가 잘못된 인코딩으로 진행되어** 실제 인코딩 문제와 혼동
- Node.js `https.request()`로 UTF-8 강제 전송 시 정상 동작 확인

### 4. `{이름}` 플레이스홀더 미치환
- 템플릿에 `{이름}님`이 포함되어 있으나, 발송 시 수신자별로 치환하지 않음
- `sendSmsBulk()`에 치환 로직 추가

### 5. `handleSend` 에러 핸들링 부재
- `SmsModal.jsx`의 `handleSend`에 try-catch가 없어 예기치 못한 에러 시 UI 멈춤

## 수정 내용

### `supabase/functions/send-sms/index.ts`
1. `iconv-lite` 의존성 제거
2. EUC-KR 룩업 테이블 제거 (30KB+ base64 데이터)
3. `JSON.stringify()` + `\uXXXX` 이스케이프 방식으로 변경
   - `json.replace(/[^\x00-\x7F]/g, ch => "\\u" + ch.charCodeAt(0).toString(16).padStart(4, "0"))`
   - 전체 JSON 바디가 순수 ASCII → icode 서버 호환성 보장
4. `eucKrByteLength()` — SMS/LMS 판별용 바이트 길이 계산 (Korean=2, ASCII=1)

### `src/lib/smsService.js`
1. `sendSmsBulk()`에서 수신자별 `{이름}` 플레이스홀더 치환 추가
2. `sendSms()`에서 `FunctionsHttpError` 상세 에러 추출 개선

### `src/components/admin/SmsModal.jsx`
1. `handleSend`에 try-catch-finally 추가
   - 에러 발생 시 전체 수신자를 실패로 표시
   - finally에서 `setSending(false)` 호출하여 UI 멈춤 방지

## 배포
- Edge Function: `npx supabase functions deploy send-sms` 실행 완료
- 프론트엔드: GitHub Actions 자동 배포 (main push 시)

## 테스트 결과
- Node.js UTF-8 전송 테스트: **성공** (한글 정상 표시)
- curl 테스트: Windows 터미널 인코딩 문제로 부정확 (CP949→UTF-8 변환 실패)
- 프론트엔드(브라우저): UTF-8 기본 사용 → 정상 동작 예상

## 교훈
1. **Windows 환경에서 curl 테스트 시 인코딩 주의**: Git Bash의 curl은 터미널 인코딩(CP949)을 사용하여 한글을 전송함. UTF-8 테스트는 Node.js 등을 사용할 것.
2. **Deno Deploy 제약**: `iconv-lite`, `TextDecoder('euc-kr')` 등 비UTF-8 인코딩 도구가 동작하지 않음
3. **JSON.stringify + \uXXXX 이스케이프**: 레거시 서버와의 호환성을 위한 안전한 방법

## 영향 범위
- SMS 발송 기능 전체 (SmsModal → smsService → Edge Function)
- `{이름}` 플레이스홀더가 있는 모든 SMS 템플릿
