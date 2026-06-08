# AHP 결제 파이프라인 + 보안 세션 로그 (2026-06-08)

프로젝트: ahp-basic.dreamitbiz.com / Supabase ref hcmgdztsgjvzcyxyayaj (공유 ~70 사이트)
적용 방식: Supabase 대시보드 + SQL Editor (브라우저). CLI 미사용 → repo 마이그레이션 파일은 별도 동기화 필요.

## ✅ 라이브 적용 + 검증 완료

### 결제 파이프라인 (결제→검증→paid→플랜→품목→이력)
- ahp-verify-payment (Edge): PortOne V1 Secret 교체 + order_number 로 조회/기록 (지난 세션)
- **046** activate_project_plan 인자 p_order_id 정렬 → 결제 후 플랜 자동생성 (404 해소)
- **order_items + plan_type 컬럼** (ALTER) → 주문 품목 저장 (400 해소)
- **047** order_items_select / orders_admin_update 의 auth.users 제거 → 주문이력/품목 조회 (403 해소)
- **049** user_profiles 로그인 추적컬럼(last_login_at 등) UPDATE 허용 → 로그인 (403 해소)
- 검증: 신규 결제 W3MTY7(plan_30)/HRUU1L(plan_50) 전 구간 자동 작동 확인

### 결제 보안
- **048** orders 클라(anon/authenticated) UPDATE 전면 회수 → payment_status 위조 차단
- **050** plan_prices 서버 가격표 생성(클라 차단)
- **051** activate_project_plan 가격 무결성 검증 → total_amount == 가격표 정가합계 아니면 거부 (싸게사기 차단)
- 검증: 위조(paid 100원) 시 'Price integrity check failed' 거부 확인

### 함수 보안 (IDOR / 노출)
- **052** grant_coupon_license anon/authenticated 회수 → 무단 라이선스 발급 차단
- **053** get_user_plans → auth.uid() self/admin 바인딩 (IDOR 차단, 검증완료)
- **055** increment_sms_used → self/admin 바인딩 (쓰기 IDOR 차단, 검증완료)
- **057** get_marketplace_projects → owner email fallback 제거 (anon PII 노출 차단)
- **058** verify_evaluator_phone 2-인자(rate-limit 없는) 오버로드 anon/auth 회수 → brute-force 우회로 차단
  (3-인자 ip_hash 버전은 프론트가 사용, rate-limit 적용됨)
- 기타: 노출된 sbp_ Supabase 액세스 토큰(mac_06) 폐기

## ⏳ 적용 대기 (테스트 후)
- **054** get_project_plan IDOR (self/admin 바인딩) — ⚠️ 평가자 흐름이 호출하는지 점검 후 적용
- **056** check_user_license IDOR (조건부 바인딩 + anon 회수) — ⚠️ 6개 허브 라이선스 게이트 점검 후 적용

## 🔜 다음 세션 (우선순위)
1. 054 / 056 적용 + 영향 테스트
2. grant_coupon_license 제대로 재작성 (coupons 테이블 검증; 현재는 잠금만)
3. verify_evaluator_phone rate-limit 서버측 IP 기반으로 강화 (현재 ip_hash 클라공급 → 스푸핑 가능)
4. cnu_* 타 테넌트 테이블 auth.users RLS 정리
5. (출시 직전) 라이브 PG채널 INIpayTest → html5_inicis.MOIkorcom1 교체 + 재배포
6. B-2b: CheckoutPage 클라 updateOrderStatus('paid') 죽은 fallback 제거 (재배포)
7. repo 커밋 + 045~058 마이그레이션 파일 동기화 (.env / sbp_ 토큰 스테이징 금지)
8. 테스트 데이터 정리: pending 주문 6건, 테스트 주문/플랜(X02A83 등)

## 데이터 메모
- X02A83: total 100000 인데 plan_30 (지난 세션 수동 백필 테스트 아티팩트)
- W3MTY7/IHYM25: plan 있으나 order_items 없음 (ALTER 이전 결제)
- 정상 풀체인 예시: HRUU1L (paid 40000 / plan_50 / item plan_50 40000)
