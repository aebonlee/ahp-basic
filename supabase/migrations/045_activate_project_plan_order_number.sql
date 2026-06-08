-- 045: activate_project_plan 을 order_number(text) 기준으로 재생성
-- 기존: p_order_id uuid (프론트가 order_number 문자열을 넘겨 uuid 캐스트 400)
-- 변경: p_order_number text 로 받아 orders.order_number 로 조회. INSERT 의 order_id 엔 조회한 v_order.id(uuid) 사용.
-- 보안: auth.uid() 필수 + 호출자==p_user_id + 주문 소유 + payment_status='paid' 검증 유지.
begin;

drop function if exists public.activate_project_plan(uuid, text, uuid);

create or replace function public.activate_project_plan(
  p_user_id uuid,
  p_plan_type text,
  p_order_number text default null
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
  if p_order_number is null then raise exception 'Order required'; end if;

  select id, user_id, payment_status into v_order from orders where order_number = p_order_number;
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

-- P2 하드닝 유지: anon/public 차단, authenticated 만 실행
revoke all on function public.activate_project_plan(uuid, text, text) from public;
revoke all on function public.activate_project_plan(uuid, text, text) from anon;
grant execute on function public.activate_project_plan(uuid, text, text) to authenticated;

commit;
