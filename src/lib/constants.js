// Project status codes
export const PROJECT_STATUS = {
  CREATING: 2,
  WAITING: 6,
  EVALUATING: 1,
  COMPLETED: 4,
};

export const PROJECT_STATUS_LABELS = {
  [PROJECT_STATUS.CREATING]: '생성중',
  [PROJECT_STATUS.WAITING]: '대기중',
  [PROJECT_STATUS.EVALUATING]: '평가중',
  [PROJECT_STATUS.COMPLETED]: '평가종료',
};

export const PROJECT_STATUS_COLORS = {
  [PROJECT_STATUS.CREATING]: 'var(--color-creating)',
  [PROJECT_STATUS.WAITING]: 'var(--color-warning)',
  [PROJECT_STATUS.EVALUATING]: 'var(--color-success)',
  [PROJECT_STATUS.COMPLETED]: 'var(--color-primary)',
};

// Evaluation method codes
export const EVAL_METHOD = {
  PAIRWISE_THEORY: 10,
  PAIRWISE_PRACTICAL: 12,
  DIRECT_INPUT: 20,
};

export const EVAL_METHOD_LABELS = {
  [EVAL_METHOD.PAIRWISE_THEORY]: '쌍대비교-이론',
  [EVAL_METHOD.PAIRWISE_PRACTICAL]: '쌍대비교-실용',
  [EVAL_METHOD.DIRECT_INPUT]: '직접입력',
};

// RI table for Consistency Ratio calculation
// Index = matrix size (n), RI[0] and RI[1] are not used
export const RI_TABLE = [
  0,     // n=0 (unused)
  0,     // n=1
  0,     // n=2 (CR always 0)
  0.58,  // n=3
  0.90,  // n=4
  1.12,  // n=5
  1.24,  // n=6
  1.32,  // n=7
  1.41,  // n=8
  1.45,  // n=9
  1.49,  // n=10
  1.51,  // n=11
  1.48,  // n=12
  1.56,  // n=13
  1.57,  // n=14
  1.59,  // n=15
];

// Pairwise comparison scale (1-9)
export const PAIRWISE_SCALE = [
  { value: 1, label: '동등' },
  { value: 2, label: '동등~약간' },
  { value: 3, label: '약간' },
  { value: 4, label: '약간~상당히' },
  { value: 5, label: '상당히' },
  { value: 6, label: '상당히~매우' },
  { value: 7, label: '매우' },
  { value: 8, label: '매우~극히' },
  { value: 9, label: '극히' },
];

// Chart colors for levels
export const LEVEL_COLORS = [
  '#a0a', // Level 1 (purple)
  '#0aa', // Level 2 (cyan)
  '#fa0', // Level 3 (orange)
  '#e55', // Level 4 (red)
  '#5a5', // Level 5 (green)
];

// CR threshold
export const CR_THRESHOLD = 0.1;

// AHP calculation constants
export const AHP_MAX_ITERATIONS = 100;
export const AHP_CONVERGENCE_THRESHOLD = 1e-8;

// Max criteria levels
export const MAX_CRITERIA_LEVELS = 5;

// Modes
export const USER_MODE = {
  ADMIN: 'admin',
  EVALUATOR: 'evaluator',
};

// Point transaction types
export const POINT_TYPE = {
  EARN: 'earn',
  WITHDRAW: 'withdraw',
  WITHDRAW_REFUND: 'withdraw_refund',
  CONVERT: 'convert',
};

export const POINT_TYPE_LABELS = {
  [POINT_TYPE.EARN]: '적립',
  [POINT_TYPE.WITHDRAW]: '출금',
  [POINT_TYPE.WITHDRAW_REFUND]: '출금 환불',
  [POINT_TYPE.CONVERT]: '연구자 전환',
};

// Withdrawal request status
export const WITHDRAWAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const WITHDRAWAL_STATUS_LABELS = {
  [WITHDRAWAL_STATUS.PENDING]: '대기',
  [WITHDRAWAL_STATUS.APPROVED]: '승인',
  [WITHDRAWAL_STATUS.REJECTED]: '거절',
};
