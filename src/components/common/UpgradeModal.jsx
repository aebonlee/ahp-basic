import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import Button from './Button';
import { FEATURE_MIN_PLAN, PLAN_LIMITS, FEATURE_LABELS } from '../../lib/subscriptionPlans';
import styles from './UpgradeModal.module.css';

export default function UpgradeModal({ isOpen, onClose, feature }) {
  const navigate = useNavigate();
  const minPlan = FEATURE_MIN_PLAN[feature];
  const planLabel = minPlan ? PLAN_LIMITS[minPlan]?.label : 'Basic';
  const featureLabel = FEATURE_LABELS[feature] || feature;

  const handleViewPricing = () => {
    onClose();
    navigate('/pricing');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="업그레이드 필요" width="420px">
      <div className={styles.content}>
        <div className={styles.lockIcon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <p className={styles.message}>
          <strong>{featureLabel}</strong> 기능은<br />
          <span className={styles.planBadge}>{planLabel}</span> 이상에서 사용 가능합니다.
        </p>
        <div className={styles.actions}>
          <Button variant="primary" onClick={handleViewPricing}>
            요금제 보기
          </Button>
          <Button variant="ghost" onClick={onClose}>
            닫기
          </Button>
        </div>
      </div>
    </Modal>
  );
}
