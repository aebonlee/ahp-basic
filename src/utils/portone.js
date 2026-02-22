const STORE_ID = import.meta.env.VITE_PORTONE_STORE_ID || '';
const CHANNEL_KEY = import.meta.env.VITE_PORTONE_CHANNEL_KEY || '';

// PortOne V2 SDK 동적 로드
let PortOne = null;

async function loadPortOne() {
  if (PortOne) return PortOne;
  try {
    const module = await import('@portone/browser-sdk/v2');
    PortOne = module.default || module;
    return PortOne;
  } catch {
    return null;
  }
}

/**
 * 결제 요청
 * @param {Object} params
 * @param {string} params.orderId - 주문 ID
 * @param {string} params.orderName - 주문명
 * @param {number} params.totalAmount - 총 금액
 * @param {string} params.payMethod - 'CARD' | 'TRANSFER'
 * @param {Object} params.customer - { fullName, email, phoneNumber }
 * @returns {Object} 결제 결과
 */
export async function requestPayment({
  orderId,
  orderName,
  totalAmount,
  payMethod = 'CARD',
  customer = {},
}) {
  // 데모 모드: 키가 없으면 가짜 성공 반환
  if (!STORE_ID || !CHANNEL_KEY) {
    console.warn('[PortOne] 데모 모드: STORE_ID/CHANNEL_KEY 미설정');
    return {
      paymentId: `demo-${orderId}-${Date.now()}`,
      status: 'PAID',
      demo: true,
    };
  }

  const sdk = await loadPortOne();
  if (!sdk) {
    throw new Error('PortOne SDK 로드에 실패했습니다.');
  }

  const paymentId = `payment-${orderId}-${Date.now()}`;

  const response = await sdk.requestPayment({
    storeId: STORE_ID,
    channelKey: CHANNEL_KEY,
    paymentId,
    orderName,
    totalAmount,
    currency: 'CURRENCY_KRW',
    payMethod,
    customer: {
      fullName: customer.fullName || '',
      email: customer.email || '',
      phoneNumber: customer.phoneNumber || '',
    },
  });

  if (response.code) {
    throw new Error(response.message || '결제에 실패했습니다.');
  }

  return {
    paymentId: response.paymentId,
    status: 'PAID',
  };
}

/**
 * 주문번호 생성 (DIT-YYMMDD-RANDOM6)
 */
export function generateOrderNumber() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `AHP-${yy}${mm}${dd}-${rand}`;
}
