import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = [
  'https://allthat.dreamitbiz.com',
  'http://localhost:5173',
  'http://localhost:4173',
];

function getCorsHeaders(origin: string) {
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string, limit = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

serve(async (req) => {
  const origin = req.headers.get('origin') || '';
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  if (!checkRateLimit(ip, 10, 60000)) {
    return new Response(
      JSON.stringify({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { imp_uid, merchant_uid, expected_amount } = await req.json();

    if (!imp_uid || !merchant_uid) {
      return new Response(
        JSON.stringify({ error: 'imp_uid and merchant_uid are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PortOne 액세스 토큰 발급
    const tokenRes = await fetch('https://api.iamport.kr/users/getToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imp_key: Deno.env.get('PORTONE_API_KEY'),
        imp_secret: Deno.env.get('PORTONE_API_SECRET'),
      }),
    });
    const tokenData = await tokenRes.json();
    if (tokenData.code !== 0) {
      throw new Error('PortOne 토큰 발급 실패');
    }
    const accessToken = tokenData.response.access_token;

    // 결제 정보 조회
    const paymentRes = await fetch(`https://api.iamport.kr/payments/${imp_uid}`, {
      headers: { Authorization: accessToken },
    });
    const paymentData = await paymentRes.json();
    if (paymentData.code !== 0) {
      throw new Error('결제 정보 조회 실패');
    }

    const payment = paymentData.response;

    // 금액 검증
    if (expected_amount && payment.amount !== expected_amount) {
      // 결제 취소 (위변조)
      await fetch('https://api.iamport.kr/payments/cancel', {
        method: 'POST',
        headers: { Authorization: accessToken, 'Content-Type': 'application/json' },
        body: JSON.stringify({ imp_uid, reason: '결제 금액 불일치 (위변조 의심)' }),
      });

      return new Response(
        JSON.stringify({ verified: false, error: '결제 금액 불일치' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Supabase에서 주문 상태 업데이트
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const paymentStatus = payment.status === 'paid' ? 'paid' : 'failed';
    await supabase
      .from('at_orders')
      .update({
        payment_status: paymentStatus,
        portone_payment_id: imp_uid,
        paid_at: paymentStatus === 'paid' ? new Date().toISOString() : null,
      })
      .eq('order_number', merchant_uid);

    return new Response(
      JSON.stringify({
        verified: true,
        status: paymentStatus,
        amount: payment.amount,
        name: payment.name,
        paid_at: payment.paid_at,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
