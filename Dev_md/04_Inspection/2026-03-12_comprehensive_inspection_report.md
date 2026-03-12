# AHP Basic 프로젝트 종합 점검 보고서

**점검일:** 2026-03-12
**대상:** GitHub 리포지토리 (`aebonlee/ahp-basic`) + 로컬 디렉토리 (`D:\ahp_basic`)
**최신 커밋:** `877b763` (2026-03-11, fix: 배포 후 CSS 프리로드 오류 자동 새로고침 처리)

---

## 1. 리포지토리 개요

| 항목 | 값 |
|------|-----|
| URL | https://github.com/aebonlee/ahp-basic |
| 가시성 | Public |
| 기본 브랜치 | `main` |
| 브랜치 수 | 2개 (`main`, `gh-pages`) |
| 커밋 수 (main) | 271+ |
| 기여자 | 1명 (`aebonlee`) |
| 라이선스 | **없음** |
| Stars/Forks | 0 / 0 |
| Issues/PR | 0 / 0 (열린 것 없음) |
| Releases/Tags | **없음** |
| 생성일 | 2026-02-21 |
| 최종 푸시 | 2026-03-11 |

### 언어 비율
| 언어 | 바이트 | 비율 |
|------|--------|------|
| JavaScript | 935,879 | 64.0% |
| CSS | 327,859 | 22.4% |
| HTML | 138,515 | 9.5% |
| PLpgSQL | 31,470 | 2.2% |
| Java | 7,610 | 0.5% |
| TypeScript | 5,671 | 0.4% |

---

## 2. 기술 스택 & 인프라

| 카테고리 | 기술 |
|----------|------|
| 프론트엔드 | React 18 + Vite 5 SPA |
| 라우팅 | react-router-dom v6 (HashRouter) |
| 백엔드 | Supabase (Auth, DB, Edge Functions) |
| 결제 | PortOne SDK (CDN 외부 로드) |
| 차트 | Recharts v2 |
| 엑셀 | xlsx v0.18.5 (SheetJS) |
| QR코드 | qrcode.react v4 |
| 배포 | GitHub Pages + GitHub Actions |
| 도메인 | ahp-basic.dreamitbiz.com (CNAME) |
| 테스트 | Vitest + @testing-library/react |

---

## 3. 배포 파이프라인 상태

### GitHub Actions (`Deploy to GitHub Pages`)
- **워크플로우:** `.github/workflows/deploy.yml`
- **트리거:** `main` 브랜치 push
- **최근 10회 실행:** **전부 성공** ✓

| 실행일시 | 상태 |
|----------|------|
| 2026-03-11 08:56 | ✓ success |
| 2026-03-11 02:16 | ✓ success |
| 2026-03-11 02:07 | ✓ success |
| 2026-03-11 02:00 | ✓ success |
| 2026-03-11 01:53 | ✓ success |
| 2026-03-11 01:42 | ✓ success |
| 2026-03-10 18:28 | ✓ success |
| 2026-03-10 18:23 | ✓ success |
| 2026-03-10 18:20 | ✓ success |
| 2026-03-10 18:16 | ✓ success |

**빌드 프로세스:** `npm ci` → `npm run test` → `npm run build` → `deploy-pages`
**Secrets 사용:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

---

## 4. 파일 구조 분석

### 4.1 전체 규모 (GitHub 기준: 475개 파일)

| 디렉토리 | 파일 수 | 설명 |
|----------|---------|------|
| `src/components/` | ~80 | React 컴포넌트 (12개 하위 폴더) |
| `src/pages/` | ~38 | 페이지 컴포넌트 |
| `src/hooks/` | 15 | 커스텀 훅 |
| `src/lib/` | 20+ | 비즈니스 로직 & 유틸리티 |
| `src/contexts/` | 4 (커밋 기준) | Context 프로바이더 |
| `src/styles/` | 4 (커밋 기준) | 공통 스타일 |
| `src/utils/` | 4 (커밋 기준) | 유틸리티 함수 |
| `src/lib/__tests__/` | 9 | 단위 테스트 |
| `Dev_md/` | ~80 | 개발 문서 |
| `docs/` | ~20 | 프로젝트 문서 |
| `supabase/migrations/` | 17 | DB 마이그레이션 |
| `copy_code/` | ~15 | 원본 소스 참고자료 |
| `pdf/` | 2 | PDF 가이드 (3.1MB) |
| `icode/` | ~10 | SMS 레거시 코드 (Java/JSP) |

### 4.2 대용량 소스 파일 (주의 필요)

| 파일 | 크기 | 비고 |
|------|------|------|
| `src/lib/learnData.js` | 65,312B | 학습 콘텐츠 데이터 |
| `src/pages/SurveyBuilderPage.jsx` | 37,894B | 설문 빌더 (리팩토링 권장) |
| `src/pages/StatisticalAnalysisPage.jsx` | 37,540B | 통계분석 (리팩토링 권장) |
| `src/pages/ResourceAllocationPage.jsx` | 34,817B | 자원배분 |
| `src/pages/SurveyResultPage.jsx` | 34,091B | 설문결과 |
| `src/lib/statsEngine.js` | 32,399B | 통계 엔진 |
| `src/components/statistics/ResultRenderers.jsx` | 38,257B | 결과 렌더러 |
| `src/components/statistics/VariableSelector.jsx` | 24,908B | 변수 선택기 |

> 30KB 이상 파일이 8개 — 컴포넌트 분할 및 모듈화 권장

---

## 5. 로컬 미커밋 작업 현황

### 5.1 수정된 파일 (3개)

| 파일 | 변경 유형 | 내용 |
|------|-----------|------|
| `src/App.jsx` | 기능 추가 | CartProvider 래핑 + 장바구니/결제 라우트 4개 추가 |
| `src/components/layout/PublicNav.jsx` | 기능 추가 | useCart 훅 연결 + shop.css 임포트 |
| `src/pages/PricingPage.jsx` | 전면 리팩토링 | 직접결제 → 장바구니 기반 플로우로 변경 |

### 5.2 신규 파일 (7개) — 장바구니/결제 기능

| 파일 | 라인 수 | 역할 |
|------|---------|------|
| `src/contexts/CartContext.jsx` | 78 | 장바구니 Context (sessionStorage 영속) |
| `src/pages/CartPage.jsx` | 100 | 장바구니 페이지 |
| `src/pages/CheckoutPage.jsx` | 290 | 결제 페이지 (PortOne 연동) |
| `src/pages/OrderConfirmationPage.jsx` | 189 | 주문 확인 페이지 |
| `src/pages/OrderHistoryPage.jsx` | 201 | 주문 이력 페이지 (Protected) |
| `src/styles/shop.css` | 793 | 쇼핑 관련 전체 CSS |
| `src/utils/orderService.js` | 167 | 주문 CRUD 서비스 (Supabase) |

**플로우:** PricingPage → CartPage → CheckoutPage → OrderConfirmationPage
**이력 조회:** OrderHistoryPage (로그인 필수)

### 5.3 불필요한 파일 (루트 디렉토리)

| 파일 | 크기 | 조치 필요 |
|------|------|-----------|
| `gh.zip` | 13.2MB | **삭제 필요** — GitHub CLI 다운로드 파일 |
| `gh_cli.zip` | 13.2MB | **삭제 필요** — gh.zip과 동일 파일 |
| `nul` | 0B | **삭제 필요** — Windows NUL 리다이렉션 사고 파일 |

> 총 26.4MB의 불필요한 파일이 프로젝트 루트에 존재

---

## 6. 보안 점검

### 6.1 Critical — 없음

### 6.2 High

| # | 이슈 | 파일:라인 | 설명 |
|---|------|-----------|------|
| H-1 | 하드코딩된 관리자 이메일 | `AuthContext.jsx:19` | `BOOTSTRAP_ADMIN_EMAILS`에 개인 이메일 3개 하드코딩. 프로덕션 번들에 노출되며, 해당 이메일로 가입 시 클라이언트 측 관리자 권한 자동 부여 |

### 6.3 Medium

| # | 이슈 | 파일:라인 | 설명 |
|---|------|-----------|------|
| M-1 | Supabase URL 하드코딩 폴백 | `supabaseClient.js:3` | `.env` 미설정 시 실제 Supabase 인스턴스로 요청 전송 가능 |
| M-2 | 라이선스 미등록 | 리포지토리 전체 | Public 리포지토리이나 LICENSE 파일 없음 — 저작권 리스크 |

### 6.4 양호한 점
- `.env` 파일이 `.gitignore`에 포함됨 ✓
- `dangerouslySetInnerHTML` / `innerHTML` 사용 없음 ✓
- XSS 취약점 미발견 ✓
- GitHub Actions에서 Secrets로 환경변수 관리 ✓

---

## 7. 코드 품질 점검

### 7.1 에러 처리

| 심각도 | 이슈 | 위치 |
|--------|------|------|
| Medium | Supabase 배치 작업 에러 미처리 | `useCriteria.js:139`, `useAlternatives.js:96`, `useSurvey.js:82` |
| Medium | 프로젝트 복제 시 에러 미처리 | `ProjectContext.jsx:172,190` |
| Low | BrainstormingBoard 드래그&드롭 에러 미처리 | `BrainstormingBoard.jsx:102` |
| Good | Supabase RPC `.then(null, fn)` 패턴 준수 | `AuthContext.jsx:98` ✓ |

### 7.2 데드 코드

| 이슈 | 위치 | 설명 |
|------|------|------|
| `if (!supabase)` 분기 전체 | `orderService.js:10,61,87,137,154` | supabase 클라이언트는 항상 존재하므로 `_memoryOrders` 인메모리 폴백 코드 전체가 도달 불가 |

### 7.3 미사용 임포트

| 파일 | 미사용 항목 |
|------|------------|
| `useEvaluators.js:1` | `useRef` (임포트만 하고 사용 안 함) |
| `PublicNav.jsx:23` | `cartCount` (구조분해만 하고 JSX에서 미사용) |

### 7.4 코드 중복

| 중복 항목 | 파일들 |
|-----------|--------|
| `formatPrice()` 함수 | `CartPage.jsx:7`, `CheckoutPage.jsx:11`, `OrderConfirmationPage.jsx:9`, `OrderHistoryPage.jsx:10` (4곳) |
| `STATUS_LABELS`, `METHOD_LABELS` | `OrderConfirmationPage.jsx`, `OrderHistoryPage.jsx` (2곳) |

### 7.5 console 문 (프로덕션 코드)

총 **7개** — 모두 `console.error` 또는 `console.warn` (디버깅용 `console.log` 없음)
- `orderService.js:163`, `portone.js:37`, `ErrorBoundary.jsx:15`
- `CheckoutPage.jsx:126,150`, `OrderHistoryPage.jsx:43`, `OrderConfirmationPage.jsx:50`

### 7.6 TODO/FIXME/HACK
- 명시적 TODO 없음
- **암시적 TODO:** `AuthContext.jsx:18` — "마이그레이션 후 제거 가능" 주석 (BOOTSTRAP_ADMIN_EMAILS)

---

## 8. 의존성 점검

### 8.1 프로덕션 의존성 (7개)

| 패키지 | 버전 | 상태 |
|--------|------|------|
| `@supabase/supabase-js` | ^2.45.0 | ✓ 정상 |
| `react` | ^18.3.1 | ✓ 정상 |
| `react-dom` | ^18.3.1 | ✓ 정상 |
| `react-router-dom` | ^6.28.0 | ✓ 정상 |
| `recharts` | ^2.13.0 | ✓ 정상 |
| `qrcode.react` | ^4.2.0 | ✓ 정상 |
| `file-saver` | ^2.0.5 | ✓ 정상 |
| `xlsx` | ^0.18.5 | ⚠️ 사실상 deprecated (커뮤니티 에디션 최종 버전) |

### 8.2 개발 의존성 (5개)

| 패키지 | 버전 | 상태 |
|--------|------|------|
| `vite` | ^5.4.0 | ✓ 정상 |
| `@vitejs/plugin-react` | ^4.3.0 | ✓ 정상 |
| `vitest` | ^2.1.0 | ✓ 정상 |
| `@testing-library/react` | ^16.0.0 | ✓ 정상 |
| `jsdom` | ^25.0.0 | ✓ 정상 |

### 8.3 누락된 도구

| 카테고리 | 비고 |
|----------|------|
| ESLint | 린터 없음 — 미사용 임포트, 코딩 스타일 미검사 |
| Prettier | 포매터 없음 — 코드 스타일 불일치 가능 |
| `@portone/browser-sdk` | package.json에 없고 Vite external 처리 (CDN 로드) |

---

## 9. 빌드 & 배포 설정 점검

### vite.config.js

| 항목 | 설정 | 평가 |
|------|------|------|
| `base` | `'/'` | ✓ 커스텀 도메인 배포에 적합 |
| `external` | `@portone/browser-sdk/v2` | ✓ CDN 외부 로드 |
| `manualChunks` | react, supabase, charts 분리 | ✓ 번들 최적화 양호 |
| `test.environment` | `jsdom` | ✓ 테스트 환경 설정 양호 |

### .gitignore

| 항목 | 포함 여부 |
|------|-----------|
| `node_modules` | ✓ |
| `dist` | ✓ |
| `.env` / `.env.*` | ✓ |
| IDE 파일 | ✓ |
| OS 파일 | ✓ |
| `*.zip` | **미포함** ⚠️ |

---

## 10. 아키텍처 점검

### 10.1 ErrorBoundary 범위
- **현재:** 단일 ErrorBoundary가 전체 앱을 래핑
- **문제:** 한 페이지에서 렌더링 오류 시 전체 앱이 에러 화면 표시
- **권장:** 라우트별 또는 기능 영역별 세분화된 ErrorBoundary 추가

### 10.2 Context 중첩 구조
```
HashRouter > ErrorBoundary > AuthProvider > ProjectProvider > EvaluationProvider > ToastProvider > CartProvider
```
- 내부 Provider 초기화 오류 시 복구 불가 (retry 시 전체 재마운트)
- CartProvider가 가장 안쪽 — Toast 없이는 장바구니 알림 불가 (순서 OK)

### 10.3 Supabase 클라이언트 초기화
- `.env` 미설정 시 URL 폴백으로 실제 인스턴스 연결 + 빈 anon key → **조용한 실패**
- 시작 시 유효성 검증 없음

---

## 11. 테스트 현황

### 테스트 파일 (9개)

| 테스트 파일 | 대상 |
|------------|------|
| `ahpAggregation.test.js` | AHP 가중치 집계 |
| `ahpBestFit.test.js` | 최적합 일관성 |
| `ahpEngine.test.js` | AHP 핵심 엔진 |
| `directInputEngine.test.js` | 직접 입력 엔진 |
| `evaluatorUtils.test.js` | 평가자 유틸리티 |
| `pairwiseUtils.test.js` | 쌍대비교 유틸리티 |
| `sensitivityAnalysis.test.js` | 민감도 분석 |
| `statsDistributions.test.js` | 통계 분포 |
| `statsEngine.test.js` | 통계 엔진 |

**범위:** `src/lib/` 핵심 로직만 테스트 (9개)
**미테스트 영역:** 컴포넌트, 페이지, 훅, 컨텍스트, 유틸리티, 서비스 전체
**CI 통합:** ✓ GitHub Actions에서 `npm run test` 실행

---

## 12. 문서화 현황

| 디렉토리 | 파일 수 | 내용 |
|----------|---------|------|
| `Dev_md/01_Guide/` | 1 | 개발 가이드 |
| `Dev_md/02_Design/` | 1 | 디자인 시스템 |
| `Dev_md/03_DevLog/` | 30+ | 세션별 개발일지 |
| `Dev_md/04_Inspection/` | 7 | 점검 보고서 |
| `Dev_md/05_Evaluation/` | 2 | 평가 보고서 |
| `Dev_md/06_Reference/` | 4 | 참고자료 |
| `docs/` | 20+ | 프로젝트 문서 (개발일지, 평가보고서) |
| `README.md` | 1 | 프로젝트 소개 |

> 문서화 수준 양호. 단, `Dev_md/`와 `docs/`의 역할 분리가 불명확

---

## 13. 종합 평가

### 양호한 점 ✓
1. **CI/CD 안정성** — 최근 10회 배포 전부 성공, 자동화 완비
2. **보안 기본기** — .env 제외, XSS 미발견, Secrets 관리
3. **Supabase 패턴 준수** — `.then(null, fn)` 사용 (`.catch()` 회피)
4. **번들 최적화** — manualChunks로 벤더 코드 분리
5. **테스트 CI 통합** — 빌드 전 테스트 자동 실행
6. **풍부한 개발 문서** — 세션별 개발일지 + 점검/평가 보고서

### 개선 필요 사항

| 우선순위 | 항목 | 조치 |
|----------|------|------|
| **높음** | 루트 불필요 파일 정리 | `gh.zip`, `gh_cli.zip`, `nul` 삭제 + `.gitignore`에 `*.zip` 추가 |
| **높음** | 하드코딩 관리자 이메일 | `BOOTSTRAP_ADMIN_EMAILS`를 환경변수 또는 DB 기반으로 전환 |
| **높음** | 미커밋 작업 정리 | 장바구니/결제 기능 7개 파일 커밋 또는 브랜치 분리 |
| **중간** | 코드 중복 제거 | `formatPrice`, `STATUS_LABELS` 등을 공통 유틸로 추출 |
| **중간** | 데드 코드 제거 | `orderService.js`의 `_memoryOrders` 인메모리 폴백 제거 |
| **중간** | ESLint/Prettier 도입 | 미사용 임포트 자동 감지 + 코드 스타일 통일 |
| **중간** | 대형 컴포넌트 분할 | 30KB 이상 파일 8개 → 하위 컴포넌트로 분할 |
| **중간** | LICENSE 파일 추가 | Public 리포지토리에 라이선스 명시 필요 |
| **낮음** | ErrorBoundary 세분화 | 라우트별 ErrorBoundary 추가 |
| **낮음** | 테스트 커버리지 확대 | 컴포넌트/훅/컨텍스트 테스트 추가 |
| **낮음** | `xlsx` 패키지 대안 검토 | deprecated된 커뮤니티 에디션 → `exceljs` 등 검토 |
| **낮음** | 미사용 임포트 정리 | `useRef`(useEvaluators.js), `cartCount`(PublicNav.jsx) |

---

## 14. 미커밋 장바구니 기능 아키텍처 리뷰

현재 로컬에서 개발 중인 **장바구니/결제 기능**에 대한 추가 점검:

### 양호
- `sessionStorage` 기반 장바구니 영속성 (탭별 분리)
- PortOne 결제 연동 구조 적절
- Protected Route로 주문 이력 보호
- 반응형 CSS 구현 (768px 브레이크포인트)

### 개선 필요
| 항목 | 설명 |
|------|------|
| 데드 코드 | `orderService.js`의 `_memoryOrders` 인메모리 폴백 (supabase는 항상 존재) |
| `formatPrice` 중복 | 4개 파일에서 동일 함수 독립 정의 → `src/utils/formatters.js`로 통합 |
| `cartCount` 미사용 | `PublicNav.jsx`에서 import만 하고 뱃지 렌더링 미구현 |
| Supabase 테이블 | `orders`, `order_items` 테이블에 대한 마이그레이션 파일 미확인 |

---

*보고서 끝*
