# 장바구니/결제 기능 구현

**작성일:** 2026-03-12

## 개요

기존 PricingPage의 직접결제 모달 방식을 **장바구니 기반 이커머스 플로우**로 전면 전환.

## 구현 플로우

```
PricingPage (장바구니 담기)
  → CartPage (수량 조절/삭제)
    → CheckoutPage (주문자 정보 + PortOne 결제)
      → OrderConfirmationPage (주문 확인)

OrderHistoryPage (로그인 사용자 주문 이력 조회)
```

## 신규 파일

| 파일 | 역할 |
|------|------|
| `src/contexts/CartContext.jsx` | 장바구니 Context (sessionStorage 영속, addItem/removeItem/updateQuantity/clearCart) |
| `src/pages/CartPage.jsx` | 장바구니 표시 (아이템 목록 + 주문 요약 사이드바) |
| `src/pages/CheckoutPage.jsx` | 결제 페이지 (주문자 정보 자동채움, 카드/계좌이체, PortOne 연동) |
| `src/pages/OrderConfirmationPage.jsx` | 결제 완료 확인 (주문번호, 상태, 내역 표시) |
| `src/pages/OrderHistoryPage.jsx` | 주문 이력 (ProtectedRoute, 페이지네이션, 펼침식 상세) |
| `src/styles/shop.css` | 장바구니/결제/주문 전체 CSS (반응형 768px 브레이크포인트) |
| `src/utils/orderService.js` | 주문 CRUD 서비스 (Supabase orders/order_items 테이블 연동) |

## 수정 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/App.jsx` | CartProvider 래핑 + /cart, /checkout, /order-confirmation, /order-history 라우트 추가 |
| `src/components/layout/PublicNav.jsx` | useCart 훅 연결 + shop.css 임포트 |
| `src/pages/PricingPage.jsx` | 직접결제 모달 제거 → 장바구니 담기 버튼으로 전환 |

## 기술 상세

- **장바구니 저장:** sessionStorage (탭별 분리, 새로고침 유지)
- **결제 연동:** PortOne SDK (CARD / TRANSFER)
- **결제 검증:** Supabase Edge Function `verify-payment` → 실패 시 `updateOrderStatus` 폴백
- **주문자 자동채움:** Supabase Auth user + profile 데이터 활용
- **수량 제한:** 최소 1, 최대 99

## Supabase 테이블

- `orders`: 주문 마스터 (order_number, user_email, total_amount, payment_status 등)
- `order_items`: 주문 아이템 (order_id FK, product_title, quantity, unit_price, subtotal)
