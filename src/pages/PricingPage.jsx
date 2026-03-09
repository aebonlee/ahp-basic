import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import { requestPayment, generateOrderNumber } from '../utils/portone';
import PublicLayout from '../components/layout/PublicLayout';
import styles from './PricingPage.module.css';

/* ─── 요금제 데이터 ─── */
const PLANS = [
  {
    key: 'free',
    name: 'Free',
    price: 0,
    priceLabel: '무료',
    desc: '개인 학습 및 소규모 테스트에 적합합니다.',
    features: [
      { text: '프로젝트 1개', ok: true },
      { text: '평가자 5명', ok: true },
      { text: '기본 통계 분석', ok: true },
      { text: 'SMS 발송', ok: false },
      { text: '결과 내보내기', ok: false },
      { text: '민감도 분석', ok: false },
      { text: 'AI 분석', ok: false },
    ],
    btnLabel: '시작하기',
    btnStyle: 'default',
    popular: false,
  },
  {
    key: 'basic',
    name: 'Basic',
    price: 29000,
    priceLabel: '₩29,000',
    desc: '팀 프로젝트와 실무 활용에 최적화된 요금제입니다.',
    features: [
      { text: '프로젝트 5개', ok: true },
      { text: '평가자 20명', ok: true },
      { text: '전체 통계 분석', ok: true },
      { text: 'SMS 50건/월', ok: true },
      { text: 'Excel 내보내기', ok: true },
      { text: '민감도 분석', ok: true },
      { text: 'AI 분석', ok: false },
    ],
    btnLabel: '구독하기',
    btnStyle: 'default',
    popular: false,
  },
  {
    key: 'pro',
    name: 'Pro',
    price: 59000,
    priceLabel: '₩59,000',
    desc: '대규모 의사결정과 AI 기반 분석이 필요한 조직을 위한 요금제입니다.',
    features: [
      { text: '프로젝트 무제한', ok: true },
      { text: '평가자 무제한', ok: true },
      { text: '전체 + AI 통계 분석', ok: true },
      { text: 'SMS 200건/월', ok: true },
      { text: 'Excel + PDF 내보내기', ok: true },
      { text: '민감도 분석', ok: true },
      { text: 'AI 분석', ok: true },
    ],
    btnLabel: '구독하기',
    btnStyle: 'primary',
    popular: true,
  },
];

const COMPARE_ROWS = [
  { label: '월 가격', free: '무료', basic: '₩29,000', pro: '₩59,000' },
  { label: '프로젝트 수', free: '1개', basic: '5개', pro: '무제한' },
  { label: '평가자 수', free: '5명', basic: '20명', pro: '무제한' },
  { label: '통계 분석', free: '기본', basic: '전체', pro: '전체 + AI' },
  { label: 'SMS 발송', free: '—', basic: '50건/월', pro: '200건/월' },
  { label: '결과 내보내기', free: '—', basic: 'Excel', pro: 'Excel + PDF' },
  { label: '민감도 분석', free: '—', basic: '✓', pro: '✓', basicCheck: true, proCheck: true },
  { label: 'AI 분석', free: '—', basic: '—', pro: '✓', proCheck: true },
];

const FAQ_ITEMS = [
  {
    q: '무료 요금제에서 유료로 언제든 업그레이드할 수 있나요?',
    a: '네, 언제든지 가능합니다. 대시보드에서 요금제를 변경하시면 즉시 적용됩니다. 기존 프로젝트와 데이터는 모두 유지됩니다.',
  },
  {
    q: '결제 수단은 어떤 것을 지원하나요?',
    a: '신용카드 및 체크카드 결제를 지원합니다. PortOne 결제 시스템을 통해 안전하게 처리됩니다.',
  },
  {
    q: '구독을 취소하면 데이터는 어떻게 되나요?',
    a: '구독을 취소해도 기존 데이터는 30일간 보관됩니다. 이 기간 내에 다시 구독하시면 모든 데이터를 복구할 수 있습니다.',
  },
  {
    q: 'SMS 발송 건수를 초과하면 어떻게 되나요?',
    a: '월 할당량을 초과하면 추가 발송이 일시 중단됩니다. 상위 요금제로 업그레이드하시거나 다음 월까지 기다리시면 됩니다.',
  },
  {
    q: '팀원 여러 명이 하나의 계정을 사용할 수 있나요?',
    a: '각 팀원은 개별 계정을 사용해야 합니다. 프로젝트 관리자가 평가자를 초대하여 협업할 수 있습니다.',
  },
  {
    q: '환불 정책은 어떻게 되나요?',
    a: '결제 후 7일 이내에 서비스를 이용하지 않은 경우 전액 환불이 가능합니다. 고객센터로 문의해 주세요.',
  },
];

/* ─── Icons ─── */
const CheckIcon = () => (
  <svg className={styles.checkIcon} viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
    <path d="M5.5 9.5l2 2 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const XIcon = () => (
  <svg className={styles.xIcon} viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
    <path d="M6.5 6.5l5 5M11.5 6.5l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const ChevronDown = () => (
  <svg className={styles.faqChevron} viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function PricingPage() {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  const toast = useToast();

  const [openFaq, setOpenFaq] = useState(null);
  const [modal, setModal] = useState(null);   // { plan } or null
  const [paying, setPaying] = useState(false);

  const toggleFaq = (idx) => setOpenFaq((prev) => (prev === idx ? null : idx));

  /* ─── CTA 클릭 핸들러 ─── */
  const handlePlanClick = (plan) => {
    if (plan.key === 'free') {
      navigate('/register');
      return;
    }
    // 유료 플랜: 로그인 확인
    if (!isLoggedIn) {
      toast.warning('로그인 후 이용해 주세요.');
      navigate('/login');
      return;
    }
    setModal({ plan });
  };

  /* ─── 결제 처리 ─── */
  const handlePayment = async () => {
    if (!modal) return;
    const { plan } = modal;
    setPaying(true);

    try {
      const orderId = generateOrderNumber();
      const result = await requestPayment({
        orderId,
        orderName: `AHP Basic ${plan.name} 월간 구독`,
        totalAmount: plan.price,
        payMethod: 'CARD',
        customer: {
          fullName: user?.user_metadata?.full_name || '',
          email: user?.email || '',
        },
      });

      if (result.status === 'PAID') {
        const demoMsg = result.demo ? ' (데모 모드)' : '';
        toast.success(`${plan.name} 요금제 결제가 완료되었습니다!${demoMsg}`);
        setModal(null);
        navigate('/admin');
      }
    } catch (err) {
      toast.error(err.message || '결제 처리 중 오류가 발생했습니다.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <PublicLayout>
      {/* Hero */}
      <section className={styles.hero}>
        <span className={styles.heroTag}>PRICING</span>
        <h1 className={styles.heroTitle}>사용요금 안내</h1>
        <p className={styles.heroDesc}>
          프로젝트 규모와 필요에 맞는 요금제를 선택하세요.
          무료로 시작하고 언제든 업그레이드할 수 있습니다.
        </p>
      </section>

      {/* Plan Cards */}
      <section className={styles.planSection}>
        <div className={styles.planGrid}>
          {PLANS.map((plan) => (
            <div
              key={plan.key}
              className={plan.popular ? styles.planCardPopular : styles.planCard}
            >
              {plan.popular && <span className={styles.popularBadge}>추천</span>}
              <h3 className={styles.planName}>{plan.name}</h3>
              <div className={styles.planPrice}>
                <span className={styles.priceAmount}>{plan.priceLabel}</span>
                {plan.price > 0 && <span className={styles.pricePeriod}>/월</span>}
              </div>
              <p className={styles.planDesc}>{plan.desc}</p>
              <ul className={styles.planFeatures}>
                {plan.features.map((f, i) => (
                  <li key={i}>
                    {f.ok ? <CheckIcon /> : <XIcon />}
                    {f.text}
                  </li>
                ))}
              </ul>
              <button
                className={plan.btnStyle === 'primary' ? styles.planBtnPrimary : styles.planBtn}
                onClick={() => handlePlanClick(plan)}
              >
                {plan.btnLabel}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Table */}
      <section className={styles.compareSection}>
        <h2 className={styles.sectionTitle}>기능 비교</h2>
        <p className={styles.sectionDesc}>요금제별 제공 기능을 한눈에 비교해 보세요.</p>
        <div className={styles.tableWrap}>
          <table className={styles.compareTable}>
            <thead>
              <tr>
                <th>기능</th>
                <th>Free</th>
                <th>Basic</th>
                <th className={styles.popularCol}>Pro</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row, i) => (
                <tr key={i}>
                  <td>{row.label}</td>
                  <td>{row.free === '—' ? <span className={styles.tableX}>—</span> : row.free}</td>
                  <td>
                    {row.basicCheck
                      ? <span className={styles.tableCheck}>✓</span>
                      : row.basic === '—'
                        ? <span className={styles.tableX}>—</span>
                        : row.basic}
                  </td>
                  <td className={styles.popularCol}>
                    {row.proCheck
                      ? <span className={styles.tableCheck}>✓</span>
                      : row.pro}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className={styles.faqSection}>
        <h2 className={styles.sectionTitle}>자주 묻는 질문</h2>
        <p className={styles.sectionDesc}>요금제와 결제에 대한 궁금증을 해결해 드립니다.</p>
        <div className={styles.faqList}>
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className={`${styles.faqItem} ${openFaq === i ? styles.faqOpen : ''}`}>
              <button className={styles.faqQuestion} onClick={() => toggleFaq(i)}>
                {item.q}
                <ChevronDown />
              </button>
              {openFaq === i && <div className={styles.faqAnswer}>{item.a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <h2 className={styles.ctaTitle}>지금 시작하세요</h2>
        <p className={styles.ctaDesc}>
          무료로 AHP 분석을 체험하고, 필요에 맞는 요금제로 업그레이드하세요.
        </p>
        <button className={styles.ctaBtn} onClick={() => navigate('/register')}>
          무료로 시작하기
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 8h10M9 4l4 4-4 4" />
          </svg>
        </button>
      </section>

      {/* Payment Modal */}
      {modal && (
        <div className={styles.paymentOverlay} onClick={() => !paying && setModal(null)}>
          <div className={styles.paymentModal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>결제 확인</h3>
            <div className={styles.modalRow}>
              <span className={styles.modalLabel}>요금제</span>
              <span className={styles.modalValue}>{modal.plan.name}</span>
            </div>
            <div className={styles.modalRow}>
              <span className={styles.modalLabel}>결제 주기</span>
              <span className={styles.modalValue}>월간 구독</span>
            </div>
            <div className={styles.modalRow}>
              <span className={styles.modalLabel}>결제 수단</span>
              <span className={styles.modalValue}>카드 결제</span>
            </div>
            <div className={styles.modalTotal}>
              <span className={styles.modalLabel}>결제 금액</span>
              <span className={styles.modalValue}>{modal.plan.priceLabel}/월</span>
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.modalCancelBtn}
                onClick={() => setModal(null)}
                disabled={paying}
              >
                취소
              </button>
              <button
                className={styles.modalPayBtn}
                onClick={handlePayment}
                disabled={paying}
              >
                {paying ? '결제 처리 중...' : '결제하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PublicLayout>
  );
}
