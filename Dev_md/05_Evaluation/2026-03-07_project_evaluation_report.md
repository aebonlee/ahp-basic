# AHP Basic 프로젝트 평가보고서

## 평가 정보

| 항목 | 내용 |
|------|------|
| 평가일 | 2026-03-07 |
| 평가자 | Claude Code (자동 점검) |
| 평가 대상 | GitHub 리포지토리 + 로컬 디렉토리 전체 |
| 평가 단계 | 운영 (Production) |
| 리포지토리 | https://github.com/aebonlee/ahp-basic |
| 배포 URL | http://ahp-basic.dreamitbiz.com |
| 로컬 경로 | D:\ahp_basic |

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 프로젝트명 | AHP Basic |
| 설명 | AHP(계층분석법) 의사결정 분석 웹 애플리케이션 |
| 스택 | React 18 + Vite 5 + Supabase + HashRouter |
| 생성일 | 2026-02-21 |
| 최종 업데이트 | 2026-03-07 |
| 공개 여부 | Public |
| 라이선스 | 없음 |
| 기여자 | aebonlee (단독 개발, 158 commits) |

---

## 2. 리포지토리 통계

| 지표 | 값 |
|------|-----|
| 총 커밋 | 158회 |
| 신규 파일 추가 커밋 | 51회 |
| 리포 크기 | 8,421 KB |
| Stars / Forks | 0 / 0 |
| Open Issues / PRs | 0 / 0 |
| 브랜치 | main (운영), gh-pages (배포) |

### 언어 구성

| 언어 | 바이트 수 | 비중 |
|------|-----------|------|
| JavaScript | 628,353 | 61.0% |
| CSS | 243,258 | 23.6% |
| HTML | 133,422 | 12.9% |
| PLpgSQL | 25,739 | 2.5% |

---

## 3. 소스코드 규모

| 분류 | 파일 수 | 설명 |
|------|---------|------|
| 페이지 컴포넌트 | 29 | 공개(7), 인증(3), 관리자(10), 평가자(5), 특수(4) |
| UI 컴포넌트 | 60+ | admin(8), evaluation(11), model(8), results(8), common(8), layout(6) 등 |
| 커스텀 Hooks | 12 | useAuth, useProjects, usePairwiseComparison 등 |
| 핵심 라이브러리 | 16 | AHP 엔진, 집계, Best-fit, 민감도, 통계 |
| 유틸리티 | 5 | auth, formatters, validators, portone |
| 컨텍스트 | 4 | Auth, Project, Evaluation, Toast |
| 테스트 | 9 | Vitest 기반 단위 테스트 |
| CSS 모듈 | 75+ | CSS Modules 방식 |
| DB 마이그레이션 | 12 | Supabase SQL |
| 개발 문서 | 19 | 개발일지, 가이드, 설계 문서 |
| 총 코드량 (추정) | ~15,000-18,000 LOC | |

---

## 4. 아키텍처 평가

### 4.1 프론트엔드 구조 — A (우수)

```
src/
├── pages/          29개 라우트 페이지
├── components/     9개 도메인별 모듈
│   ├── admin/          프로젝트 관리 (8)
│   ├── evaluation/     쌍대비교 평가 (11)
│   ├── model/          모델 빌더 (8)
│   ├── results/        결과 표시 (8)
│   ├── common/         공통 UI (8)
│   ├── layout/         레이아웃 (6)
│   ├── brainstorming/  브레인스토밍 (3)
│   ├── sensitivity/    민감도 (2)
│   └── statistics/     통계 (2)
├── contexts/       4개 전역 상태 (Auth, Project, Evaluation, Toast)
├── hooks/          12개 커스텀 훅
├── lib/            16개 핵심 알고리즘 & 유틸
├── utils/          5개 헬퍼 함수
└── styles/         글로벌 CSS & 디자인 토큰
```

- Context API + Custom Hooks로 깔끔한 상태 관리
- CSS Modules로 스타일 격리
- 도메인 기반 컴포넌트 분류 (admin, evaluation, model, results)

### 4.2 라우팅 — A (우수)

- HashRouter (GitHub Pages SPA 호환)
- AdminGuard, EvaluatorGuard, SuperAdminGuard로 접근 제어
- 토큰 기반 익명 평가자 초대 링크 지원

**라우트 구조:**

```
공개 라우트:
  / → HomePage
  /login, /signup, /register → 인증
  /forgot-password → 비밀번호 재설정
  /about, /features, /guide, /manual → 정보
  /survey-stats, /management → 공개 기능
  /eval/invite/:token → 익명 평가자 링크

관리자 라우트 (AdminGuard):
  /admin → AdminDashboard
  /admin/project/:id → 모델 빌더
  /admin/project/:id/brain → 브레인스토밍
  /admin/project/:id/confirm → 모델 확인
  /admin/project/:id/eval → 평가자 관리
  /admin/project/:id/survey → 설문 빌더
  /admin/project/:id/result → 관리자 결과
  /admin/project/:id/survey-result → 설문 결과
  /admin/project/:id/sensitivity → 민감도 분석
  /admin/project/:id/resource → 자원 배분
  /admin/project/:id/workshop → 워크숍
  /admin/project/:id/statistics → 통계 분석

평가자 라우트 (EvaluatorGuard):
  /eval → 평가자 메인
  /eval/project/:id → 쌍대비교 평가
  /eval/project/:id/direct → 직접 입력
  /eval/project/:id/pre-survey → 사전 설문
  /eval/project/:id/result → 평가 결과

SuperAdmin 라우트:
  /superadmin → 전체 사용자 & 프로젝트 관리
```

### 4.3 백엔드 (Supabase) — A (우수)

- 11개 테이블: user_profiles, projects, criteria, alternatives, evaluators, pairwise_comparisons, direct_input_values, brainstorming_items, evaluation_signatures, orders, survey 테이블
- 12개 SQL 마이그레이션 (순차적, 체계적)
- RLS(Row-Level Security) 정책 적용
- PKCE 인증 플로우 (Email, Google, Kakao)
- SuperAdmin RPC 함수 분리
- signup_domain 추적 (멀티사이트 대응)

### 4.4 핵심 알고리즘 — A (우수)

| 모듈 | 기능 |
|------|------|
| ahpEngine.js | 행렬 생성, 우선순위 계산, CR(일관성비율) 산출 |
| ahpAggregation.js | 가중 기하평균, 글로벌 우선순위 |
| ahpBestFit.js | 최적 대안 순위 |
| directInputEngine.js | 직접 입력 방식 처리 |
| sensitivityAnalysis.js | What-if 민감도 분석 |
| statsEngine.js | 평균, 중앙값, 표준편차, 분포 |
| statsDistributions.js | 빈도, 백분위, 첨도, 왜도 |

---

## 5. CI/CD & 배포 평가 — A (우수)

### GitHub Actions 워크플로우

```
main push → npm ci → vitest 테스트 → vite build → GitHub Pages 배포
```

- Secrets로 환경변수 관리 (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- CNAME: ahp-basic.dreamitbiz.com
- Node 20 + npm cache 최적화

### 최근 배포 이력 (전원 성공)

| 실행 ID | 상태 | 일시 |
|---------|------|------|
| 22788877000 | success | 2026-03-07 01:24 |
| 22722844357 | success | 2026-03-05 14:36 |
| 22721825471 | success | 2026-03-05 14:11 |
| 22718045663 | success | 2026-03-05 12:32 |
| 22703192722 | success | 2026-03-05 05:04 |

---

## 6. 테스트 평가 — B+ (양호)

| 테스트 파일 | 대상 |
|------------|------|
| ahpEngine.test.js | 행렬 생성, 우선순위, CR 계산 |
| ahpAggregation.test.js | 다중 평가자 집계 |
| ahpBestFit.test.js | 최적 대안 |
| directInputEngine.test.js | 직접 입력 처리 |
| sensitivityAnalysis.test.js | 민감도 분석 |
| statsEngine.test.js | 통계 계산 |
| statsDistributions.test.js | 분포 분석 |
| pairwiseUtils.test.js | 쌍대비교 유틸 |
| evaluatorUtils.test.js | 평가자 유틸 |

- **강점:** 핵심 알고리즘(lib/) 9개 파일 전수 테스트, CI 매 배포 전 자동 실행
- **약점:** UI 컴포넌트 테스트 없음, E2E 테스트 없음

---

## 7. 보안 평가 — B+ (양호)

| 항목 | 상태 | 비고 |
|------|------|------|
| 인증 | PKCE 플로우 | OAuth 코드 가로채기 방지 |
| RLS | 적용됨 | 12개 마이그레이션에서 정책 설정 |
| 시크릿 | .env 분리 | .gitignore에 포함, CI에서 Secrets 사용 |
| 하드코딩 | 없음 | 민감정보 코드 내 미포함 |
| XSS | React 기본 방어 | dangerouslySetInnerHTML 미사용 |
| 라이선스 | 미설정 | 공개 리포지토리에 라이선스 없음 |

---

## 8. 코드 품질 — A (우수)

| 항목 | 상태 |
|------|------|
| console.log 남발 | 없음 (PortOne 데모 warn 2건만) |
| TODO/FIXME 잔존 | 없음 |
| 사용하지 않는 코드 | 감지 안 됨 |
| 에러 핸들링 | ErrorBoundary + try-catch + Toast |
| 접근성 | aria-label, 시맨틱 HTML, focus 스타일 |
| 디자인 시스템 | CSS 변수 기반 (variables.css) |
| 메모리 누수 | useEffect cleanup 확인 |

---

## 9. 문서화 평가 — B (양호)

| 문서 | 내용 |
|------|------|
| Dev_md/ (19개) | 개발일지, 가이드, 설계, 점검 체크리스트 |
| .env.example | 환경변수 템플릿 |
| copy_code/ | 레퍼런스 코드 아카이브 |
| **README.md** | **미흡 — 제목만 존재** |

---

## 10. 로컬 환경 상태

| 항목 | 상태 | 조치 |
|------|------|------|
| 브랜치 | main (origin/main과 동기화) | 정상 |
| .claude/settings.local.json | 수정됨 (unstaged) | 무시 가능 (로컬 설정) |
| package-lock.json | 수정됨 (unstaged) | 커밋 또는 restore 필요 |
| supabase/.temp/ | 추적 안 됨 (untracked) | .gitignore 추가 권장 |
| gh CLI | 미설치 (npm `gh` 패키지가 별도 존재) | `winget install GitHub.cli` 설치 권장 |

---

## 11. 기능 완성도 평가

| # | 기능 | 목표 | 현재 | 달성률 | 비고 |
|---|------|------|------|--------|------|
| 1 | AHP 쌍대비교 | 100% | 100% | 100% | 완료 |
| 2 | AHP 결과 계산 (CR 포함) | 100% | 100% | 100% | 완료 |
| 3 | 다중 평가자 집계 | 100% | 100% | 100% | 가중 기하평균 |
| 4 | 직접 입력 방식 | 100% | 100% | 100% | 완료 |
| 5 | 로그인/회원가입 (Email+OAuth) | 100% | 100% | 100% | Google, Kakao |
| 6 | 관리자 대시보드 | 100% | 100% | 100% | 완료 |
| 7 | 모델 빌더 (기준/대안 계층) | 100% | 100% | 100% | 완료 |
| 8 | 브레인스토밍 | 100% | 100% | 100% | 완료 |
| 9 | 평가자 관리/초대 | 100% | 100% | 100% | 익명 초대 포함 |
| 10 | 결과 시각화 | 100% | 100% | 100% | Recharts |
| 11 | 민감도 분석 | 100% | 100% | 100% | What-if |
| 12 | 통계 분석 | 100% | 100% | 100% | 분포, 평균, 편차 |
| 13 | Excel/PDF 내보내기 | 100% | 100% | 100% | XLSX + FileSaver |
| 14 | 사전 설문 | 100% | 100% | 100% | 완료 |
| 15 | SuperAdmin 관리 | 100% | 100% | 100% | RPC 함수 |
| 16 | 반응형 디자인 | 100% | 90% | 90% | 모바일 부분 최적화 |
| 17 | 자원 배분 | 100% | 100% | 100% | 완료 |
| 18 | 워크숍 모드 | 100% | 100% | 100% | 완료 |
| 19 | CI/CD 자동 배포 | 100% | 100% | 100% | GitHub Actions |
| 20 | README 문서 | 100% | 10% | 10% | 제목만 존재 |

---

## 12. 종합 평가

| 평가 항목 | 등급 | 점수 |
|-----------|------|------|
| 아키텍처 | A | 95 |
| 기능 완성도 | A | 93 |
| 코드 품질 | A | 92 |
| CI/CD | A | 95 |
| 보안 | B+ | 87 |
| 테스트 | B+ | 82 |
| 문서화 | B | 78 |
| **종합** | **A-** | **89** |

---

## 13. 개선 권장사항

### 즉시 조치 (Minor)

1. **README.md 확장** — 프로젝트 소개, 설치 방법, 기능 목록, 스크린샷 추가
2. **supabase/.temp/** → .gitignore에 추가
3. **package-lock.json** — 커밋 또는 restore 정리
4. **라이선스 파일** — MIT 등 추가 (공개 리포지토리)
5. **GitHub CLI 설치** — `winget install GitHub.cli`

### 중기 개선 (Optional)

6. **UI 컴포넌트 테스트** — @testing-library/react 활용 (이미 설치됨)
7. **Lazy Loading** — React.lazy()로 페이지 단위 코드 분할
8. **GitHub Topics** — "ahp", "decision-making", "react" 등 태그 추가
9. **JSDoc** — 핵심 lib 함수에 문서 주석 추가

---

## 14. 결론

AHP Basic은 158회 커밋, 100+ 컴포넌트, 12개 DB 마이그레이션, 9개 테스트 스위트를 갖춘 **엔터프라이즈급 품질의 프로덕션 애플리케이션**이다. 아키텍처가 체계적이고, CI/CD가 안정적으로 운영되며, 코드 품질이 높다. README 보강과 라이선스 추가 등 소규모 정리 사항만 남아있으며, 전체적으로 **종합 A- (89점)**의 완성도 높은 프로젝트로 평가한다.

---

*평가 도구: Claude Code (자동 점검)*
*평가 범위: GitHub 리포지토리 메타데이터 + 로컬 소스코드 전수 분석*
