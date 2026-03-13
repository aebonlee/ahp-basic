import { supabase } from '../lib/supabaseClient';

/**
 * 주문 생성 (order + order_items)
 */
export async function createOrder(orderData) {
  const orderPayload = {
    order_number: orderData.order_number,
    user_email: orderData.user_email,
    user_name: orderData.user_name,
    user_phone: orderData.user_phone,
    total_amount: orderData.total_amount,
    payment_method: orderData.payment_method,
  };
  if (orderData.user_id) orderPayload.user_id = orderData.user_id;

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert(orderPayload)
    .select()
    .single();

  if (orderError) throw orderError;

  if (orderData.items && orderData.items.length > 0) {
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(
        orderData.items.map(item => {
          const row = {
            order_id: order.id,
            product_title: item.product_title,
            quantity: item.quantity,
            unit_price: item.unit_price,
            subtotal: item.subtotal,
          };
          if (item.plan_type) row.plan_type = item.plan_type;
          return row;
        })
      );
    if (itemsError) throw itemsError;
  }

  return order;
}

/**
 * 주문번호로 주문 조회
 */
export async function getOrderByNumber(orderNumber) {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .eq('order_number', orderNumber)
    .limit(1);

  if (error) throw error;
  if (!orders || orders.length === 0) return null;

  const order = orders[0];
  const { data: items } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', order.id);

  return { ...order, items: items || [] };
}

/**
 * 주문 상태 업데이트
 */
export async function updateOrderStatus(orderId, status, paymentId, cancelReason) {
  const updatePayload = { payment_status: status };
  if (status === 'paid') updatePayload.paid_at = new Date().toISOString();
  if (status === 'cancelled') {
    updatePayload.cancelled_at = new Date().toISOString();
    if (cancelReason) updatePayload.cancel_reason = cancelReason;
  }

  const extras = {};
  if (paymentId) extras.portone_payment_id = paymentId;

  let result = null;
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ ...updatePayload, ...extras })
      .eq('id', orderId)
      .select();
    if (error) throw error;
    result = data;
  } catch {
    const { data, error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId)
      .select();
    if (error) throw error;
    result = data;
  }

  if (!result || result.length === 0) {
    throw new Error(`UPDATE_NO_ROWS: 주문 ID ${orderId}에 해당하는 주문을 찾을 수 없습니다.`);
  }

  return result[0];
}

/**
 * 결제 검증 (Edge Function)
 */
export async function verifyPayment(paymentId, orderId) {
  const { data, error } = await supabase.functions.invoke('verify-payment', {
    body: { paymentId, orderId },
  });

  if (error) throw error;
  return data;
}

/**
 * 사용자별 주문 이력 조회
 */
export async function getOrdersByUser(userId) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    if (import.meta.env.DEV) console.error('getOrdersByUser error:', error);
    return [];
  }
  return data || [];
}
