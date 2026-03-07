# AHP Basic 종합 점검 보고서

## 점검 정보

| 항목 | 내용 |
|------|------|
| 점검일 | 2026-03-07 |
| 점검자 | Claude Code (자동 점검) |
| 점검 범위 | 로컬 코드 + GitHub 리포지토리 + 배포 사이트 전수 점검 |
| 점검 유형 | 코드 리뷰 / 기능 점검 / 보안 점검 / 성능 점검 / 접근성 점검 |
| 리포지토리 | https://github.com/aebonlee/ahp-basic |
| 배포 URL | https://ahp-basic.dreamitbiz.com |
| 로컬 경로 | D:\ahp_basic |

---

## 1. 프로젝트 현황 요약

| 지표 | 값 |
|------|-----|
| 총 커밋 | 159회 |
| 리포 크기 | 8,507 KB |
| 총 워크플로우 실행 | 159회 |
| 최근 5회 배포 | 전원 성공 ✓ |
| 최종 배포 | 2026-03-07 06:51:46 UTC |
| Open Issues / PRs | 0 / 0 |
| 페이지 수 | 30개 |
| 컴포넌트 수 | 70+ |
| 커스텀 훅 | 13개 |
| 테스트 파일 | 9개 |
| CSS 모듈 | 75+ |

---

## 2. 배포 사이트 점검

| 항목 | 상태 | 비고 |
|------|------|------|
| HTML 로드 | ✅ Pass | HTTP 200, 1,597 bytes |
| JS 번들 | ✅ Pass | `index-BE-PmnEg.js`, 393KB, HTTP 200 |
| CSS 번들 | ✅ Pass | `index-5nh2elaO.css`, 34KB, HTTP 200 |
| 외부 폰트 (Pretendard) | ✅ Pass | CDN 로드 성공, ~52KB |
| OG 이미지 | ✅ Pass | `og-image.png`, 60KB, HTTP 200 |
| CNAME 도메인 | ✅ Pass | ahp-basic.dreamitbiz.com 정상 |
| CDN/프록시 | ✅ Pass | Cloudflare + Fastly 경유 |
| **favicon.ico** | ❌ Fail | **HTTP 404** — 파비콘 파일 누락 |
| HTTPS | ✅ Pass | Cloudflare SSL 적용 |

---

## 3. 점검 항목 상세

### 3.1 코드 컨벤션 — ✅ Pass

| 항목 | 상태 |
|------|------|
| 파일 구조 (도메인별 분류) | 체계적 |
| 네이밍 (PascalCase 컴포넌트, camelCase 함수) | 일관됨 |
| CSS Modules 격리 | 전체 적용 |
| 디자인 시스템 (variables.css) | CSS 변수 기반 통일 |
| console.log 남발 | 없음 (PortOne 데모 warn 2건만) |
| TODO/FIXME 잔존 | 없음 |

### 3.2 기능 정상 동작 — ✅ Pass

| 기능 | 상태 |
|------|------|
| SPA 라우팅 (HashRouter) | 정상 |
| 코드 스플리팅 (React.lazy) | 적용됨 |
| 인증 (Email/Google/Kakao) | PKCE 적용 |
| 관리자/평가자 권한 분리 | Guard 컴포넌트 적용 |
| AHP 쌍대비교 | 정상 |
| 결과 계산 (CR 포함) | 정상 |
| 다중 평가자 집계 | 가중 기하평균 |
| Excel/PDF 내보내기 | 정상 |
| AI 분석도구 (4종) | 신규 추가, 동작 확인 |
| CI/CD 자동 배포 | GitHub Actions → Pages |

### 3.3 에러 처리 — ⚠️ Partial

| 항목 | 상태 | 파일 | 비고 |
|------|------|------|------|
| ErrorBoundary | ✅ | `App.jsx` | 전역 에러 경계 |
| Toast 알림 | ✅ | `ToastContext.jsx` | 사용자 피드백 |
| try-catch 패턴 | ✅ | 대부분의 async 함수 | |
| **signOut 에러 미처리** | ❌ | `AuthContext.jsx:151-155` | `authSignOut()` 실패 시 `SIGN_OUT` dispatch 미실행 |
| **resetPassword 불필요한 try-catch** | ⚠️ | `AuthContext.jsx:158-164` | catch 후 re-throw만 — 제거 가능 |
| **directRes.error 무시** | ⚠️ | `EvaluationContext.jsx:89-91` | 네트워크 에러도 함께 무시됨 |
| **Lazy 라우트별 ErrorBoundary 없음** | ⚠️ | `App.jsx` | 개별 페이지 에러 시 전체 앱 다운 |

### 3.4 반응형 디자인 — ✅ Pass

| 항목 | 상태 |
|------|------|
| 모바일 햄버거 메뉴 | 정상 (PublicNav.jsx) |
| 브레이크포인트 (1024/768/480px) | 3단계 적용 |
| 히어로 섹션 모바일 최적화 | 텍스트 축소, 장식 숨김 |
| 그리드 반응형 (features, stats) | 4→2→1열 변환 |
| CSS 애니메이션 모바일 감소 | 장식 orb 크기/투명도 조정 |

### 3.5 Supabase 연동 — ✅ Pass

| 항목 | 상태 |
|------|------|
| PKCE 인증 플로우 | 적용 |
| RLS 정책 | 12개 마이그레이션에서 설정 |
| 환경변수 분리 (.env) | .gitignore 포함 |
| CI Secrets 사용 | VITE_SUPABASE_URL, ANON_KEY |
| 하드코딩 키 | 없음 (URL fallback만 존재) |

### 3.6 보안 취약점 — ⚠️ 주의 필요

| # | 이슈 | 심각도 | 파일 | 라인 |
|---|------|--------|------|------|
| 1 | AI API 키 `localStorage` 평문 저장 | MEDIUM | `aiService.js` | 12-19 |
| 2 | `anthropic-dangerous-direct-browser-access` 헤더 사용 | MEDIUM | `aiService.js` | 137 |
| 3 | SSE 스트리밍 Abort 미지원 | MEDIUM | `aiService.js` | 196-225 |
| 4 | Bootstrap Admin 이메일 하드코딩 | LOW | `AuthContext.jsx` | 19 |
| 5 | Supabase URL 하드코딩 fallback | LOW | `supabaseClient.js` | 3 |

> **참고:** #1, #2는 클라이언트 직접 API 호출 방식의 본질적 한계. 로그아웃 시 `clearAllApiKeys()` 호출로 일부 완화됨.

---

## 4. 성능 점검

| # | 이슈 | 심각도 | 파일 | 설명 |
|---|------|--------|------|------|
| 1 | **`xlsx` 모듈 전체 import (400-500KB)** | HIGH | `exportUtils.js:1`, `statsExport.js:4` | 동적 import로 전환 필요 |
| 2 | async useEffect에 AbortController 미사용 | MEDIUM | 다수 페이지 | 언마운트 시 상태 업데이트 가능성 |
| 3 | SSE Reader 취소 불가 | MEDIUM | `aiService.js:196-225` | 페이지 이탈 시 계속 실행 |
| 4 | `cloneProject` 순차 DB 호출 | LOW | `ProjectContext.jsx:110-206` | 대안/설문 병렬 insert 가능 |
| 5 | JS 번들 크기 393KB | INFO | 빌드 출력 | 현재 수준 양호, xlsx 동적화 시 개선 |

---

## 5. 접근성(A11y) 점검

| # | 이슈 | 심각도 | 파일 | 설명 |
|---|------|--------|------|------|
| 1 | 로그인 에러 메시지 스크린리더 미연결 | MEDIUM | `LoginPage.jsx:62` | `role="alert"` 또는 `aria-live` 누락 |
| 2 | HomePage SVG에 `aria-hidden` 미적용 | MEDIUM | `HomePage.jsx:10-53` | 장식용 SVG 스크린리더 노출 |
| 3 | `<section>`에 `aria-label` 미적용 | LOW | `HomePage.jsx` | 구역 구분 불가 |
| 4 | PublicNav 접근성 | ✅ 양호 | `PublicNav.jsx` | aria-label, aria-expanded, aria-current 적용 |

---

## 6. 테스트 커버리지

### 테스트 있음 (9개 — 핵심 알고리즘 전수)

| 테스트 파일 | 대상 모듈 | 품질 |
|------------|-----------|------|
| `ahpEngine.test.js` | 행렬 생성, 우선순위, CR | Good |
| `ahpAggregation.test.js` | 다중 평가자 집계 | Good |
| `ahpBestFit.test.js` | 최적 대안 순위 | Good |
| `directInputEngine.test.js` | 직접 입력 처리 | Thorough |
| `sensitivityAnalysis.test.js` | 민감도 분석 | Good |
| `statsEngine.test.js` | 10종 통계 검정 | Good |
| `statsDistributions.test.js` | 분포 분석 | Good |
| `pairwiseUtils.test.js` | 쌍대비교 유틸 | Good |
| `evaluatorUtils.test.js` | 평가자 유틸 | Good |

### 테스트 없음 (갭)

| 모듈 | 위험도 | 사유 |
|------|--------|------|
| `aiService.js` | 높음 | 스트리밍/에러 처리 미검증 |
| `exportUtils.js` | 중간 | 재귀 함수 `getCriteriaGlobal` 미검증 |
| Context 파일 3개 | 중간 | `cloneProject` 등 비즈니스 로직 미검증 |
| 페이지/컴포넌트 | 낮음 | UI 테스트 미구현 (@testing-library/react 설치됨) |

---

## 7. Dead Code / 미사용 코드

| # | 항목 | 파일 | 라인 |
|---|------|------|------|
| 1 | `useState` import 미사용 | `HomePage.jsx` | 1 |
| 2 | `calculatePriorities`, `buildMatrix` import 미사용 | `sensitivityAnalysis.js` | 1 |
| 3 | `.heroGrid`, `.hierNode1-5`, `.scrollDown` 등 미사용 CSS 클래스 | `HomePage.module.css` | 100-350 |
| 4 | PortOne 유틸 (`portone.js`) — `@portone/browser-sdk` 패키지 미설치 | `utils/portone.js` | 전체 |

---

## 8. SEO 점검

| 항목 | 상태 | 비고 |
|------|------|------|
| `<html lang="ko">` | ✅ | 한국어 명시 |
| `<meta description>` | ✅ | 적절한 설명 |
| Open Graph 태그 | ✅ | title, description, image, type, url |
| Twitter Card 태그 | ❌ | `twitter:card` 등 누락 |
| `robots.txt` | ❌ | 미존재 |
| `sitemap.xml` | ❌ | 미존재 |
| HashRouter SEO 제약 | ⚠️ | `/#/` 기반 URL — 검색엔진 인덱싱 제한 |

---

## 9. 로컬 환경 상태

| 항목 | 상태 | 조치 필요 |
|------|------|----------|
| 브랜치 | main (origin/main 동기화) | 없음 |
| `supabase/.temp/` | untracked | .gitignore 추가 권장 |
| `gh` CLI | 미설치 | 선택 사항 |

---

## 10. 종합 평가

| 평가 영역 | 등급 | 점수 | 주요 소견 |
|-----------|------|------|-----------|
| 아키텍처 | A | 95 | 도메인별 분류, Context+Hooks, CSS Modules |
| 기능 완성도 | A | 93 | 30페이지, AHP 전 과정, AI 도구 4종 |
| CI/CD | A | 95 | GitHub Actions, 159회 실행, 최근 전원 성공 |
| 코드 품질 | A- | 90 | dead code 소량, 불필요 try-catch |
| 보안 | B+ | 85 | API키 평문 저장, 브라우저 직접 호출 |
| 성능 | B+ | 83 | xlsx 번들 비대, AbortController 미사용 |
| 접근성 | B | 78 | 일부 aria 속성 누락, 에러 알림 미연결 |
| 테스트 | B | 80 | 알고리즘 충실, UI/통합 테스트 없음 |
| SEO | B- | 72 | HashRouter 제약, robots/sitemap 없음 |
| 문서화 | B | 78 | Dev_md 충실, README 미흡 |
| **종합** | **A-** | **85** | |

---

## 11. 발견된 이슈 요약

| # | 이슈 | 심각도 | 카테고리 | 조치 상태 |
|---|------|--------|----------|----------|
| 1 | `xlsx` 전체 import → 번들 400KB+ 증가 | HIGH | 성능 | 미조치 |
| 2 | `favicon.ico` 404 에러 | MEDIUM | 배포 | 미조치 |
| 3 | AI API 키 localStorage 평문 저장 | MEDIUM | 보안 | 미조치 |
| 4 | SSE 스트리밍 Abort 미지원 | MEDIUM | 성능 | 미조치 |
| 5 | `signOut` 에러 시 상태 미정리 | MEDIUM | 에러처리 | 미조치 |
| 6 | 로그인 에러 스크린리더 미연결 | MEDIUM | 접근성 | 미조치 |
| 7 | async useEffect AbortController 미사용 | MEDIUM | 성능 | 미조치 |
| 8 | Twitter Card 메타 태그 누락 | LOW | SEO | 미조치 |
| 9 | robots.txt / sitemap.xml 없음 | LOW | SEO | 미조치 |
| 10 | 미사용 import/CSS 잔존 | LOW | 코드품질 | 미조치 |
| 11 | `supabase/.temp/` .gitignore 미추가 | LOW | 환경 | 미조치 |
| 12 | README.md 미흡 (제목만) | LOW | 문서 | 미조치 |
| 13 | 라이선스 파일 없음 | LOW | 문서 | 미조치 |

---

## 12. 개선 권장사항 (우선순위별)

### 🔴 즉시 조치 (HIGH)

#### 1. `xlsx` 동적 import 전환
```js
// Before (exportUtils.js)
import * as XLSX from 'xlsx';

// After
export async function exportToExcel(data) {
  const XLSX = await import('xlsx');
  // ... 기존 로직
}
```
번들 크기 ~400KB 절감 예상. `statsExport.js`도 동일 적용.

### 🟡 단기 조치 (MEDIUM — 1~2주)

#### 2. favicon.ico 추가
`public/favicon.ico` 파일 생성 → 배포 시 자동 포함

#### 3. signOut 에러 안전 처리
```js
const signOut = useCallback(async () => {
  clearAllApiKeys();
  try { await authSignOut(); } catch (e) { /* 무시 */ }
  finally { dispatch({ type: 'SIGN_OUT' }); }
}, []);
```

#### 4. SSE 스트리밍 AbortController 지원
`aiService.js`의 `readSSE()`에 `AbortSignal` 파라미터 추가 → 페이지 이탈 시 중단

#### 5. 로그인 에러 접근성 개선
```jsx
{error && <div className={styles.error} role="alert">{error}</div>}
```

#### 6. Twitter Card 메타 태그 추가
```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="AHP Basic - 의사결정 분석 도구" />
<meta name="twitter:image" content="https://ahp-basic.dreamitbiz.com/og-image.png" />
```

### 🟢 중기 개선 (OPTIONAL — 필요 시)

#### 7. 미사용 코드 정리
- `HomePage.jsx:1` — `useState` import 제거
- `sensitivityAnalysis.js:1` — 미사용 import 제거
- `HomePage.module.css` — 미사용 CSS 클래스 제거

#### 8. SEO 강화
- `public/robots.txt`, `public/sitemap.xml` 추가
- 공개 페이지에 대한 검색 엔진 최적화

#### 9. README.md 확장
- 프로젝트 소개, 기능 목록, 설치 방법, 스크린샷

#### 10. UI 컴포넌트 테스트 추가
- `@testing-library/react` (이미 설치됨) 활용
- 주요 페이지 스모크 테스트부터 시작

#### 11. 라우트별 ErrorBoundary 추가
- Lazy 로드 실패 시 개별 페이지만 에러 표시, 전체 앱은 유지

---

## 다음 점검 예정일

2026-03-14 (1주 후)

---

*점검 도구: Claude Code (자동 점검)*
*점검 범위: 로컬 소스코드 + GitHub 리포지토리 메타데이터 + 배포 사이트 HTTP 점검*
