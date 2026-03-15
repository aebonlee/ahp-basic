# 개발일지: 평가자 포인트 & 마켓플레이스 시스템

날짜: 2026-03-15

## 개요
평가자 전용 가입 → 포인트 적립 → 연구자 전환 또는 출금 요청 시스템 구축

## 구현 내용

### Phase 1: DB 마이그레이션 (031_evaluator_points_system.sql)
- user_profiles: points_balance 컬럼 + role CHECK에 'evaluator' 추가
- projects: reward_points, recruit_evaluators 컬럼 추가
- point_transactions 테이블 신규 (포인트 거래 내역)
- withdrawal_requests 테이블 신규 (출금 요청)
- RLS 정책 + 인덱스
- RPC 함수 8개:
  - earn_evaluation_points() — evaluators.completed UPDATE 트리거로 포인트 자동 적립
  - request_withdrawal() — 출금 요청 + 잔액 차감 (FOR UPDATE 행 잠금)
  - sa_process_withdrawal() — SA 승인/거절 (거절 시 환불)
  - convert_to_researcher() — 포인트 차감 + role→admin + 이용권 생성
  - get_marketplace_projects() — 공개 모집 프로젝트 목록
  - join_marketplace_project() — 마켓 프로젝트 자가 등록
  - sa_list_withdrawals() — SA 출금 목록 조회
  - get_point_history() — 포인트 내역 페이지네이션
- handle_new_user 트리거 수정: 회원가입 시 evaluator role 메타데이터 반영

### Phase 2: 상수/유틸
- src/lib/constants.js: POINT_TYPE, POINT_TYPE_LABELS, WITHDRAWAL_STATUS, WITHDRAWAL_STATUS_LABELS 추가
- src/lib/subscriptionPlans.js: getPlanPointCost(), getConvertiblePlans() 추가
- src/utils/formatters.js: formatPoints(), formatCurrency() 추가

### Phase 3: 커스텀 훅
- src/hooks/usePoints.js (신규): usePointBalance, usePointHistory, useMarketplace, useWithdrawals
- src/hooks/useSuperAdminWithdrawals.js (신규): SA 출금 관리 훅

### Phase 4: Auth 수정
- src/utils/auth.js: signUp()에 role 파라미터 추가 (evaluator 선택 시 메타데이터 전달)
- src/contexts/AuthContext.jsx: signUp에 role 전달, isEvaluator 속성 추가
- src/pages/SignupPage.jsx: 연구자/평가자 역할 선택 토글 UI
- src/pages/AuthPage.module.css: .roleToggle, .roleBtn, .roleBtnActive, .roleHint 스타일

### Phase 5: 신규 페이지 4개
| 페이지 | 라우트 | 설명 |
|--------|--------|------|
| EvaluatorDashboardPage | /eval/dashboard | 포인트 히어로 + 마켓플레이스 + 최근 활동 + 빠른 메뉴 |
| PointHistoryPage | /eval/points | 포인트 내역 테이블 + cursor 페이지네이션 |
| WithdrawalRequestPage | /eval/withdraw | 출금 폼 + 요청 목록 (2열 레이아웃) |
| RoleConversionPage | /eval/upgrade | 플랜 카드 그리드 + 포인트 전환 |

### Phase 6: 기존 페이지 수정
- App.jsx: 4개 신규 라우트 등록 (ProtectedRoute 감싸기)
- EvaluatorMainPage: 포인트 잔액 배지 + 대시보드 링크 (evaluator role일 때만)
- EvaluatorManagementPage: reward_points 입력 + recruit_evaluators 체크박스 토글
- SuperAdminPage: '출금 관리' 탭 추가 (승인/거절 버튼), evaluator role 옵션 추가

## 핵심 설계 결정
- 포인트 적립: DB 트리거 기반 (evaluators.completed UPDATE 시 자동 실행)
- Race condition 방지: 모든 잔액 변경 RPC에서 FOR UPDATE 행 잠금
- Supabase 규칙: .catch() 금지 → .then(res, err) 패턴 준수
- Guard 호환: evaluator role → AdminGuard 차단, ProtectedRoute로 보호
- 하위 호환: 기존 role='user' 사용자 영향 없음

## 수정/생성 파일 목록 (17개)
### 신규 파일 (11개)
- supabase/migrations/031_evaluator_points_system.sql
- src/hooks/usePoints.js
- src/hooks/useSuperAdminWithdrawals.js
- src/pages/EvaluatorDashboardPage.jsx + .module.css
- src/pages/PointHistoryPage.jsx + .module.css
- src/pages/WithdrawalRequestPage.jsx + .module.css
- src/pages/RoleConversionPage.jsx + .module.css

### 수정 파일 (6개)
- src/lib/constants.js
- src/lib/subscriptionPlans.js
- src/utils/formatters.js
- src/utils/auth.js
- src/contexts/AuthContext.jsx
- src/pages/SignupPage.jsx
- src/pages/AuthPage.module.css
- src/pages/EvaluatorMainPage.jsx + .module.css
- src/pages/EvaluatorManagementPage.jsx + .module.css
- src/pages/SuperAdminPage.jsx
- src/App.jsx

## 배포 절차
1. Supabase SQL Editor에서 031_evaluator_points_system.sql 실행
2. git commit & push → GitHub Actions 자동 배포

## 검증
- vite build 성공 확인 (빌드 에러 없음)
