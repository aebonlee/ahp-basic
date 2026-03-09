# 사용요금 안내 페이지 + 카드결제 연동

## 날짜
2026-03-09

## 개요
사용요금 안내 페이지(`/pricing`)를 신규 추가하고, 기존 PortOne V2 결제 유틸리티를 활용한 카드결제 기능을 통합했다.

## 변경 파일

### 신규
- `src/pages/PricingPage.jsx` — 요금제 카드 + 비교표 + FAQ + 결제 모달
- `src/pages/PricingPage.module.css` — 전체 스타일 (반응형 포함)

### 수정
- `src/App.jsx` — `/pricing` 라우트 추가, PricingPage lazy import
- `src/components/layout/PublicNav.jsx` — NAV_LINKS에 "사용요금" 메뉴 추가
- `vite.config.js` — `@portone/browser-sdk/v2`를 rollupOptions.external에 추가 (미설치 패키지 빌드 오류 해결)

## 주요 기능

### 요금제 카드 (3종)
| 항목 | Free | Basic | Pro |
|---|---|---|---|
| 가격 | 무료 | ₩29,000/월 | ₩59,000/월 |
| 프로젝트 수 | 1개 | 5개 | 무제한 |
| 평가자 수 | 5명 | 20명 | 무제한 |
| 통계 분석 | 기본 | 전체 | 전체 + AI |
| SMS 발송 | X | 50건/월 | 200건/월 |
| 결과 내보내기 | X | Excel | Excel + PDF |
| 민감도 분석 | X | O | O |
| AI 분석 | X | X | O |

### 결제 흐름
1. Free "시작하기" → 회원가입 페이지 이동
2. Basic/Pro "구독하기" → 로그인 확인 → 결제 확인 모달
3. 결제 확인 모달에서 "결제하기" → `requestPayment()` 호출 (PortOne V2)
4. 데모 모드(STORE_ID/CHANNEL_KEY 미설정) → 가짜 성공 반환
5. 결제 성공 → 토스트 + 대시보드 이동 / 실패 → 오류 토스트

### 기능 비교표
- 8개 항목에 대한 3개 요금제 비교 테이블
- Pro 컬럼 하이라이트

### FAQ 아코디언
- 6개 자주 묻는 질문 (토글 동작)
- 결제, 환불, 데이터 보관, SMS 초과 등

### CTA 섹션
- "지금 시작하세요" — 그라데이션 배경, 회원가입 링크

### 반응형
- 768px 이하: 카드 1열, 테이블 가로 스크롤

## 기술 스택
- PortOne V2 SDK (`src/utils/portone.js`의 `requestPayment()`, `generateOrderNumber()`)
- ToastContext (`useToast()`) — 결제 결과 알림
- useAuth — 로그인 상태 확인
- CSS Modules — 기존 FeaturesPage/HomePage 패턴 재사용
