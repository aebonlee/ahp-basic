// supabase/functions/ahp-verify-payment/index.ts
// AHP 전용 PortOne(V1) 결제검증 — orders 테이블, {paymentId, orderId} 입력
// 금액은 DB의 total_amount 기준으로 대조(클라이언트 값 신뢰 X), 통과 시 service_role로 paid 설정.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = [
  'https://ahp-basic.dreamitbiz.com',
  'http://localhost:5173',
  'http://localhost:4173',
];

function getCorsHeaders(origin: string) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string, limit = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const e = rateLimitMap.get(ip);
  if (!e || e.resetAt < now) { rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs }); return true; }
  if (e.count >= limit) return false;
  e.count++; return true;
}

serve(async (req) => {
  const origin = req.headers.get('origin') || '';
  const corsHeaders = getCorsHeaders(origin);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  if (!checkRateLimit(ip)) {
    return new Response(JSON.stringify({ error: 'Too many requests' }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    // 프론트(orderService.verifyPayment)가 보내는 형식: { paymentId(=imp_uid), orderId(=orders.id) }
    const { paymentId, orderId } = await req.json();
    if (!paymentId || !orderId) {
      return new Response(JSON.stringify({ error: 'paymentId and orderId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1) 주문을 서버에서 조회 — 금액의 신뢰 원천은 클라이언트가 아니라 DB
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, total_amount, payment_status')
      .eq('id', orderId)
      .single();
    if (orderErr || !order) {
      return new Response(JSON.stringify({ verified: false, error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 멱등: 이미 paid면 재검증 생략
    if (order.payment_status === 'paid') {
      return new Response(JSON.stringify({ verified: true, status: 'paid', alreadyPaid: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2) PortOne 액세스 토큰
    const tokenRes = await fetch('https://api.iamport.kr/users/getToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imp_key: Deno.env.get('PORTONE_API_KEY'),
        imp_secret: Deno.env.get('PORTONE_API_SECRET'),
      }),
    });
    const tokenData = await tokenRes.json();
    if (tokenData.code !== 0) throw new Error('PortOne token failed');
    const accessToken = tokenData.response.access_token;

    // 3) 실제 결제 정보 조회
    const payRes = await fetch(`https://api.iamport.kr/payments/${paymentId}`, {
      headers: { Authorization: accessToken },
    });
    const payData = await payRes.json();
    if (payData.code !== 0) throw new Error('PortOne payment lookup failed');
    const payment = payData.response;

    // 4) 검증: 상태 paid + 금액이 DB total_amount와 일치
    const amountOk = payment.amount === order.total_amount;
    const statusOk = payment.status === 'paid';

    if (!statusOk || !amountOk) {
      // 결제는 됐는데 금액이 다르면 = 위변조 → PortOne 결제 취소
      if (statusOk && !amountOk) {
        await fetch('https://api.iamport.kr/payments/cancel', {
          method: 'POST',
          headers: { Authorization: accessToken, 'Content-Type': 'application/json' },
          body: JSON.stringify({ imp_uid: paymentId, reason: '결제 금액 불일치 (위변조 의심)' }),
        });
      }
      await supabase.from('orders')
        .update({ payment_status: 'failed' })
        .eq('id', orderId);
      return new Response(
        JSON.stringify({ verified: false, error: statusOk ? '결제 금액 불일치' : '미결제 상태' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 5) 검증 통과 → service_role로 paid 설정 (클라이언트는 이 컬럼을 못 쓰게 됨 — Part B-3)
    const { error: updErr } = await supabase.from('orders').update({
      payment_status: 'paid',
      portone_payment_id: paymentId,
      paid_at: new Date().toISOString(),
    }).eq('id', orderId);
    if (updErr) throw new Error('Order update failed');

    return new Response(
      JSON.stringify({ verified: true, status: 'paid', amount: payment.amount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
