import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { PLAN_TYPES } from '../lib/subscriptionPlans';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabaseClient';
import { createOrder, verifyPayment, updateOrderStatus } from '../utils/orderService';
import { requestPayment, generateOrderNumber } from '../utils/portone';
import PublicLayout from '../components/layout/PublicLayout';
import '../styles/shop.css';

const formatPrice = (price) => `₩${price.toLocaleString()}`;

export default function CheckoutPage() {
  const { cartItems, cartTotal, cartCount, clearCart } = useCart();
  const { user, profile } = useAuth();
  const { refreshPlans } = useSubscription();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [agreed, setAgreed] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const paymentDone = useRef(false);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  // 로그인 정보 자동 채우기
  useEffect(() => {
    if (profile || user) {
      const email = user?.email
        || user?.user_metadata?.email
        || user?.identities?.[0]?.identity_data?.email
        || profile?.email
        || '';
      setForm(prev => ({
        name: prev.name || profile?.display_name || user?.user_metadata?.full_name || '',
        email: prev.email || email,
        phone: prev.phone || profile?.phone || '',
      }));
    }
  }, [profile, user]);

  useEffect(() => {
    if (cartItems.length === 0 && !paymentDone.current) {
      navigate('/cart');
    }
  }, [cartItems, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed || processing) return;

    const trimmedName = form.name.trim();
    if (!trimmedName) {
      toast.warning('이름을 입력해 주세요.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      toast.warning('올바른 이메일 주소를 입력해 주세요.');
      return;
    }

    const phoneDigits = form.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      toast.warning('올바른 전화번호를 입력해 주세요 (최소 10자리).');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const orderNumber = generateOrderNumber();

      // 1. Supabase에 주문 생성
      const orderData = {
        order_number: orderNumber,
        user_email: form.email,
        user_name: form.name,
        user_phone: form.phone,
        total_amount: cartTotal,
        payment_method: paymentMethod,
        user_id: user?.id || null,
        items: cartItems.map(item => ({
          product_title: item.title,
          quantity: item.quantity,
          unit_price: item.price,
          subtotal: item.price * item.quantity,
          plan_type: item.planType || null,
        })),
      };

      const order = await createOrder(orderData);
      const orderId = order?.id || orderNumber;

      // 2. PortOne 결제 요청
      const orderName = `AHP Basic 이용권 ${cartCount}건`;

      const paymentResult = await requestPayment({
        orderId,
        orderName,
        totalAmount: cartTotal,
        payMethod: paymentMethod === 'card' ? 'CARD' : 'TRANSFER',
        customer: {
          fullName: form.name,
          email: form.email,
          phoneNumber: form.phone,
        },
      });

      // 결제 실패/취소
      if (paymentResult.code) {
        setError(paymentResult.message || '결제가 취소되었습니다.');
        setProcessing(false);
        return;
      }

      // 3. 결제 검증 및 상태 업데이트
      try {
        await verifyPayment(paymentResult.paymentId, orderId);
      } catch {
        try {
          await updateOrderStatus(orderId, 'paid', paymentResult.paymentId);
        } catch (updateErr) {
          if (import.meta.env.DEV) console.warn('주문 상태 업데이트 실패 (결제는 성공):', updateErr);
        }
      }

      // 4. 결제 성공 → 프로젝트 이용권 생성
      if (user?.id) {
        for (const item of cartItems) {
          if (item.planType && item.planType !== PLAN_TYPES.FREE) {
            for (let q = 0; q < item.quantity; q++) {
              await supabase.rpc('activate_project_plan', {
                p_user_id: user.id,
                p_plan_type: item.planType,
                p_order_id: orderId,
              }).then(null, () => {});
            }
          }
        }
        await refreshPlans();
      }

      // 5. 장바구니 비우고 확인 페이지로 이동
      paymentDone.current = true;
      const confirmState = {
        orderNumber,
        userName: form.name,
        userEmail: form.email,
        totalAmount: cartTotal,
        paymentMethod,
        paymentId: paymentResult.paymentId,
        items: cartItems.map(item => ({
          product_title: item.title,
          quantity: item.quantity,
          unit_price: item.price,
          subtotal: item.price * item.quantity,
        })),
        paidAt: new Date().toISOString(),
      };
      clearCart();
      navigate(`/order-confirmation?orderNumber=${orderNumber}`, { state: confirmState });
    } catch (err) {
      if (import.meta.env.DEV) console.error('Checkout error:', err);
      setError('오류가 발생했습니다. 다시 시도해주세요.');
      setProcessing(false);
    }
  };

  if (cartItems.length === 0 && !paymentDone.current) return null;

  return (
    <PublicLayout>
      <section className="shop-page-header">
        <div className="shop-container">
          <h1>결제</h1>
        </div>
      </section>

      <section className="checkout-section">
        <div className="shop-container">
          <form className="checkout-layout" onSubmit={handleSubmit}>
            <div className="checkout-form">
              {/* 주문자 정보 */}
              <div className="checkout-block">
                <h3>주문자 정보</h3>
                <div className="form-group">
                  <label>이름</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="이름을 입력해 주세요"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>이메일</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="이메일 주소를 입력해 주세요"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>전화번호</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="전화번호를 입력해 주세요"
                    required
                  />
                </div>
              </div>

              {/* 결제 수단 */}
              <div className="checkout-block">
                <h3>결제 수단</h3>
                <div className="payment-methods">
                  <label className={`payment-option ${paymentMethod === 'card' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                    />
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="1" y="4" width="22" height="16" rx="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                    <span>카드 결제</span>
                  </label>
                  <label className={`payment-option ${paymentMethod === 'transfer' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="transfer"
                      checked={paymentMethod === 'transfer'}
                      onChange={() => setPaymentMethod('transfer')}
                    />
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="18" rx="2" />
                      <line x1="2" y1="9" x2="22" y2="9" />
                      <line x1="7" y1="15" x2="11" y2="15" />
                    </svg>
                    <span>계좌이체</span>
                  </label>
                </div>
              </div>

              {/* 약관 동의 */}
              <div className="checkout-block">
                <label className="checkout-agree">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={() => setAgreed(!agreed)}
                  />
                  <span>주문 내용을 확인하였으며, 결제에 동의합니다.</span>
                </label>
              </div>

              {error && <div className="checkout-error">{error}</div>}
              {!agreed && !error && (
                <div className="checkout-hint">결제를 진행하려면 약관에 동의해 주세요.</div>
              )}
            </div>

            {/* 주문 요약 사이드바 */}
            <div className="checkout-summary">
              <h3>주문 요약</h3>
              <div className="checkout-items">
                {cartItems.map(item => (
                  <div key={item.id} className="checkout-item">
                    <span className="checkout-item-name">
                      {item.title}
                      {item.quantity > 1 && ` × ${item.quantity}`}
                    </span>
                    <span className="checkout-item-price">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="checkout-total">
                <span>결제 금액</span>
                <span className="checkout-total-price">{formatPrice(cartTotal)}</span>
              </div>
              <button
                type="submit"
                className="checkout-pay-btn"
                disabled={!agreed || processing || !form.name || !form.email || !form.phone}
              >
                {processing ? '결제 처리 중...' : '결제하기'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </PublicLayout>
  );
}
