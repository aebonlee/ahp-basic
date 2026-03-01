/**
 * 통계 분포 CDF 함수 — 순수 JavaScript 구현
 * t분포, F분포, 카이제곱 분포의 p값 계산에 사용
 */

/** Lanczos 근사법으로 ln(Γ(x)) 계산 */
export function gammln(x) {
  const cof = [
    76.18009172947146, -86.50532032941677,
    24.01409824083091, -1.231739572450155,
    0.1208650973866179e-2, -0.5395239384953e-5,
  ];
  let y = x;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) {
    ser += cof[j] / ++y;
  }
  return -tmp + Math.log(2.5066282746310005 * ser / x);
}

/**
 * 정규화 불완전 베타 함수 I_x(a, b)
 * Lentz 연분수법 사용
 */
export function regularizedBeta(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  // 대칭 변환: 수렴 속도 향상
  if (x > (a + 1) / (a + b + 2)) {
    return 1 - regularizedBeta(1 - x, b, a);
  }

  const lnPre = a * Math.log(x) + b * Math.log(1 - x) - Math.log(a) -
    (gammln(a) + gammln(b) - gammln(a + b));
  const front = Math.exp(lnPre);

  // Lentz 연분수법
  const maxIter = 200;
  const eps = 3e-12;
  const tiny = 1e-30;

  let f = tiny;
  let C = tiny;
  let D = 0;

  for (let m = 0; m <= maxIter; m++) {
    let numerator;
    if (m === 0) {
      numerator = 1; // a_0 = 1
    } else {
      const k = m;
      const m2 = Math.floor((k + 1) / 2);
      if (k % 2 === 1) {
        // 홀수항: d_{2m+1}
        const num = m2 * (b - m2) * x;
        const den = (a + k - 1) * (a + k);
        numerator = num / den;
      } else {
        // 짝수항: d_{2m}
        const num = -(a + m2 - 1) * (a + b + m2 - 1) * x;
        const den = (a + k - 1) * (a + k);
        numerator = num / den;
      }
    }

    D = 1 + numerator * D;
    if (Math.abs(D) < tiny) D = tiny;
    D = 1 / D;

    C = 1 + numerator / C;
    if (Math.abs(C) < tiny) C = tiny;

    const delta = C * D;
    f *= delta;

    if (Math.abs(delta - 1) < eps && m > 0) break;
  }

  return front * f;
}

/**
 * 하부 정규화 불완전 감마 함수 P(a, x) = γ(a, x) / Γ(a)
 * a가 작으면 급수전개, 크면 연분수법 사용
 */
export function regularizedGamma(a, x) {
  if (x < 0) return 0;
  if (x === 0) return 0;

  if (x < a + 1) {
    // 급수전개: P(a, x) = e^(-x) x^a Σ x^n / Γ(a + n + 1)
    let sum = 1 / a;
    let term = 1 / a;
    for (let n = 1; n < 200; n++) {
      term *= x / (a + n);
      sum += term;
      if (Math.abs(term) < Math.abs(sum) * 3e-12) break;
    }
    return sum * Math.exp(-x + a * Math.log(x) - gammln(a));
  } else {
    // 연분수법으로 Q(a, x) 계산 후 P = 1 - Q
    const tiny = 1e-30;
    let f = tiny;
    let C = tiny;
    let D = 0;

    for (let i = 1; i < 200; i++) {
      const an = i % 2 === 1
        ? (Math.ceil(i / 2)) // 홀수: n
        : -(a + Math.floor(i / 2) - 1); // 짝수: -(a + m - 1)
      const bn = i === 1 ? x - a + 1 : (i % 2 === 1 ? x + i - 1 : i / 2);

      // 간소화된 Lentz: 표준 연분수법으로 Q(a,x) 계산
      D = bn + an * D;
      if (Math.abs(D) < tiny) D = tiny;
      D = 1 / D;

      C = bn + an / C;
      if (Math.abs(C) < tiny) C = tiny;

      const delta = C * D;
      f *= delta;

      if (Math.abs(delta - 1) < 3e-12 && i > 1) break;
    }

    const Q = Math.exp(-x + a * Math.log(x) - gammln(a)) * (1 / (x - a + 1)) * f;
    // 이 방법이 불안정할 수 있으므로, 더 안정적인 방법 사용
    return 1 - _gammaCF(a, x);
  }
}

/** 연분수법으로 Q(a, x) = 1 - P(a, x) 계산 */
function _gammaCF(a, x) {
  const tiny = 1e-30;
  let b = x + 1 - a;
  let C = 1 / tiny;
  let D = 1 / b;
  let f = D;

  for (let i = 1; i < 200; i++) {
    const an = -i * (i - a);
    b += 2;
    D = an * D + b;
    if (Math.abs(D) < tiny) D = tiny;
    D = 1 / D;
    C = b + an / C;
    if (Math.abs(C) < tiny) C = tiny;
    const delta = D * C;
    f *= delta;
    if (Math.abs(delta - 1) < 3e-12) break;
  }

  return Math.exp(-x + a * Math.log(x) - gammln(a)) * f;
}

/**
 * t분포 CDF → 양측 p값
 * @returns {number} 양측 p값 (two-tailed)
 */
export function tCDF(t, df) {
  const x = df / (df + t * t);
  const p = regularizedBeta(x, df / 2, 0.5);
  return p; // 양측 p값
}

/**
 * F분포 CDF → p값 (우측)
 * P(F > f) = 1 - I_x(d1/2, d2/2)  where x = d1*f / (d1*f + d2)
 */
export function fCDF(f, df1, df2) {
  if (f <= 0) return 1;
  const x = (df1 * f) / (df1 * f + df2);
  return 1 - regularizedBeta(x, df1 / 2, df2 / 2);
}

/**
 * 카이제곱 CDF → p값 (우측)
 * P(χ² > x) = 1 - P(k/2, x/2)
 */
export function chiSquaredCDF(x, k) {
  if (x <= 0) return 1;
  return 1 - regularizedGamma(k / 2, x / 2);
}

/**
 * 표준정규분포 CDF Φ(z) — 오차함수 근사법
 */
export function normalCDF(z) {
  // Abramowitz and Stegun 근사법
  if (z < -8) return 0;
  if (z > 8) return 1;

  let sum = 0;
  let term = z;
  for (let i = 3; sum + term !== sum; i += 2) {
    sum += term;
    term = term * z * z / i;
  }
  return 0.5 + sum * Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
}
