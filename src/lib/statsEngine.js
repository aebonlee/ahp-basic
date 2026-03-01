/**
 * 통계분석 엔진 — 9개 분석 함수
 * 각 함수는 { summary, details, chartData } 형태로 반환
 */
import { tCDF, fCDF, chiSquaredCDF, normalCDF } from './statsDistributions';

/* ── 유틸리티 ── */
function mean(arr) {
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function variance(arr, ddof = 1) {
  const m = mean(arr);
  const ss = arr.reduce((s, v) => s + (v - m) ** 2, 0);
  return ss / (arr.length - ddof);
}

function std(arr, ddof = 1) {
  return Math.sqrt(variance(arr, ddof));
}

function median(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function mode(arr) {
  const freq = {};
  for (const v of arr) freq[v] = (freq[v] || 0) + 1;
  let maxFreq = 0;
  let modes = [];
  for (const [val, f] of Object.entries(freq)) {
    if (f > maxFreq) {
      maxFreq = f;
      modes = [Number(val)];
    } else if (f === maxFreq) {
      modes.push(Number(val));
    }
  }
  return modes.length === Object.keys(freq).length ? null : modes;
}

function skewness(arr) {
  const n = arr.length;
  if (n < 3) return 0;
  const m = mean(arr);
  const s = std(arr, 1);
  if (s === 0) return 0;
  const m3 = arr.reduce((acc, v) => acc + ((v - m) / s) ** 3, 0);
  return (n / ((n - 1) * (n - 2))) * m3;
}

function kurtosis(arr) {
  const n = arr.length;
  if (n < 4) return 0;
  const m = mean(arr);
  const s = std(arr, 1);
  if (s === 0) return 0;
  const m4 = arr.reduce((acc, v) => acc + ((v - m) / s) ** 4, 0);
  const k = ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * m4
    - (3 * (n - 1) ** 2) / ((n - 2) * (n - 3));
  return k;
}

function round(v, d = 4) {
  return Math.round(v * 10 ** d) / 10 ** d;
}

/* ── 1. 기술통계 ── */
export function descriptiveStats(values) {
  const n = values.length;
  if (n === 0) return { summary: {}, details: [], chartData: [] };

  const sorted = [...values].sort((a, b) => a - b);
  const m = mean(values);
  const med = median(values);
  const mod = mode(values);
  const s = n > 1 ? std(values, 1) : 0;
  const sk = skewness(values);
  const ku = kurtosis(values);

  // 히스토그램 데이터
  const bins = Math.min(Math.max(Math.ceil(Math.sqrt(n)), 5), 20);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const binWidth = max === min ? 1 : (max - min) / bins;
  const histogram = [];
  for (let i = 0; i < bins; i++) {
    const lo = min + i * binWidth;
    const hi = lo + binWidth;
    const count = values.filter(v =>
      i === bins - 1 ? v >= lo && v <= hi : v >= lo && v < hi
    ).length;
    histogram.push({
      bin: `${round(lo, 1)}~${round(hi, 1)}`,
      count,
    });
  }

  return {
    summary: {
      N: n, 평균: round(m), 중앙값: round(med),
      최빈값: mod ? mod.join(', ') : '없음',
      표준편차: round(s), 왜도: round(sk), 첨도: round(ku),
      최솟값: round(sorted[0]), 최댓값: round(sorted[n - 1]),
    },
    details: [],
    chartData: histogram,
  };
}

/* ── 2. 독립표본 T검정 (Welch) ── */
export function independentTTest(group1, group2) {
  const n1 = group1.length, n2 = group2.length;
  if (n1 < 2 || n2 < 2) {
    return { summary: { error: '각 그룹에 최소 2개 데이터 필요' }, details: [], chartData: [] };
  }

  const m1 = mean(group1), m2 = mean(group2);
  const v1 = variance(group1), v2 = variance(group2);
  const se = Math.sqrt(v1 / n1 + v2 / n2);
  const t = (m1 - m2) / se;

  // Welch-Satterthwaite df
  const num = (v1 / n1 + v2 / n2) ** 2;
  const den = (v1 / n1) ** 2 / (n1 - 1) + (v2 / n2) ** 2 / (n2 - 1);
  const df = num / den;

  const pValue = tCDF(t, df);
  const pooledSD = Math.sqrt(((n1 - 1) * v1 + (n2 - 1) * v2) / (n1 + n2 - 2));
  const cohensD = pooledSD > 0 ? Math.abs(m1 - m2) / pooledSD : 0;

  return {
    summary: {
      't값': round(t), '자유도(df)': round(df),
      'p값': round(pValue, 6),
      "Cohen's d": round(cohensD),
      '유의성': pValue < 0.05 ? '유의함 (p < .05)' : '유의하지 않음',
    },
    details: [
      { 그룹: '그룹 1', N: n1, 평균: round(m1), 표준편차: round(Math.sqrt(v1)) },
      { 그룹: '그룹 2', N: n2, 평균: round(m2), 표준편차: round(Math.sqrt(v2)) },
    ],
    chartData: [
      { name: '그룹 1', 평균: round(m1, 2) },
      { name: '그룹 2', 평균: round(m2, 2) },
    ],
  };
}

/* ── 3. 대응표본 T검정 ── */
export function pairedTTest(values1, values2) {
  const n = Math.min(values1.length, values2.length);
  if (n < 2) {
    return { summary: { error: '최소 2개 대응쌍 필요' }, details: [], chartData: [] };
  }

  const diffs = [];
  for (let i = 0; i < n; i++) diffs.push(values1[i] - values2[i]);

  const mD = mean(diffs);
  const sD = std(diffs, 1);
  const se = sD / Math.sqrt(n);
  const t = mD / se;
  const df = n - 1;
  const pValue = tCDF(t, df);

  return {
    summary: {
      '차이 평균': round(mD),
      '차이 표준편차': round(sD),
      't값': round(t),
      '자유도(df)': df,
      'p값': round(pValue, 6),
      '유의성': pValue < 0.05 ? '유의함 (p < .05)' : '유의하지 않음',
    },
    details: [
      { 변수: '변수 1', N: n, 평균: round(mean(values1)), 표준편차: round(std(values1, 1)) },
      { 변수: '변수 2', N: n, 평균: round(mean(values2)), 표준편차: round(std(values2, 1)) },
    ],
    chartData: [
      { name: '변수 1', 평균: round(mean(values1), 2) },
      { name: '변수 2', 평균: round(mean(values2), 2) },
    ],
  };
}

/* ── 4. 일원분산분석(ANOVA) ── */
export function oneWayAnova(groups) {
  // groups: { label: string, values: number[] }[]
  const k = groups.length;
  if (k < 2) {
    return { summary: { error: '최소 2개 그룹 필요' }, details: [], chartData: [] };
  }

  const allValues = groups.flatMap(g => g.values);
  const N = allValues.length;
  const grandMean = mean(allValues);

  // SSB (그룹 간)
  let SSB = 0;
  for (const g of groups) {
    SSB += g.values.length * (mean(g.values) - grandMean) ** 2;
  }

  // SSW (그룹 내)
  let SSW = 0;
  for (const g of groups) {
    const gm = mean(g.values);
    for (const v of g.values) SSW += (v - gm) ** 2;
  }

  const dfB = k - 1;
  const dfW = N - k;
  const MSB = SSB / dfB;
  const MSW = dfW > 0 ? SSW / dfW : 0;
  const F = MSW > 0 ? MSB / MSW : 0;
  const pValue = dfW > 0 ? fCDF(F, dfB, dfW) : 1;
  const etaSquared = (SSB + SSW) > 0 ? SSB / (SSB + SSW) : 0;

  const groupDetails = groups.map(g => ({
    그룹: g.label,
    N: g.values.length,
    평균: round(mean(g.values)),
    표준편차: round(g.values.length > 1 ? std(g.values, 1) : 0),
  }));

  return {
    summary: {
      'F값': round(F),
      'df(그룹 간)': dfB,
      'df(그룹 내)': dfW,
      'p값': round(pValue, 6),
      'η² (에타제곱)': round(etaSquared),
      '유의성': pValue < 0.05 ? '유의함 (p < .05)' : '유의하지 않음',
    },
    details: groupDetails,
    chartData: groups.map(g => ({
      name: g.label,
      평균: round(mean(g.values), 2),
    })),
  };
}

/* ── 5. 카이제곱 검정 ── */
export function chiSquareTest(var1, var2) {
  const n = Math.min(var1.length, var2.length);
  if (n === 0) {
    return { summary: { error: '데이터 없음' }, details: [], chartData: [] };
  }

  // 교차표 생성
  const labels1 = [...new Set(var1)].sort();
  const labels2 = [...new Set(var2)].sort();
  const observed = {};
  const rowTotals = {};
  const colTotals = {};

  for (const r of labels1) {
    observed[r] = {};
    rowTotals[r] = 0;
    for (const c of labels2) {
      observed[r][c] = 0;
    }
  }
  for (const c of labels2) colTotals[c] = 0;

  for (let i = 0; i < n; i++) {
    const r = var1[i], c = var2[i];
    if (observed[r] && observed[r][c] !== undefined) {
      observed[r][c]++;
      rowTotals[r]++;
      colTotals[c]++;
    }
  }

  // 카이제곱 계산
  let chiSq = 0;
  for (const r of labels1) {
    for (const c of labels2) {
      const expected = (rowTotals[r] * colTotals[c]) / n;
      if (expected > 0) {
        chiSq += (observed[r][c] - expected) ** 2 / expected;
      }
    }
  }

  const df = (labels1.length - 1) * (labels2.length - 1);
  const pValue = df > 0 ? chiSquaredCDF(chiSq, df) : 1;
  const minDim = Math.min(labels1.length, labels2.length);
  const cramersV = minDim > 1 && n > 0 ? Math.sqrt(chiSq / (n * (minDim - 1))) : 0;

  // 교차표 details
  const crossTable = labels1.map(r => {
    const row = { 항목: r };
    for (const c of labels2) row[c] = observed[r][c];
    row['합계'] = rowTotals[r];
    return row;
  });
  crossTable.push({
    항목: '합계',
    ...Object.fromEntries(labels2.map(c => [c, colTotals[c]])),
    합계: n,
  });

  return {
    summary: {
      'χ²': round(chiSq),
      '자유도(df)': df,
      'p값': round(pValue, 6),
      "Cramér's V": round(cramersV),
      '유의성': pValue < 0.05 ? '유의함 (p < .05)' : '유의하지 않음',
    },
    details: crossTable,
    chartData: labels1.map(r => ({
      name: r,
      ...Object.fromEntries(labels2.map(c => [c, observed[r][c]])),
    })),
    categories: labels2,
  };
}

/* ── 6. 상관분석 (Pearson) ── */
export function correlationMatrix(varsObj) {
  // varsObj: { label: string, values: number[] }[]
  const vars = varsObj;
  const k = vars.length;
  const n = Math.min(...vars.map(v => v.values.length));

  const rMatrix = [];
  const pMatrix = [];

  for (let i = 0; i < k; i++) {
    const rRow = [];
    const pRow = [];
    for (let j = 0; j < k; j++) {
      if (i === j) {
        rRow.push(1);
        pRow.push(0);
      } else {
        const { r, p } = pearsonR(vars[i].values.slice(0, n), vars[j].values.slice(0, n));
        rRow.push(r);
        pRow.push(p);
      }
    }
    rMatrix.push(rRow);
    pMatrix.push(pRow);
  }

  // 상관 테이블
  const labels = vars.map(v => v.label);
  const details = labels.map((l, i) => {
    const row = { 변수: l };
    for (let j = 0; j < k; j++) {
      row[labels[j]] = round(rMatrix[i][j]);
    }
    return row;
  });

  // 산점도 데이터 (첫 2개 변수)
  const chartData = [];
  if (k >= 2) {
    for (let i = 0; i < n; i++) {
      chartData.push({ x: vars[0].values[i], y: vars[1].values[i] });
    }
  }

  return {
    summary: {
      '변수 수': k,
      'N': n,
      '상관행렬': '아래 테이블 참조',
    },
    details,
    pMatrix: labels.map((l, i) => {
      const row = { 변수: l };
      for (let j = 0; j < k; j++) {
        row[labels[j]] = i === j ? '-' : round(pMatrix[i][j], 6);
      }
      return row;
    }),
    chartData,
    labels,
  };
}

function pearsonR(x, y) {
  const n = x.length;
  if (n < 3) return { r: 0, p: 1 };

  const mx = mean(x), my = mean(y);
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx, dy = y[i] - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }

  const denom = Math.sqrt(dx2 * dy2);
  if (denom === 0) return { r: 0, p: 1 };

  const r = num / denom;
  // t-test for r
  const t = r * Math.sqrt((n - 2) / (1 - r * r));
  const p = tCDF(t, n - 2);

  return { r, p };
}

/* ── 7. 단순선형회귀 ── */
export function linearRegression(x, y) {
  const n = x.length;
  if (n < 3) {
    return { summary: { error: '최소 3개 데이터 필요' }, details: [], chartData: [] };
  }

  const mx = mean(x), my = mean(y);
  let ssXY = 0, ssXX = 0, ssYY = 0;
  for (let i = 0; i < n; i++) {
    ssXY += (x[i] - mx) * (y[i] - my);
    ssXX += (x[i] - mx) ** 2;
    ssYY += (y[i] - my) ** 2;
  }

  const beta = ssXX > 0 ? ssXY / ssXX : 0;
  const intercept = my - beta * mx;
  const rSquared = ssYY > 0 ? (ssXY ** 2) / (ssXX * ssYY) : 0;

  // 잔차
  const predicted = x.map(xi => intercept + beta * xi);
  const residuals = y.map((yi, i) => yi - predicted[i]);
  const ssRes = residuals.reduce((s, r) => s + r * r, 0);
  const mse = ssRes / (n - 2);
  const seBeta = ssXX > 0 ? Math.sqrt(mse / ssXX) : 0;
  const tStat = seBeta > 0 ? beta / seBeta : 0;
  const pValue = tCDF(tStat, n - 2);

  // 차트 데이터
  const chartData = x.map((xi, i) => ({
    x: round(xi, 2),
    y: round(y[i], 2),
    predicted: round(predicted[i], 2),
    residual: round(residuals[i], 2),
  }));

  return {
    summary: {
      'R²': round(rSquared),
      '절편(β₀)': round(intercept),
      '기울기(β₁)': round(beta),
      't값': round(tStat),
      'p값': round(pValue, 6),
      '표준오차': round(seBeta),
      '유의성': pValue < 0.05 ? '유의함 (p < .05)' : '유의하지 않음',
    },
    details: [
      { 항목: '회귀식', 값: `y = ${round(intercept, 2)} + ${round(beta, 2)}x` },
      { 항목: 'MSE', 값: round(mse) },
      { 항목: 'SSR', 값: round(ssXY ** 2 / ssXX) },
      { 항목: 'SSE', 값: round(ssRes) },
    ],
    chartData,
  };
}

/* ── 8. 크론바흐 알파 ── */
export function cronbachAlpha(itemsMatrix) {
  // itemsMatrix: number[][] (rows = respondents, cols = items)
  const n = itemsMatrix.length;
  const k = itemsMatrix[0]?.length || 0;
  if (n < 2 || k < 2) {
    return { summary: { error: '최소 2명 응답, 2개 항목 필요' }, details: [], chartData: [] };
  }

  // 항목별 분산
  const itemVariances = [];
  for (let j = 0; j < k; j++) {
    const col = itemsMatrix.map(row => row[j]);
    itemVariances.push(variance(col, 1));
  }

  // 총점 분산
  const totals = itemsMatrix.map(row => row.reduce((s, v) => s + v, 0));
  const totalVar = variance(totals, 1);

  const sumItemVar = itemVariances.reduce((s, v) => s + v, 0);
  const alpha = totalVar > 0 ? (k / (k - 1)) * (1 - sumItemVar / totalVar) : 0;

  // 항목 삭제 시 알파
  const itemDetails = [];
  for (let j = 0; j < k; j++) {
    // j번째 항목 제외
    const subMatrix = itemsMatrix.map(row => row.filter((_, idx) => idx !== j));
    const subK = k - 1;
    const subItemVars = [];
    for (let c = 0; c < subK; c++) {
      const col = subMatrix.map(row => row[c]);
      subItemVars.push(variance(col, 1));
    }
    const subTotals = subMatrix.map(row => row.reduce((s, v) => s + v, 0));
    const subTotalVar = variance(subTotals, 1);
    const subAlpha = subTotalVar > 0 ? (subK / (subK - 1)) * (1 - subItemVars.reduce((s, v) => s + v, 0) / subTotalVar) : 0;

    // 항목-총점 상관
    const col = itemsMatrix.map(row => row[j]);
    const { r } = pearsonR(col, totals);

    itemDetails.push({
      항목: `항목 ${j + 1}`,
      '항목-총점 상관': round(r),
      '삭제 시 α': round(subAlpha),
    });
  }

  return {
    summary: {
      "Cronbach's α": round(alpha),
      '항목 수': k,
      '응답자 수': n,
      '신뢰도 판단': alpha >= 0.9 ? '매우 우수' :
        alpha >= 0.8 ? '우수' :
        alpha >= 0.7 ? '양호' :
        alpha >= 0.6 ? '보통' : '미흡',
    },
    details: itemDetails,
    chartData: itemDetails.map(d => ({
      name: d.항목,
      '삭제 시 α': d['삭제 시 α'],
      '항목-총점 상관': d['항목-총점 상관'],
    })),
  };
}

/* ── 9. 교차분석 ── */
export function crossTabulation(var1, var2) {
  const n = Math.min(var1.length, var2.length);
  if (n === 0) {
    return { summary: { error: '데이터 없음' }, details: [], chartData: [] };
  }

  const labels1 = [...new Set(var1)].sort();
  const labels2 = [...new Set(var2)].sort();

  // 빈도표
  const freq = {};
  const rowTotals = {};
  const colTotals = {};
  for (const r of labels1) {
    freq[r] = {};
    rowTotals[r] = 0;
    for (const c of labels2) freq[r][c] = 0;
  }
  for (const c of labels2) colTotals[c] = 0;

  for (let i = 0; i < n; i++) {
    const r = var1[i], c = var2[i];
    if (freq[r] && freq[r][c] !== undefined) {
      freq[r][c]++;
      rowTotals[r]++;
      colTotals[c]++;
    }
  }

  // 빈도표
  const freqTable = labels1.map(r => {
    const row = { 항목: r };
    for (const c of labels2) row[c] = freq[r][c];
    row['합계'] = rowTotals[r];
    return row;
  });
  freqTable.push({
    항목: '합계',
    ...Object.fromEntries(labels2.map(c => [c, colTotals[c]])),
    합계: n,
  });

  // 비율표 (행 퍼센트)
  const pctTable = labels1.map(r => {
    const row = { 항목: r };
    for (const c of labels2) {
      row[c] = rowTotals[r] > 0 ? round(freq[r][c] / rowTotals[r] * 100, 1) + '%' : '0%';
    }
    return row;
  });

  // 기대빈도
  const expectedTable = labels1.map(r => {
    const row = { 항목: r };
    for (const c of labels2) {
      row[c] = round(rowTotals[r] * colTotals[c] / n, 1);
    }
    return row;
  });

  // 잔차 (관측 - 기대)
  const residualTable = labels1.map(r => {
    const row = { 항목: r };
    for (const c of labels2) {
      const expected = rowTotals[r] * colTotals[c] / n;
      row[c] = round(freq[r][c] - expected, 2);
    }
    return row;
  });

  return {
    summary: {
      '행 변수 범주 수': labels1.length,
      '열 변수 범주 수': labels2.length,
      '총 관측 수': n,
    },
    details: freqTable,
    pctTable,
    expectedTable,
    residualTable,
    chartData: labels1.map(r => ({
      name: r,
      ...Object.fromEntries(labels2.map(c => [c, freq[r][c]])),
    })),
    categories: labels2,
  };
}
