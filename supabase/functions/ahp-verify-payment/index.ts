// supabase/functions/ahp-verify-payment/index.ts
// AHP 전용 PortOne(V1) 결제검증 — orders 테이블, {paymentId, orderId} 입력
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = [
  'https://ahp-basic.dreamitbiz.com',
  'http://localhost:5173',
  'http://localhost:4173',
];

function getCorsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

const rateLimitMap = new Map();
function checkRateLimit(ip, limit = 10, windowMs = 60000) {
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
    const { paymentId, orderId } = await req.json();
    if (!paymentId || !orderId) {
      return new Response(JSON.stringify({ error: 'paymentId and orderId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, total_amount, payment_status')
      .eq('id', orderId)
      .single();
    if (orderErr || !order) {
      return new Response(JSON.stringify({ verified: false, error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (order.payment_status === 'paid') {
      return new Response(JSON.stringify({ verified: true, status: 'paid', alreadyPaid: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

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

    const payRes = await fetch(`https://api.iamport.kr/payments/${paymentId}`, {
      headers: { Authorization: accessToken },
    });
    const payData = await payRes.json();
    if (payData.code !== 0) throw new Error('PortOne payment lookup failed');
    const payment = payData.response;

    const amountOk = payment.amount === order.total_amount;
    const statusOk = payment.status === 'paid';

    if (!statusOk || !amountOk) {
      if (statusOk && !amountOk) {
        await fetch('https://api.iamport.kr/payments/cancel', {
          method: 'POST',
          headers: { Authorization: accessToken, 'Content-Type': 'application/json' },
          body: JSON.stringify({ imp_uid: paymentId, reason: '결제 금액 불일치 (위변조 의심)' }),
        });
      }
      await supabase.from('orders').update({ payment_status: 'failed' }).eq('id', orderId);
      return new Response(
        JSON.stringify({ verified: false, error: statusOk ? '결제 금액 불일치' : '미결제 상태' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

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
    return new Response(JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
