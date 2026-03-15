# 평가자 모집 설정 — 저장 버튼 CRUD & 마켓플레이스 버그 수정

**날짜:** 2026-03-15
**파일:** `src/pages/EvaluatorManagementPage.jsx`, `src/pages/EvaluatorManagementPage.module.css`, `src/pages/EvaluatorInfoPage.jsx`, `src/pages/HomePage.jsx`, `src/hooks/usePoints.js`, `src/pages/CommunityPage.jsx`, `src/pages/CommunityPage.module.css`, `supabase/migrations/032_recruit_description.sql`

---

## 1. 모집 설정 저장 버튼 추가

### 배경

평가자 관리 페이지의 "보상 포인트 / 마켓플레이스 공개 / 모집 공고" 필드는 기존에 `onChange`(포인트, 체크박스)와 `onBlur`(텍스트)로 즉시 DB에 저장되었다.
사용자 경험 다양성을 위해 **저장 버튼**을 추가하여, 자동 저장과 명시적 저장 두 가지 방식을 모두 지원하도록 변경하였다.

### 변경 내용

#### 로컬 state 도입 (EvaluatorManagementPage.jsx)

기존 `currentProject` 값을 직접 바인딩하던 방식에서, 로컬 state로 전환하여 controlled input으로 변경.

- `rewardPoints`, `recruitOpen`, `recruitDesc`, `saving` state 추가
- `currentProject` 로드 시 `useEffect`로 초기값 세팅 (`currentProject?.id` 의존)

#### 이중 저장 방식 유지

- **자동 저장**: 포인트 `onBlur`, 체크박스 `onChange`, 텍스트 `onBlur` — 기존 동작 보존
- **명시적 저장**: 저장 버튼 클릭 시 3개 필드를 한 번에 `updateProject()` 호출

#### 변경 감지 (isRecruitDirty)

- 로컬 state와 `currentProject` 비교로 변경 여부 판별
- 변경 없으면 저장 버튼 비활성화 (disabled)
- 자동 저장 성공 후 `currentProject` 업데이트 → isDirty 자동 해제

#### CSS 추가 (EvaluatorManagementPage.module.css)

- `.saveRow` — 우측 정렬 컨테이너, 상단 구분선
- `.saveBtn` — primary 색상, hover/disabled 상태 처리

---

## 2. 마켓플레이스 노출 버그 수정

### 문제

모집 설정 완료 후 메인페이지와 마켓플레이스에 프로젝트가 노출되지 않음.

### 원인 분석

#### 원인 1: RPC 조건 과다 (`reward_points > 0`)

`get_marketplace_projects()` RPC 함수의 WHERE 조건에 `reward_points > 0`이 포함되어 있어, 보상 포인트를 0으로 설정한 프로젝트가 마켓플레이스에서 제외됨.

**수정:** `reward_points > 0` 조건 제거 → 포인트 0이어도 노출

```sql
-- Before
WHERE p.recruit_evaluators = TRUE AND p.status = 1 AND p.reward_points > 0
-- After
WHERE p.recruit_evaluators = TRUE AND p.status = 1
```

#### 원인 2: EvaluatorInfoPage 필드명 불일치

`EvaluatorInfoPage.jsx`에서 RPC 반환 컬럼명과 다른 필드명을 사용하여 데이터가 표시되지 않음.

| 잘못된 필드명 | 올바른 필드명 (RPC 반환) |
|---|---|
| `p.title` | `p.name` |
| `p.point_reward` | `p.reward_points` |
| `p.current_evaluators` | `p.evaluator_count` |

#### 원인 3: RPC 에러 무시

`HomePage.jsx`와 `usePoints.js`에서 RPC 호출 에러를 조용히 무시 (`() => {}`)하여 디버깅 불가.

**수정:** `console.error('[Marketplace RPC]', error)` 로깅 추가

### DB 적용

Supabase SQL Editor에서 `DROP FUNCTION` 후 재생성 필요:

```sql
DROP FUNCTION IF EXISTS public.get_marketplace_projects();
-- 이후 수정된 CREATE FUNCTION 실행
```

---

## 3. 커뮤니티 "평가자 모집" 탭에 마켓플레이스 프로젝트 표시

### 문제

커뮤니티 페이지(`/community?tab=recruit-evaluator`)의 "평가자 모집" 탭은 커뮤니티 게시글만 표시하고, `get_marketplace_projects()` RPC 데이터를 연동하지 않음.

### 수정 (CommunityPage.jsx, CommunityPage.module.css)

- `recruit-evaluator` 탭 진입 시 `get_marketplace_projects()` RPC 호출
- 게시글 목록 상단에 "현재 모집 중인 프로젝트" 카드 그리드 표시
- 카드에 프로젝트명, 모집 공고(3줄 클램프), 평가 방법, 보상 포인트, 참여자 수 표시
- 반응형: 데스크톱 2열, 모바일 1열

---

## 4. 마켓플레이스 카드 클릭 시 초대 페이지 이동

### 문제

메인페이지, 커뮤니티 "평가자 모집" 탭, 평가자 안내 페이지의 마켓플레이스 프로젝트 카드가 클릭 불가 상태.

### 수정

3개 페이지의 마켓플레이스 카드에 `onClick={() => navigate('/eval/invite/${p.id}')}` 추가:

- `HomePage.jsx` — 메인페이지 "현재 모집 중인 평가" 카드
- `CommunityPage.jsx` — 커뮤니티 "평가자 모집" 탭 카드
- `EvaluatorInfoPage.jsx` — 평가자 안내 "현재 모집 중인 프로젝트" 카드

클릭 시 기존 초대 랜딩 페이지(`/eval/invite/:token`)로 이동하여 평가 참여 가능.

---

## 검증

- `npx vite build` 성공 확인
- Supabase SQL Editor에서 `SELECT * FROM get_marketplace_projects()` 정상 반환 확인
