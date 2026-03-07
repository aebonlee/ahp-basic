# 세션 32: 설문 5단계 + QR 공개 배포 + 평가 진행률 구현

**날짜:** 2026-03-07
**작업 유형:** 기능 추가 (Feature)

---

## 개요

현재 설문설계(SurveyBuilderPage)는 4단계(연구소개 → 동의안내 → 인구통계 → 연구자설문)로 구성되어 있다.
연구자가 불특정 다수에게 QR 코드와 4자리 비밀번호로 설문을 배포하고, 참여자가 자기 정보를 입력하면 자동으로 평가자 목록에 등록되며, 진행률을 실시간 확인할 수 있는 기능을 구현한다.

---

## 변경 파일 목록

| # | 파일 | 작업 |
|---|------|------|
| 1 | `supabase/migrations/013_public_access_qr.sql` | 신규 — DB 스키마 + RPC |
| 2 | `src/hooks/useSurvey.js` | 수정 — useSurveyConfig에 access_code, public_access_enabled 추가 |
| 3 | `src/pages/SurveyBuilderPage.jsx` | 수정 — STEP 5 추가 (QR + 비밀번호) |
| 4 | `src/pages/SurveyBuilderPage.module.css` | 수정 — Step 5 스타일 추가 |
| 5 | `src/pages/InviteLandingPage.jsx` | 수정 — 공개 접근 비밀번호 + 자가등록 플로우 |
| 6 | `src/pages/InviteLandingPage.module.css` | 수정 — 등록 폼 스타일 추가 |
| 7 | `src/pages/EvaluatorManagementPage.jsx` | 수정 — 진행률 표시 + 구분 배지 |
| 8 | `src/pages/EvaluatorManagementPage.module.css` | 수정 — 진행률/배지 스타일 |
| 9 | `package.json` | 수정 — qrcode.react 의존성 추가 |

---

## Phase 1: DB 마이그레이션 (`013_public_access_qr.sql`)

### 1a. 스키마 변경
```sql
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS access_code TEXT,
  ADD COLUMN IF NOT EXISTS public_access_enabled BOOLEAN DEFAULT FALSE;

ALTER TABLE public.evaluators
  ADD COLUMN IF NOT EXISTS registration_source TEXT DEFAULT 'admin';
  -- 'admin' = 연구자가 직접 등록, 'public' = QR 자가등록
```

### 1b. RPC: `public_verify_access`
- **입력:** project_id, access_code (4자리)
- **검증:** public_access_enabled=TRUE 이고 access_code 일치 시 프로젝트 정보 반환
- **SECURITY DEFINER** (비로그인 사용자 접근)

### 1c. RPC: `public_register_evaluator`
- **입력:** project_id, access_code, name, phone
- **동작:** access_code 재검증 → 동일 phone 존재 시 기존 반환 → 없으면 INSERT
- **email 필드:** `{phone}@public.local` (NOT NULL + UNIQUE 제약 충족)
- **registration_source:** 'public'

### 1d. `get_project_for_invite` 확장
- 반환값에 `public_access_enabled` 추가 (기존: id, name)

---

## Phase 2: useSurveyConfig 훅 확장 (`src/hooks/useSurvey.js`)

**수정 위치:** `useSurveyConfig` 함수

- 초기 state에 `access_code: ''`, `public_access_enabled: false` 추가
- `.select()` 쿼리에 `access_code, public_access_enabled` 추가
- `setConfig`에 새 필드 포함
- `saveConfig`는 이미 `updates` 스프레드 방식이라 변경 불필요

---

## Phase 3: SurveyBuilderPage Step 5 (`src/pages/SurveyBuilderPage.jsx`)

### 3a. STEPS 상수 변경
```js
{ key: 'distribute', num: 5, label: '공개 배포 설정' }
```

### 3b. 신규 의존성
```bash
npm install qrcode.react
```

### 3c. StepDistribute 컴포넌트
- 공개 접근 활성화 토글 (체크박스)
- 4자리 비밀번호 입력 (숫자만, onBlur 시 saveConfig)
- QR 코드 표시 (`QRCodeSVG` — 초대 URL 인코딩)
- URL 복사 버튼
- QR 이미지 다운로드 버튼 (SVG → Canvas → PNG)
- 기존 카드 스타일 패턴 재사용 (`.card`, `.cardHeader`, `.cardBadge`)

### 3d. CSS 추가
- `.distributeToggle`, `.toggleLabel` — 토글 영역
- `.distributeSection`, `.distributeSectionTitle` — 섹션 구분
- `.codeInput` — 4자리 비밀번호 입력
- `.qrContainer` — QR 코드 중앙 정렬
- `.qrActions` — 버튼 그룹
- `.qrBtn` — 액션 버튼
- `.urlPreview` — URL 미리보기

---

## Phase 4: InviteLandingPage 공개 접근 플로우 (`src/pages/InviteLandingPage.jsx`)

### 4a. 새 상태
- `accessCode`, `accessError` — 비밀번호 입력/에러
- `regName`, `regPhone`, `regError` — 자가등록 폼

### 4b. checkInvite 수정
- 비로그인: `public_access_enabled=true` → `setStatus('need_access_code')`
- 로그인: 평가자 매칭 실패 + `public_access_enabled=true` → `setStatus('need_access_code')`

### 4c. 새 핸들러
- `handleVerifyAccessCode` — RPC `public_verify_access` 호출
- `handlePublicRegister` — RPC `public_register_evaluator` 호출 → 평가 시작

### 4d. 새 UI
- `status === 'need_access_code'` — 4자리 비밀번호 입력 화면
- `status === 'need_registration'` — 이름/전화번호 입력 화면

---

## Phase 5: 평가자 관리 진행률 (`src/pages/EvaluatorManagementPage.jsx`)

### 5a. 진행률 데이터
- `useCriteria(id)`, `useAlternatives(id)` 로 모델 구조 가져오기
- `pairwise_comparisons` 또는 `direct_input_values`에서 evaluator_id별 레코드 가져오기
- `buildPageSequence()`로 총 필요 비교 수 계산

### 5b. 테이블 확장 (5→7 컬럼)
```
이름 | 이메일 | 전화번호 | 구분 | 진행률 | 상태 | 관리
```

- **구분:** `registration_source === 'public'` → "QR 접속" 배지 / "직접 등록"
- **진행률:** `<ProgressBar>` + 퍼센트 텍스트
- **상태:** 기존 completed 표시 유지

### 5c. CSS 추가
- `.badgePublic` — QR 접속 배지 (파란색 pill)
- `.badgeAdmin` — 직접 등록 배지 (회색 pill)
- `.progressCell` — 진행률 셀
- `.progressBar`, `.progressBarFill` — 프로그레스 바

---

## 구현 순서

1. `npm install qrcode.react`
2. `013_public_access_qr.sql` 작성 → **Supabase SQL Editor에서 수동 실행**
3. `useSurvey.js` — useSurveyConfig 확장
4. `SurveyBuilderPage.jsx` + CSS — Step 5 추가
5. `InviteLandingPage.jsx` + CSS — 공개 접근 플로우
6. `EvaluatorManagementPage.jsx` + CSS — 진행률 + 배지
7. 빌드 확인 (`npm run build`)

---

## 검증 방법

1. **설문 설계 5단계 확인** — Step 5 탭 클릭 → 토글/비밀번호/QR 표시
2. **QR 코드 기능** — URL 복사, QR 다운로드 동작 확인
3. **공개 접근 테스트** — 시크릿 창에서 QR URL 접속 → 비밀번호 입력 → 이름/전화번호 등록 → 평가 진행
4. **평가자 자동 등록** — 관리 페이지에서 QR 접속 평가자가 "QR 접속" 배지로 표시
5. **진행률 확인** — 일부 평가 후 관리 페이지에서 퍼센트 업데이트 확인
6. **기존 플로우 유지** — public_access_enabled=false 시 기존 전화번호 인증 플로우 정상 동작
7. `npm run build` — 빌드 성공 확인
