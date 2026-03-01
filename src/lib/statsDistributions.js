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
  if (isNaN(x) || isNaN(a) || isNaN(b)) return NaN;
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  // 대칭 변환: 수렴 속도 향상
  if (x > (a + 1) / (a + b + 2)) {
    return 1 - regularizedBeta(1 - x, b, a);
  }

  // lnBeta(a, b) = gammln(a) + gammln(b) - gammln(a+b)
  const lnBeta = gammln(a) + gammln(b) - gammln(a + b);
  // 안전한 로그 계산: x 또는 (1-x)가 극도로 작을 때 보호
  const lnX = x > 1e-300 ? Math.log(x) : -690;
  const ln1mX = (1 - x) > 1e-300 ? Math.log(1 - x) : -690;
  const lnPre = a * lnX + b * ln1mX - Math.log(a) - lnBeta;
  const front = Math.exp(lnPre);

  if (!isFinite(front) || front === 0) return front < 0 ? 0 : (x < 0.5 ? 0 : 1);

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
      numerator = 1;
    } else {
      const k = m;
      const m2 = Math.floor((k + 1) / 2);
      if (k % 2 === 1) {
        const num = m2 * (b - m2) * x;
        const den = (a + k - 1) * (a + k);
        numerator = num / den;
      } else {
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

  const result = front * f;
  // 결과 범위 클램핑
  return Math.max(0, Math.min(1, result));
}

/**
 * 하부 정규화 불완전 감마 함수 P(a, x) = γ(a, x) / Γ(a)
 * a가 작으면 급수전개, 크면 연분수법 사용
 */
export function regularizedGamma(a, x) {
  if (x < 0 || isNaN(a) || isNaN(x)) return 0;
  if (x === 0) return 0;
  if (a <= 0) return 1;

  if (x < a + 1) {
    // 급수전개
    let sum = 1 / a;
    let term = 1 / a;
    for (let n = 1; n < 200; n++) {
      term *= x / (a + n);
      sum += term;
      if (Math.abs(term) < Math.abs(sum) * 3e-12) break;
    }
    const lnPre = -x + a * Math.log(x) - gammln(a);
    if (lnPre < -700) return 0;
    return Math.max(0, Math.min(1, sum * Math.exp(lnPre)));
  } else {
    // 연분수법으로 Q(a, x) 계산 후 P = 1 - Q
    return Math.max(0, Math.min(1, 1 - _gammaCF(a, x)));
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

  const lnPre = -x + a * Math.log(x) - gammln(a);
  if (lnPre < -700) return 0;
  return Math.max(0, Math.exp(lnPre) * f);
}

/**
 * t분포 → 양측 p값 (two-tailed)
 * I_x(df/2, 1/2) where x = df/(df + t²)  는 양측 p값에 해당
 */
export function tCDF(t, df) {
  if (df <= 0 || isNaN(t) || isNaN(df)) return 1;
  if (t === 0) return 1; // 양측이므로 t=0이면 p=1
  const x = df / (df + t * t);
  const p = regularizedBeta(x, df / 2, 0.5);
  // 이 공식은 P(|T| > |t|)를 직접 반환하므로 양측 p값이 맞음
  return Math.max(0, Math.min(1, p));
}

/**
 * F분포 CDF → p값 (우측)
 * P(F > f) = 1 - I_x(d1/2, d2/2)  where x = d1*f / (d1*f + d2)
 */
export function fCDF(f, df1, df2) {
  if (f <= 0 || isNaN(f)) return 1;
  if (df1 <= 0 || df2 <= 0) return 1;
  const x = (df1 * f) / (df1 * f + df2);
  return Math.max(0, Math.min(1, 1 - regularizedBeta(x, df1 / 2, df2 / 2)));
}

/**
 * 카이제곱 CDF → p값 (우측)
 * P(χ² > x) = 1 - P(k/2, x/2)
 */
export function chiSquaredCDF(x, k) {
  if (x <= 0 || isNaN(x)) return 1;
  if (k <= 0) return 1;
  return Math.max(0, Math.min(1, 1 - regularizedGamma(k / 2, x / 2)));
}

/**
 * 표준정규분포 CDF Φ(z)
 * Horner 형식의 유리 근사법 (Abramowitz & Stegun 26.2.17, 오차 < 7.5e-8)
 */
export function normalCDF(z) {
  if (isNaN(z)) return 0.5;
  if (z < -8) return 0;
  if (z > 8) return 1;

  const neg = z < 0;
  const az = Math.abs(z);
  const t = 1 / (1 + 0.2316419 * az);
  const d = 0.3989422804014327; // 1/sqrt(2π)
  const p = d * Math.exp(-az * az / 2) *
    t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.8212560 + t * 1.3302744))));

  return neg ? p : 1 - p;
}
