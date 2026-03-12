// ─── 요금제 타입 ───
export const PLAN_TYPES = {
  FREE: 'free',
  BASIC: 'basic',
  PRO: 'pro',
};

// ─── 기능 키 ───
export const FEATURES = {
  SENSITIVITY: 'sensitivity',
  AI_ANALYSIS: 'ai_analysis',
  EXPORT_EXCEL: 'export_excel',
  EXPORT_PDF: 'export_pdf',
  SMS: 'sms',
  FULL_STATISTICS: 'full_statistics',
};

// ─── 플랜별 제한 ───
export const PLAN_LIMITS = {
  [PLAN_TYPES.FREE]: {
    label: 'Free',
    price: 0,
    maxProjects: 1,
    maxEvaluators: 5,
    smsQuota: 0,
    features: [],
  },
  [PLAN_TYPES.BASIC]: {
    label: 'Basic',
    price: 29000,
    maxProjects: 5,
    maxEvaluators: 20,
    smsQuota: 50,
    features: [
      FEATURES.SENSITIVITY,
      FEATURES.EXPORT_EXCEL,
      FEATURES.SMS,
      FEATURES.FULL_STATISTICS,
    ],
  },
  [PLAN_TYPES.PRO]: {
    label: 'Pro',
    price: 59000,
    maxProjects: Infinity,
    maxEvaluators: Infinity,
    smsQuota: 200,
    features: [
      FEATURES.SENSITIVITY,
      FEATURES.AI_ANALYSIS,
      FEATURES.EXPORT_EXCEL,
      FEATURES.EXPORT_PDF,
      FEATURES.SMS,
      FEATURES.FULL_STATISTICS,
    ],
  },
};

// ─── 기능별 최소 필요 플랜 ───
export const FEATURE_MIN_PLAN = {
  [FEATURES.SENSITIVITY]: PLAN_TYPES.BASIC,
  [FEATURES.FULL_STATISTICS]: PLAN_TYPES.BASIC,
  [FEATURES.EXPORT_EXCEL]: PLAN_TYPES.BASIC,
  [FEATURES.SMS]: PLAN_TYPES.BASIC,
  [FEATURES.EXPORT_PDF]: PLAN_TYPES.PRO,
  [FEATURES.AI_ANALYSIS]: PLAN_TYPES.PRO,
  project_limit: PLAN_TYPES.BASIC,
  evaluator_limit: PLAN_TYPES.BASIC,
};

// ─── 사이드바 메뉴 key → 기능 매핑 ───
export const SIDEBAR_FEATURE_MAP = {
  sensitivity: FEATURES.SENSITIVITY,
  'ai-analysis': FEATURES.AI_ANALYSIS,
};

// ─── Free에서 접근 가능한 통계 서브메뉴 ───
export const BASIC_STAT_TYPES = ['descriptive', 'guide'];

// ─── 관리자 이메일 목록 ───
export const SUPER_ADMIN_EMAILS = [
  'aebon@kakao.com',
  'aebon@kyonggi.ac.kr',
  'ryuwebpd@gmail.com',
];

// ─── 기능별 한글 이름 (모달 표시용) ───
export const FEATURE_LABELS = {
  [FEATURES.SENSITIVITY]: '민감도 분석',
  [FEATURES.AI_ANALYSIS]: 'AI 분석',
  [FEATURES.EXPORT_EXCEL]: 'Excel 내보내기',
  [FEATURES.EXPORT_PDF]: 'PDF 내보내기',
  [FEATURES.SMS]: 'SMS 발송',
  [FEATURES.FULL_STATISTICS]: '통계 분석',
  project_limit: '프로젝트 추가 생성',
  evaluator_limit: '평가자 추가 등록',
};
