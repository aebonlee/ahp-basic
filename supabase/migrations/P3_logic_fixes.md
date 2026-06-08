# P3 — BYPASSABLE / 로직 결함 함수 수정 방향

> 적용 금지(설계 메모). 실제 코드 수정은 별도 마이그레이션(045_…)에서 진행.
> P2(anon 회수)로는 막히지 않는 "로그인 사용자에 의한 우회"와 "anon 흐름의 PII 노출"을 다룸.

## 분류 요약 (A-1 본문 감사 결과)

| 함수 | 분류 | 핵심 결함 |
|------|------|----------|
| `activate_project_plan(uuid,text,uuid)` | UNGUARDED→로직 | `p_user_id` 인자, `auth.uid()` 미결합, 결제(주문) 미검증 |
| `get_user_plans(uuid)` | BYPASSABLE | `p_user_id` IDOR |
| `get_project_plan(uuid)` | BYPASSABLE | 프로젝트 소유 미확인 IDOR |
| `increment_sms_used(uuid,integer)` | BYPASSABLE | 프로젝트 소유 미확인 → 타 프로젝트 DoS |
| `activate_multi_plan(uuid,uuid)` | BYPASSABLE | `v_user_id<>p_user_id` 비교 = 호출자조작값끼리 비교(auth.uid 미결합) |
| `check_user_license(uuid,text)` | BYPASSABLE | `p_user_id` IDOR(boolean, 저영향) |
| `verify_evaluator_phone(uuid,text)` | PII/약한게이트 | anon에 이메일 반환, 레이트리밋 없음(2-인자 레거시) |
| `verify_evaluator_phone(uuid,text,text)` | PII/약한게이트 | `p_ip_hash`가 클라이언트 입력 → 레이트리밋 우회 |
| `get_marketplace_projects()` | PII누수 | `COALESCE(display_name, email)` → 소유자 이메일 anon 노출 |

---

## 1) 결제/플랜 함수: `p_user_id` 제거 → `auth.uid()` 내부 사용

`activate_project_plan`, `get_user_plans`, `grant_free_plan` 은 `p_user_id` 인자를 받지 말고
내부에서 `auth.uid()`를 사용하도록 시그니처/본문 변경.

```sql
-- 예: activate_project_plan
CREATE OR REPLACE FUNCTION public.activate_project_plan(p_plan_type text, p_order_id uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_max int; v_q int; v_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  -- ✅ 결제 검증: 주문이 호출자 소유 + paid 상태일 때만
  IF p_order_id IS NOT NULL AND NOT EXISTS (
       SELECT 1 FROM orders o WHERE o.id = p_order_id
         AND o.user_id = v_uid AND o.payment_status = 'paid') THEN
    RAISE EXCEPTION 'order not verified';
  END IF;
  CASE p_plan_type WHEN 'plan_30' THEN v_max:=30; v_q:=60; ... END CASE;
  INSERT INTO project_plans(user_id, plan_type, max_evaluators, sms_quota, order_id, status)
  VALUES (v_uid, p_plan_type, v_max, v_q, p_order_id, 'unassigned') RETURNING id INTO v_id;
  RETURN v_id;
END $$;
```

⚠️ **프론트 동반 수정 필요**: ahp-basic `src`에서 `.rpc('activate_project_plan', { p_user_id, ... })`
및 `get_user_plans`/`grant_free_plan` 호출부의 `p_user_id` 인자 제거.
(grep 결과: `get_user_plans` 22곳, `grant_free_plan` 22곳, `activate_project_plan` 1곳 참조)

## 2) `get_project_plan` / `increment_sms_used`: 프로젝트 소유 검증 추가

```sql
IF NOT public.is_project_owner(p_project_id) THEN   -- 041에 존재(소유자/superadmin)
  RAISE EXCEPTION 'not authorized';
END IF;
```
- `is_project_owner()`는 `auth.uid()` 기반이므로 SECURITY DEFINER 내부에서 호출 가능.
- `increment_sms_used`는 본래 SMS 발송 직후 호출 → 발송 주체(소유자) 검증과 일치.

## 3) `activate_multi_plan`: `p_user_id` 제거, `auth.uid()`로 소유 검증

`v_user_id <> p_user_id` 비교는 둘 다 호출자 값이라 무의미. `v_user_id <> auth.uid()` 로 교체.

## 4) `verify_evaluator_phone`: 이메일 미반환 + 서버측 레이트리밋

- 반환 컬럼에서 `email` 제거(평가자 식별엔 `id`,`name`이면 충분). 필요 시 마스킹(`a***@…`).
- 레이트리밋 키를 **클라이언트 `p_ip_hash`** 대신 서버 신뢰값으로:
  - 옵션 A: PostgREST가 전달하는 `request.headers`의 `x-forwarded-for`를
    `current_setting('request.headers', true)::json->>'x-forwarded-for'` 로 서버에서 추출.
  - 옵션 B: `p_project_id + 시도횟수`만으로 프로젝트 단위 글로벌 한도.
- **2-인자 레거시 오버로드 `verify_evaluator_phone(uuid,text)` 는 DROP** (레이트리밋 없이 이메일 노출).
  단, 프론트가 2-인자로 호출하지 않는지 확인(grep: 호출 1곳 → 3-인자 버전인지 점검).

## 5) `get_marketplace_projects`: 소유자 이메일 노출 제거

```sql
COALESCE(u.display_name, '연구자') AS owner_name   -- u.email 폴백 삭제
```
표시용 이름이 없으면 익명 표기. 이메일은 어떤 경우에도 anon 응답에 포함하지 않음.

## 6) `check_user_license`: `p_user_id` 제거 → `auth.uid()`

라이선스 보유 여부는 본인 것만 확인하면 충분. IDOR 제거. (저영향이나 정합성)

---

### 적용 순서 권고
P0 → P1 → P2 적용·검증 완료 후, 본 P3는 **프론트 호출부와 1:1로 짝지어** 별도 마이그레이션으로.
SECURITY DEFINER 시그니처 변경은 프론트 인자와 동시 배포해야 하므로 사이트별 회귀테스트 필수.
