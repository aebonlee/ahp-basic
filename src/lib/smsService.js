import { supabase } from './supabaseClient';

/**
 * 단일 수신자에게 SMS 발송 (Edge Function 호출)
 */
export async function sendSms({ receiver, message }) {
  const { data, error } = await supabase.functions.invoke('send-sms', {
    body: { receiver, message },
  });
  if (error) {
    // FunctionsHttpError의 경우 응답 본문에서 상세 에러 추출
    const detail = typeof data === 'object' && data?.error
      ? data.error
      : typeof data === 'string'
        ? data
        : error.message || '알 수 없는 오류';
    throw new Error(detail);
  }
  if (data && !data.success) {
    throw new Error(data.message || '발송 실패');
  }
  return data;
}

/**
 * 다수 수신자에게 순차 발송
 * - {이름} 플레이스홀더를 수신자별 이름으로 치환
 * @param {Array<{name: string, phone: string}>} recipients
 * @param {string} message
 * @param {(current: number, total: number) => void} onProgress
 * @returns {Promise<Array<{name: string, phone: string, success: boolean, result?: any, error?: string}>>}
 */
export async function sendSmsBulk(recipients, message, onProgress) {
  const results = [];
  for (let i = 0; i < recipients.length; i++) {
    try {
      // {이름} 플레이스홀더를 수신자 이름으로 치환
      const personalizedMsg = message.replace(/\{이름\}/g, recipients[i].name || '');
      const result = await sendSms({ receiver: recipients[i].phone, message: personalizedMsg });
      results.push({ ...recipients[i], success: result?.success ?? true, result });
    } catch (err) {
      results.push({ ...recipients[i], success: false, error: err.message });
    }
    onProgress?.(i + 1, recipients.length);
  }
  return results;
}
