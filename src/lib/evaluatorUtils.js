/**
 * 숫자만 추출 후 한국 전화번호 형식으로 포맷팅
 * 01012345678 → 010-1234-5678
 */
export function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export function findEvaluatorId(evaluators, user, projectId) {
  // 1. 로그인 사용자: user_id 매칭 (기존 로직)
  if (user?.id) {
    const match = evaluators.find(e => e.user_id === user.id);
    if (match) return match.id;
  }
  // 2. 전화번호 인증 사용자: sessionStorage에서 evaluatorId
  const storedId = sessionStorage.getItem(`evaluator_${projectId}`);
  if (storedId) {
    const match = evaluators.find(e => e.id === storedId);
    if (match) return match.id;
  }
  return null;
}
