import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../../hooks/useSubscription';
import { PLAN_LIMITS } from '../../lib/subscriptionPlans';
import styles from './PlanExpiryBanner.module.css';

export default function PlanExpiryBanner() {
  const navigate = useNavigate();
  const { planType, daysRemaining, isTrialing, isSuperAdmin, loaded } = useSubscription();

  if (!loaded || isSuperAdmin) return null;

  // 체험 중
  if (isTrialing) {
    return (
      <div className={`${styles.banner} ${styles.trial}`}>
        <span>
          {PLAN_LIMITS[planType]?.label || 'Basic'} 체험판을 사용 중입니다 ({daysRemaining}일 남음)
        </span>
        <button className={styles.action} onClick={() => navigate('/pricing')}>
          요금제 보기
        </button>
      </div>
    );
  }

  // 유료 구독 만료됨
  if (planType === 'free' && daysRemaining === 0) {
    return null; // Free 사용자에게는 배너 표시 안 함
  }

  // 만료됨 (유료 → free 다운그레이드 직후는 checkPlan이 처리)
  if (daysRemaining <= 0 && planType !== 'free') {
    return (
      <div className={`${styles.banner} ${styles.expired}`}>
        <span>구독이 만료되었습니다.</span>
        <button className={styles.action} onClick={() => navigate('/pricing')}>
          갱신하기
        </button>
      </div>
    );
  }

  // 만료 3일 이하
  if (daysRemaining > 0 && daysRemaining <= 3) {
    return (
      <div className={`${styles.banner} ${styles.urgent}`}>
        <span>구독 만료까지 {daysRemaining}일 남았습니다!</span>
        <button className={styles.action} onClick={() => navigate('/pricing')}>
          갱신하기
        </button>
      </div>
    );
  }

  // 만료 7일 이하
  if (daysRemaining > 3 && daysRemaining <= 7) {
    return (
      <div className={`${styles.banner} ${styles.warning}`}>
        <span>구독 만료까지 {daysRemaining}일 남았습니다.</span>
        <button className={styles.action} onClick={() => navigate('/pricing')}>
          갱신하기
        </button>
      </div>
    );
  }

  return null;
}
