import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import {
  PLAN_TYPES,
  PLAN_LIMITS,
  FEATURE_MIN_PLAN,
  SUPER_ADMIN_EMAILS,
} from '../lib/subscriptionPlans';

export const SubscriptionContext = createContext(null);

// 플랜 순서 비교용
const PLAN_ORDER = { [PLAN_TYPES.FREE]: 0, [PLAN_TYPES.BASIC]: 1, [PLAN_TYPES.PRO]: 2 };

export function SubscriptionProvider({ children }) {
  const { user, profile } = useAuth();

  const [planType, setPlanType] = useState(PLAN_TYPES.FREE);
  const [planExpiresAt, setPlanExpiresAt] = useState(null);
  const [trialExpiresAt, setTrialExpiresAt] = useState(null);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [isTrialing, setIsTrialing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const isSuperAdmin = useMemo(
    () => !!user?.email && SUPER_ADMIN_EMAILS.includes(user.email),
    [user?.email],
  );

  // ─── RPC: 만료 확인 + 다운그레이드 ───
  const checkPlan = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase.rpc('check_plan_expiry', {
      p_user_id: user.id,
    }).then(
      (res) => res,
      () => ({ data: null }),
    );
    if (data) {
      setPlanType(data.plan_type || PLAN_TYPES.FREE);
      setDaysRemaining(data.days_remaining ?? 0);
      setIsTrialing(!!data.is_trialing);
      setPlanExpiresAt(data.plan_expires_at || null);
      setTrialExpiresAt(data.trial_expires_at || null);
    }
    setLoaded(true);
  }, [user?.id]);

  // ─── 첫 로그인: 체험 부여 ───
  const grantTrialIfNeeded = useCallback(async () => {
    if (!user?.id || !profile) return;
    if (isSuperAdmin) return;
    // plan_type이 free이고 trial_started_at이 없으면 체험 부여
    if (profile.plan_type === 'free' && !profile.trial_started_at) {
      await supabase.rpc('grant_trial', {
        p_user_id: user.id,
        p_days: 7,
      }).then(null, () => {});
      // 체험 부여 후 플랜 다시 확인
      await checkPlan();
    }
  }, [user?.id, profile, isSuperAdmin, checkPlan]);

  // 로그인 시 플랜 확인
  useEffect(() => {
    if (user?.id) {
      checkPlan();
    } else {
      setPlanType(PLAN_TYPES.FREE);
      setDaysRemaining(0);
      setIsTrialing(false);
      setPlanExpiresAt(null);
      setTrialExpiresAt(null);
      setLoaded(false);
    }
  }, [user?.id, checkPlan]);

  // 프로필 로드 후 체험 부여 체크
  useEffect(() => {
    if (profile && loaded) {
      grantTrialIfNeeded();
    }
  }, [profile, loaded, grantTrialIfNeeded]);

  // ─── 기능 접근 체크 ───
  const canAccess = useCallback(
    (feature) => {
      if (isSuperAdmin) return true;
      const minPlan = FEATURE_MIN_PLAN[feature];
      if (!minPlan) return true; // 매핑 없으면 제한 없음
      return PLAN_ORDER[planType] >= PLAN_ORDER[minPlan];
    },
    [planType, isSuperAdmin],
  );

  // ─── 프로젝트 생성 가능 여부 ───
  const canCreateProject = useCallback(
    (currentCount) => {
      if (isSuperAdmin) return true;
      const limit = PLAN_LIMITS[planType]?.maxProjects ?? 1;
      return currentCount < limit;
    },
    [planType, isSuperAdmin],
  );

  // ─── 평가자 추가 가능 여부 ───
  const canAddEvaluator = useCallback(
    (currentCount) => {
      if (isSuperAdmin) return true;
      const limit = PLAN_LIMITS[planType]?.maxEvaluators ?? 5;
      return currentCount < limit;
    },
    [planType, isSuperAdmin],
  );

  // ─── 구독 새로고침 ───
  const refreshSubscription = useCallback(async () => {
    await checkPlan();
  }, [checkPlan]);

  const value = useMemo(
    () => ({
      planType,
      planExpiresAt,
      trialExpiresAt,
      daysRemaining,
      isTrialing,
      isSuperAdmin,
      loaded,
      canAccess,
      canCreateProject,
      canAddEvaluator,
      refreshSubscription,
      maxProjects: isSuperAdmin ? Infinity : (PLAN_LIMITS[planType]?.maxProjects ?? 1),
      maxEvaluators: isSuperAdmin ? Infinity : (PLAN_LIMITS[planType]?.maxEvaluators ?? 5),
    }),
    [planType, planExpiresAt, trialExpiresAt, daysRemaining, isTrialing, isSuperAdmin, loaded, canAccess, canCreateProject, canAddEvaluator, refreshSubscription],
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}
