import { supabase } from '../lib/supabaseClient';

/** In-memory fallback store (Supabase 미설정 시 dev/demo용) */
let _memoryOrders = [];

/**
 * 주문 생성 (order + order_items)
 */
export async function createOrder(orderData) {
  if (!supabase) {
    const order = {
      id: crypto.randomUUID(),
      ...orderData,
      payment_status: 'pending',
      created_at: new Date().toISOString(),
    };
    _memoryOrders.push(order);
    return order;
  }

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
        orderData.items.map(item => ({
          order_id: order.id,
          product_title: item.product_title,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.subtotal,
        }))
      );
    if (itemsError) throw itemsError;
  }

  return order;
}

/**
 * 주문번호로 주문 조회
 */
export async function getOrderByNumber(orderNumber) {
  if (!supabase) {
    return _memoryOrders.find(o => o.order_number === orderNumber) || null;
  }

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
  if (!supabase) {
    const idx = _memoryOrders.findIndex(o => o.id === orderId || o.order_number === orderId);
    if (idx >= 0) {
      _memoryOrders[idx].payment_status = status;
      if (paymentId) _memoryOrders[idx].portone_payment_id = paymentId;
      if (status === 'paid') _memoryOrders[idx].paid_at = new Date().toISOString();
      if (status === 'cancelled') {
        _memoryOrders[idx].cancelled_at = new Date().toISOString();
        if (cancelReason) _memoryOrders[idx].cancel_reason = cancelReason;
      }
    }
    return _memoryOrders[idx];
  }

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

  return result?.[0] || null;
}

/**
 * 결제 검증 (Edge Function)
 */
export async function verifyPayment(paymentId, orderId) {
  if (!supabase) {
    await updateOrderStatus(orderId, 'paid', paymentId);
    return { verified: true };
  }

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
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getOrdersByUser error:', error);
    return [];
  }
  return data || [];
}
