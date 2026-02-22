# 배포 후 수정 및 기능 추가 기록

> 작성일: 2026-02-22
> 프로젝트: AHP Basic
> 도메인: https://ahp-basic.dreamitbiz.com

---

## 1. 배포 환경 구성

### 1.1 GitHub Pages 배포
- **커밋**: `00fec78` ci: trigger GitHub Pages deployment
- GitHub Actions workflow (`.github/workflows/deploy.yml`) 구성
- GitHub Secrets에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 설정

### 1.2 커스텀 도메인 설정
- **커밋**: `40c59ae` fix: base path를 '/'로 변경
- **커밋**: `7aff97e` fix: CNAME 파일 추가
- **문제**: `base: '/ahp_basic/'` 설정으로 커스텀 도메인에서 에셋 경로 불일치 → 빈 화면
- **해결**: `vite.config.js`에서 `base: '/'`로 변경, `public/CNAME` 파일 생성

---

## 2. 인증 시스템 (www 패턴 적용)

### 2.1 www.dreamitbiz.com 분석
- **커밋**: `ea0b592` feat: www 패턴 인증 시스템 적용
- www 저장소 분석 결과 → `Dev_md/06_Reference/www_repo_analysis.md`
- Supabase Auth 기반 인증: 이메일/비밀번호 + Google OAuth + Kakao OAuth
- PortOne V2 SDK 결제 (KG Inicis)
- `user_profiles` 테이블 + 트리거 기반 자동 프로필 생성
- 관리자 판별: 이메일 목록 기반

### 2.2 적용 파일
| 파일 | 변경 내용 |
|------|-----------|
| `src/utils/auth.js` | 신규 - Google/Kakao OAuth, 이메일 로그인, 회원가입, 비밀번호 재설정, 프로필 CRUD |
| `src/contexts/AuthContext.jsx` | 전면 수정 - profile 상태, isAdmin, 소셜 로그인 메서드 추가 |
| `src/pages/LoginPage.jsx` | 전면 수정 - 2단계 로그인 (방법 선택 → 이메일 폼) |
| `src/pages/SignupPage.jsx` | 수정 - displayName 필드 추가 |
| `src/pages/ForgotPasswordPage.jsx` | 신규 - 비밀번호 재설정 페이지 |
| `src/pages/AuthPage.module.css` | 수정 - 소셜 로그인 버튼 스타일 추가 |
| `src/utils/portone.js` | 신규 - PortOne V2 SDK 결제 (demo fallback) |
| `src/components/common/ProtectedRoute.jsx` | 수정 - from 위치 보존 |
| `src/components/common/AdminGuard.jsx` | 신규 - 관리자 전용 라우트 가드 |
| `supabase/migrations/001_user_profiles.sql` | 신규 - 전체 DB 스키마 + RLS 정책 |

### 2.3 관리자 이메일 목록
```javascript
const ADMIN_EMAILS = ['aebon@kakao.com', 'aebon@kyonggi.ac.kr', 'ryuwebpd@gmail.com'];
```

---

## 3. 랜딩 홈페이지

### 3.1 배경
- **커밋**: `89e3425` feat: 랜딩 홈페이지 추가
- **문제**: 첫 페이지가 로그인 페이지 → 사용자 경험 불량
- **해결**: `HomePage.jsx` 신규 생성, `/` 라우트를 HomePage로 변경

### 3.2 구성
- 헤더: 로고 + 로그인/회원가입 버튼 (로그인 시 대시보드 버튼)
- 히어로: 그라데이션 배경 + CTA 버튼
- 주요 기능: 6개 피처 카드 (계층 모델, 쌍대비교, 다수 평가자, 결과 분석, 브레인스토밍, 인증)
- 사용 방법: 4단계 프로세스
- 푸터: 저작권

---

## 4. 하위 도메인 리다이렉트

### 4.1 문제
- **커밋**: `8a1be2f` fix: 하위 도메인별 리다이렉트 URL 동적 생성
- Supabase Site URL이 `www.dreamitbiz.com`으로 설정 → OAuth 후 www로 리다이렉트

### 4.2 해결
- `getBaseUrl()` 헬퍼: `window.location.origin` 기반 동적 URL 생성
- OAuth `redirectTo`: hash fragment 제거 (Supabase `#access_token` 충돌 방지)
- 이메일 리다이렉트: hash 포함 (`getRedirectUrl('/login')`)

### 4.3 Supabase 대시보드 설정 (사용자 작업)
```
Site URL: https://www.dreamitbiz.com
Redirect URLs:
  - https://ahp-basic.dreamitbiz.com
  - https://ahp-basic.dreamitbiz.com/**
  - https://www.dreamitbiz.com
  - https://www.dreamitbiz.com/**
```

---

## 5. 코드 오류 수정 및 품질 개선

### 5.1 자동화 분석
- **커밋**: `cc2c3b9` fix: 코드 오류 수정 및 품질 개선
- 2개의 분석 에이전트를 병렬 실행하여 전체 소스코드 감사

### 5.2 수정 항목
| 파일 | 이슈 | 수정 |
|------|------|------|
| `LoginPage.jsx` | 렌더 중 `navigate()` 호출 (React 안티패턴) | `<Navigate>` 컴포넌트로 교체 |
| `SignupPage.jsx` | 동일 | 동일 |
| `auth.js` | OAuth redirectTo에 hash fragment 포함 | `getBaseUrl()` 사용 |
| `InviteLandingPage.jsx` | 미사용 `useSearchParams`, useEffect 의존성 누락 | 제거, `useCallback` 적용 |
| `PairwiseGrid.jsx` | `pageData.pairs` null 참조 위험 | `(pageData.pairs \|\| [])` |
| `Footer.jsx` | 연도 하드코딩 (2026) | `new Date().getFullYear()` |
| `index.html` | meta description, og tags, favicon 없음 | 추가 |

### 5.3 오탐 확인 (수정 불필요)
| 이슈 | 판단 |
|------|------|
| ParticipantForm CSS import | 의도적 스타일 공유 (ProjectForm.module.css) |
| WorkshopPage `ev.user_id` | auth user ID로 정확 (pairwise_comparisons.evaluator_id와 일치) |
| ModelBuilderPage AlternativeForm | 161-169줄에 정상 존재 |
| EvaluationContext camelCase | JS→DB snake_case 매핑 정상 |

---

## 6. 로고 클릭 및 네비게이션

### 6.1 수정
- **커밋**: `0bc2e0f` fix: 로고 클릭 시 홈으로 이동
- HomePage 헤더 로고: 클릭 시 `/` (홈)으로 이동
- LoginPage/SignupPage/ForgotPasswordPage: "AHP Basic" 타이틀 → 홈 링크
- Navbar 로고 (인증 후): 기존 동작 유지 (`/admin` 또는 `/eval`)

---

## 7. 커밋 히스토리

```
0bc2e0f fix: 로고 클릭 시 홈으로 이동 + 인증 페이지 로고 링크 추가
cc2c3b9 fix: 코드 오류 수정 및 품질 개선
8a1be2f fix: 하위 도메인별 리다이렉트 URL 동적 생성
89e3425 feat: 랜딩 홈페이지 추가 (/ → HomePage)
ea0b592 feat: www 패턴 인증 시스템 적용 (Google/Kakao OAuth, PortOne 결제)
7aff97e fix: CNAME 파일 추가 (커스텀 도메인 ahp-basic.dreamitbiz.com)
40c59ae fix: base path를 '/'로 변경 (커스텀 도메인 대응)
00fec78 ci: trigger GitHub Pages deployment
f719f28 Merge branch 'main' of github.com/aebonlee/ahp_basic
89bebbd feat: AHP Basic 전체 구현 - React 18 + Vite + Supabase
d0a8d9f Initial commit
```

---

## 8. 현재 상태 및 남은 작업

### 완료
- 전체 11 Phase 구현 (130 tasks)
- GitHub Pages 배포 (커스텀 도메인)
- www 패턴 인증 시스템 적용
- 랜딩 홈페이지
- 하위 도메인 리다이렉트
- 코드 오류 수정 (15개 검토, 7개 수정)
- 로고/네비게이션 개선

### 사용자 설정 필요
1. Supabase Redirect URLs 추가
2. Google OAuth provider 활성화 (Client ID/Secret)
3. Kakao OAuth provider 활성화 (REST API Key)
4. DB 마이그레이션 SQL 실행 (`supabase/migrations/001_user_profiles.sql`)
5. PortOne Store ID / Channel Key 설정 (결제 기능)
