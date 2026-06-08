-- 059: 2026-06-08 결제 파이프라인 + 보안 하드닝 통합 (046~058)
-- 전부 라이브에 이미 적용됨. repo 기록/재현용.
-- 주의: 054(get_project_plan)는 라이브 보류였음 - 재현 시 원치 않으면 해당 블록 제외.


-- ===== 046_activate_fix_param_p_order_id.sql =====
-- 046: activate_project_plan 인자 이름 p_order_number -> p_order_id 로 정렬
-- 원인: 045가 p_order_number 로 적용됨. 프론트는 p_order_id 로 호출 -> PostgREST 404.
-- CREATE OR REPLACE 로는 인자명 변경 불가 -> 기존 (uuid,text,text) DROP 후 재생성.
-- 로직/보안은 045와 동일 (order_number 로 조회, auth.uid()/소유/paid 검증).
begin;

drop function if exists public.activate_project_plan(uuid, text, text);

create function public.activate_project_plan(
  p_user_id uuid,
  p_plan_type text,
  p_order_id text default null   -- 프론트가 보내는 이름. 값은 orders.order_number.
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_caller uuid := auth.uid();
  v_max_eval int; v_sms_quota int; v_plan_id uuid; v_order record;
begin
  if v_caller is null then raise exception 'Authentication required'; end if;
  if p_user_id is distinct from v_caller then raise exception 'Cannot activate plan for another user'; end if;
  if p_order_id is null then raise exception 'Order required'; end if;

  select id, user_id, payment_status into v_order from orders where order_number = p_order_id;
  if not found then raise exception 'Order not found'; end if;
  if v_order.user_id is distinct from v_caller then raise exception 'Order not owned by caller'; end if;
  if v_order.payment_status <> 'paid' then raise exception 'Order not paid'; end if;

  case p_plan_type
    when 'plan_30'  then v_max_eval:=30;  v_sms_quota:=60;
    when 'plan_50'  then v_max_eval:=50;  v_sms_quota:=100;
    when 'plan_100' then v_max_eval:=100; v_sms_quota:=200;
    when 'plan_multi_100' then v_max_eval:=100; v_sms_quota:=200;
    when 'plan_multi_200' then v_max_eval:=200; v_sms_quota:=400;
    else raise exception 'Invalid plan type: %', p_plan_type;
  end case;

  insert into project_plans (user_id, plan_type, max_evaluators, sms_quota, order_id, status)
  values (v_caller, p_plan_type, v_max_eval, v_sms_quota, v_order.id, 'unassigned')
  returning id into v_plan_id;
  return v_plan_id;
end;
$function$;

revoke all on function public.activate_project_plan(uuid, text, text) from public;
revoke all on function public.activate_project_plan(uuid, text, text) from anon;
grant execute on function public.activate_project_plan(uuid, text, text) to authenticated;

commit;

-- ===== 047_fix_authusers_rls.sql =====
-- 047: order_items_select / orders_admin_update 의 auth.users 참조 제거
-- 원인: authenticated 롤은 auth.users 에 SELECT 권한이 없어 정책 평가 중 "permission denied for table users" -> 403.
-- 해결: 이메일 허용목록 검사를 auth.users 서브쿼리 -> auth.jwt()->>'email' 로 교체 (orders_select 와 동일 패턴).
begin;

-- 1) order_items 조회 (주문이력 embed/직접조회 403 해소)
drop policy if exists "order_items_select" on public.order_items;
create policy "order_items_select" on public.order_items
  for select to public
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (
          o.user_id = auth.uid()
          or exists (
            select 1 from public.user_profiles up
            where up.id = auth.uid() and up.role = any (array['admin','superadmin'])
          )
          or (auth.jwt() ->> 'email') = any (array['aebon@kakao.com','radical8566@gmail.com'])
        )
    )
  );

-- 2) orders 관리자 업데이트 (orders PATCH 403 해소)
drop policy if exists "orders_admin_update" on public.orders;
create policy "orders_admin_update" on public.orders
  for update to public
  using (
    exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid() and up.role = any (array['admin','superadmin'])
    )
    or (auth.jwt() ->> 'email') = any (array['aebon@kakao.com','radical8566@gmail.com'])
  );

commit;

-- ===== 048_orders_lock_client_update.sql =====
-- 048 (B-3): orders 클라이언트 UPDATE 전면 회수 (결제 위조 차단)
-- 문제: anon/authenticated 가 orders 에 table-wide UPDATE -> 사용자가 payment_status='paid',
--       total_amount, user_id 등을 임의 변경 가능 (결제 없이 plan 발급 가능).
-- 해결: 클라 롤의 UPDATE 회수. 결제 paid 기록은 Edge 함수(service_role)만 수행.
--       정상 결제 흐름은 service_role 이 처리하므로 영향 없음.
--       클라의 위조 fallback(updateOrderStatus)은 403 -> try/catch 로 흡수되어 무해.
begin;

revoke update on public.orders from anon;
revoke update on public.orders from authenticated;

commit;

-- ===== 049_user_profiles_grant_login_fields.sql =====
-- 049: user_profiles 로그인 추적 컬럼 UPDATE 허용 (로그인 시 403 해소)
-- P1(043) 컬럼락으로 self-editable 컬럼만 UPDATE 허용했는데, 앱이 로그인 시
-- last_login 류를 PATCH -> 비허용 컬럼이라 403.
-- 해결: 안전한 로그인 추적 컬럼만 추가 GRANT. 권한/요금/상태 등 민감 컬럼은 계속 잠금.
begin;

grant update (last_login_at, last_sign_in_at, last_active_at, visited_sites)
  on public.user_profiles to authenticated;

commit;

-- ===== 050_plan_prices_table.sql =====
-- 050: 서버 전용 가격표 (가격검증의 진실 원천)
-- 클라이언트는 접근 불가. SECURITY DEFINER 함수(activate_project_plan 등)가 owner 권한으로 읽음.
begin;

create table if not exists public.plan_prices (
  plan_type text primary key,
  price integer not null
);

insert into public.plan_prices (plan_type, price) values
  ('free', 0),
  ('plan_30', 30000),
  ('plan_50', 40000),
  ('plan_100', 50000),
  ('plan_multi_100', 70000),
  ('plan_multi_200', 100000)
on conflict (plan_type) do update set price = excluded.price;

-- 클라 접근 차단 (RLS on, 정책 없음 => 비-bypass 롤은 접근 0)
revoke all on table public.plan_prices from anon;
revoke all on table public.plan_prices from authenticated;
alter table public.plan_prices enable row level security;

commit;

-- ===== 051_activate_price_check.sql =====
-- 051: activate_project_plan 에 가격 무결성 검증 추가
-- 불변식: 플랜은 그 주문이 "가격표 정가 합계"를 실제로 결제했을 때만 발급.
-- order.total_amount(=Edge가 payment.amount 와 일치 검증한 값) 이 order_items 의
-- 가격표(plan_prices) 정가 합계와 같아야 함. 클라가 정한 unit_price 는 무시하고 정가로 계산.
create or replace function public.activate_project_plan(
  p_user_id uuid,
  p_plan_type text,
  p_order_id text default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_caller uuid := auth.uid();
  v_max_eval int; v_sms_quota int; v_plan_id uuid; v_order record;
  v_expected int;
begin
  if v_caller is null then raise exception 'Authentication required'; end if;
  if p_user_id is distinct from v_caller then raise exception 'Cannot activate plan for another user'; end if;
  if p_order_id is null then raise exception 'Order required'; end if;

  select id, user_id, payment_status, total_amount into v_order
    from orders where order_number = p_order_id;
  if not found then raise exception 'Order not found'; end if;
  if v_order.user_id is distinct from v_caller then raise exception 'Order not owned by caller'; end if;
  if v_order.payment_status <> 'paid' then raise exception 'Order not paid'; end if;

  -- 가격 무결성: 결제된 총액 == 주문 품목들의 가격표 정가 합계
  select coalesce(sum(pp.price * coalesce(oi.quantity, 1)), 0) into v_expected
    from order_items oi
    join plan_prices pp on pp.plan_type = oi.plan_type
    where oi.order_id = v_order.id;
  if v_order.total_amount is distinct from v_expected then
    raise exception 'Price integrity check failed: paid % expected %', v_order.total_amount, v_expected;
  end if;

  case p_plan_type
    when 'plan_30'  then v_max_eval:=30;  v_sms_quota:=60;
    when 'plan_50'  then v_max_eval:=50;  v_sms_quota:=100;
    when 'plan_100' then v_max_eval:=100; v_sms_quota:=200;
    when 'plan_multi_100' then v_max_eval:=100; v_sms_quota:=200;
    when 'plan_multi_200' then v_max_eval:=200; v_sms_quota:=400;
    else raise exception 'Invalid plan type: %', p_plan_type;
  end case;

  insert into project_plans (user_id, plan_type, max_evaluators, sms_quota, order_id, status)
  values (v_caller, p_plan_type, v_max_eval, v_sms_quota, v_order.id, 'unassigned')
  returning id into v_plan_id;
  return v_plan_id;
end;
$function$;

-- ===== 052_lock_grant_coupon_license.sql =====
-- 052: grant_coupon_license 즉시 잠금 (무단 라이선스 발급 차단)
-- 문제: 쿠폰 검증 없음 + auth.uid() 바인딩 없음 + anon 실행 가능
--       -> 누구나 아무 user_id 에 무료 라이선스 무한 발급 가능.
-- 조치: anon/authenticated/public 실행 회수 (service_role 만 유지).
--       제대로 된 쿠폰 검증 버전은 coupons 테이블 구조 확인 후 별도 재작성 필요.
begin;

revoke all on function public.grant_coupon_license(uuid, uuid, text, text) from public;
revoke all on function public.grant_coupon_license(uuid, uuid, text, text) from anon;
revoke all on function public.grant_coupon_license(uuid, uuid, text, text) from authenticated;

commit;

-- ===== 053_get_user_plans_idor.sql =====
-- 053: get_user_plans IDOR 차단 + search_path 고정
-- 문제: auth.uid() 바인딩 없음 -> 로그인자가 남의 user_id 로 남의 플랜 조회/만료처리.
-- 해결: 호출자 인증 필수 + (self 또는 admin/superadmin) 만 허용. search_path=public 고정.
create or replace function public.get_user_plans(p_user_id uuid)
returns json
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_plans json;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if p_user_id is distinct from auth.uid()
     and not exists (
       select 1 from user_profiles up
       where up.id = auth.uid() and up.role = any (array['admin','superadmin'])
     )
  then
    raise exception 'Forbidden: cannot read another user''s plans';
  end if;

  update project_plans
  set status = 'expired'
  where user_id = p_user_id
    and status = 'active'
    and plan_type != 'free'
    and expires_at is not null
    and expires_at <= now();

  select json_agg(row_to_json(pp)) into v_plans
  from (
    select id, user_id, project_id, plan_type, max_evaluators,
           sms_quota, sms_used, order_id, purchased_at,
           assigned_at, expires_at, status
    from project_plans
    where user_id = p_user_id
    order by created_at desc
  ) pp;
  return coalesce(v_plans, '[]'::json);
end;
$function$;

-- ===== 054_get_project_plan_idor.sql =====
-- 054: get_project_plan IDOR 차단 + search_path 고정
-- 문제: project_id 만으로 소유자 user_id/order_id/sms 사용량 노출 (소유검증 없음).
-- 해결: 호출자가 플랜 소유자(또는 admin/superadmin)일 때만 반환.
-- ⚠️ 주의: 평가자(evaluator) 흐름이 이 함수를 호출한다면 평가가 막힐 수 있음.
--         적용 후 평가 페이지를 비-소유 계정으로 점검할 것.
create or replace function public.get_project_plan(p_project_id uuid)
returns json
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_plan project_plans%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into v_plan
  from project_plans
  where project_id = p_project_id and status in ('active','expired')
  order by assigned_at desc limit 1;

  if v_plan.id is null then
    select * into v_plan
    from project_plans
    where project_id = p_project_id and plan_type = 'free'
    order by created_at desc limit 1;
    if v_plan.id is null then
      return null;
    end if;
  end if;

  -- 소유 검증 (self 또는 admin)
  if v_plan.user_id is distinct from auth.uid()
     and not exists (
       select 1 from user_profiles up
       where up.id = auth.uid() and up.role = any (array['admin','superadmin'])
     )
  then
    raise exception 'Forbidden: not your project plan';
  end if;

  -- 만료 자동 처리 (유료만)
  if v_plan.plan_type != 'free'
     and v_plan.expires_at is not null
     and v_plan.expires_at <= now()
     and v_plan.status = 'active' then
    update project_plans set status = 'expired' where id = v_plan.id;
    v_plan.status := 'expired';
  end if;

  return json_build_object(
    'id', v_plan.id, 'user_id', v_plan.user_id, 'project_id', v_plan.project_id,
    'plan_type', v_plan.plan_type, 'max_evaluators', v_plan.max_evaluators,
    'sms_quota', v_plan.sms_quota, 'sms_used', v_plan.sms_used, 'order_id', v_plan.order_id,
    'purchased_at', v_plan.purchased_at, 'assigned_at', v_plan.assigned_at,
    'expires_at', v_plan.expires_at, 'status', v_plan.status
  );
end;
$function$;

-- ===== 055_increment_sms_used_idor.sql =====
-- 055: increment_sms_used IDOR 차단 + search_path 고정
-- 문제: 소유검증 없음 -> 아무나 남의 project_id 로 SMS 사용량 증가(quota 소진 공격).
-- 해결: 인증 필수 + 플랜 소유자(또는 admin)만 증가 허용.
create or replace function public.increment_sms_used(p_project_id uuid, p_count integer default 1)
returns json
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_plan project_plans%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into v_plan
  from project_plans
  where project_id = p_project_id and status = 'active'
  order by assigned_at desc limit 1;
  if v_plan.id is null then
    select * into v_plan
    from project_plans
    where project_id = p_project_id and plan_type = 'free'
    limit 1;
  end if;
  if v_plan.id is null then
    raise exception 'No active plan for this project';
  end if;

  -- 소유 검증 (self 또는 admin)
  if v_plan.user_id is distinct from auth.uid()
     and not exists (
       select 1 from user_profiles up
       where up.id = auth.uid() and up.role = any (array['admin','superadmin'])
     )
  then
    raise exception 'Forbidden: not your project plan';
  end if;

  if (v_plan.sms_used + p_count) > v_plan.sms_quota then
    return json_build_object('success', false, 'error', 'SMS quota exceeded',
      'sms_used', v_plan.sms_used, 'sms_quota', v_plan.sms_quota);
  end if;

  update project_plans set sms_used = sms_used + p_count where id = v_plan.id;
  return json_build_object('success', true,
    'sms_used', v_plan.sms_used + p_count, 'sms_quota', v_plan.sms_quota);
end;
$function$;

-- ===== 056_check_user_license_idor.sql =====
-- 056: check_user_license IDOR 차단 (조건부 바인딩) + anon 회수 + search_path
-- 문제: anon 포함 누구나 남의 user_id 라이선스 보유여부 조회 (정보유출).
-- 해결: 로그인 클라 호출은 본인/admin 만. 서버(service_role, auth.uid()=null)는 통과(신뢰).
--       anon 실행 회수.
-- ⚠️ blast radius: 6개 허브 공유 함수. 적용 후 각 허브 라이선스 게이트 점검 권장.
begin;

create or replace function public.check_user_license(p_user_id uuid, p_site_slug text)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  has_license boolean := false;
  today date := current_date;
begin
  -- IDOR 차단: 로그인 클라 호출은 본인 또는 admin 만. service_role(서버)은 auth.uid() null -> 통과.
  if auth.uid() is not null
     and p_user_id is distinct from auth.uid()
     and not exists (
       select 1 from user_profiles up
       where up.id = auth.uid() and up.role = any (array['admin','superadmin'])
     )
  then
    raise exception 'Forbidden: cannot check another user''s license';
  end if;

  select exists(
    select 1 from user_licenses
    where user_id = p_user_id
      and (license_type = 'bundle' or site_slug = p_site_slug)
  ) into has_license;
  if has_license then return true; end if;

  select exists(select 1 from ah_coupon_uses cu join ah_coupons c on c.id=cu.coupon_id
    where cu.user_id=p_user_id and c.is_active=true and c.expires_at>=today) into has_license;
  if has_license then return true; end if;

  select exists(select 1 from biz_coupon_uses cu join biz_coupons c on c.id=cu.coupon_id
    where cu.user_id=p_user_id and c.is_active=true and c.expires_at>=today) into has_license;
  if has_license then return true; end if;

  select exists(select 1 from csh_coupon_uses cu join csh_coupons c on c.id=cu.coupon_id
    where cu.user_id=p_user_id and c.is_active=true and c.expires_at>=today) into has_license;
  if has_license then return true; end if;

  select exists(select 1 from bsh_coupon_uses cu join bsh_coupons c on c.id=cu.coupon_id
    where cu.user_id=p_user_id and c.is_active=true and c.expires_at>=today) into has_license;
  if has_license then return true; end if;

  select exists(select 1 from exh_coupon_uses cu join exh_coupons c on c.id=cu.coupon_id
    where cu.user_id=p_user_id and c.is_active=true and c.expires_at>=today) into has_license;
  if has_license then return true; end if;

  select exists(select 1 from crh_coupon_uses cu join crh_coupons c on c.id=cu.coupon_id
    where cu.user_id=p_user_id and c.is_active=true and c.expires_at>=today) into has_license;
  if has_license then return true; end if;

  return false;
end;
$function$;

revoke all on function public.check_user_license(uuid, text) from anon;

commit;

-- ===== 057_marketplace_hide_email.sql =====
-- 057: get_marketplace_projects 에서 owner email 노출 제거
-- 문제: owner_name = COALESCE(display_name, email, '연구자') -> display_name 없으면
--       비로그인자에게 연구자 이메일 노출 (PII 유출).
-- 해결: email fallback 제거. display_name 없으면 '연구자' 로만 표기.
-- (마켓플레이스 anon 공개는 설계상 유지, 반환 시그니처 동일.)
create or replace function public.get_marketplace_projects()
returns table(id uuid, name text, description text, eval_method integer,
              reward_points integer, recruit_description text, owner_name text,
              evaluator_count bigint, created_at timestamp with time zone)
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
begin
  return query
  select
    p.id, p.name, p.description, p.eval_method, p.reward_points, p.recruit_description,
    coalesce(u.display_name, '연구자') as owner_name,
    (select count(*) from evaluators e where e.project_id = p.id) as evaluator_count,
    p.created_at
  from projects p
  left join user_profiles u on u.id = p.owner_id
  where p.recruit_evaluators = true
    and p.status = 1
  order by p.created_at desc;
end;
$function$;

-- ===== 058_lock_verify_phone_2arg.sql =====
-- 058: verify_evaluator_phone 2-인자(rate-limit 없는) 오버로드 잠금
-- 문제: 2-인자 버전은 check_rate_limit 없이 평가자 id/name/email 반환 -> brute-force 우회로.
--       프론트는 3-인자(ip_hash, rate-limit 적용)만 사용하므로 2-인자는 클라가 쓸 필요 없음.
-- 조치: 2-인자 버전 anon/authenticated/public 실행 회수 (service_role 유지). 3-인자는 그대로.
begin;

revoke all on function public.verify_evaluator_phone(uuid, text) from public;
revoke all on function public.verify_evaluator_phone(uuid, text) from anon;
revoke all on function public.verify_evaluator_phone(uuid, text) from authenticated;

commit;
