/**
 * 9개 통계분석 결과 렌더러
 */
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Cell, Legend,
} from 'recharts';
import styles from './ResultRenderers.module.css';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];

/* ── 공통 테이블 ── */
function StatsTable({ data, title }) {
  if (!data || data.length === 0) return null;
  const keys = Object.keys(data[0]);
  return (
    <div className={styles.tableWrap}>
      {title && <h4 className={styles.tableTitle}>{title}</h4>}
      <table className={styles.table}>
        <thead>
          <tr>{keys.map(k => <th key={k}>{k}</th>)}</tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>{keys.map(k => {
              const val = row[k];
              const display = val === null || val === undefined ? '-'
                : typeof val === 'number' && !isFinite(val) ? '-'
                : String(val);
              return <td key={k}>{display}</td>;
            })}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── 해석 안내 박스 ── */
function InterpretBox({ text }) {
  if (!text) return null;
  return <div className={styles.interpretBox}>{text}</div>;
}

/* ── 요약 카드 ── */
function SummaryCards({ summary }) {
  if (!summary || summary.error) {
    return <div className={styles.error}>{summary?.error || '결과 없음'}</div>;
  }
  const entries = Object.entries(summary);
  return (
    <div className={styles.summaryGrid}>
      {entries.map(([k, v]) => (
        <div key={k} className={styles.summaryCard}>
          <div className={styles.summaryLabel}>{k}</div>
          <div className={styles.summaryValue}>{String(v)}</div>
        </div>
      ))}
    </div>
  );
}

/* ── 1. 기술통계 ── */
export function DescriptiveResult({ result }) {
  const s = result.summary;
  const skVal = typeof s?.왜도 === 'number' ? s.왜도 : 0;
  const skText = Math.abs(skVal) < 0.5 ? '정규분포에 가까움'
    : skVal > 0 ? '오른쪽 꼬리(양의 왜도)' : '왼쪽 꼬리(음의 왜도)';

  return (
    <div>
      <SummaryCards summary={s} />
      <InterpretBox text={`왜도 해석: ${skText} | 첨도가 0에 가까울수록 정규분포 형태입니다.`} />
      {result.outliers?.count > 0 && (
        <div className={styles.warnBox}>
          이상치 {result.outliers.count}개 감지 (IQR 기준: {result.outliers.lower} ~ {result.outliers.upper} 범위 벗어남). 이상치가 평균과 표준편차에 영향을 줄 수 있습니다.
        </div>
      )}
      {result.chartData?.length > 0 && (
        <div className={styles.chartContainer}>
          <h4 className={styles.chartTitle}>히스토그램</h4>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={result.chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bin" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="빈도" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

/* ── 해석 텍스트 헬퍼 ── */
function pInterpret(p) {
  const pNum = typeof p === 'number' ? p : parseFloat(p);
  if (isNaN(pNum)) return '';
  if (pNum < 0.001) return 'p < 0.001 → 매우 유의한 차이가 있습니다 (***).';
  if (pNum < 0.01) return `p = ${pNum.toFixed(3)} → 유의한 차이가 있습니다 (**).`;
  if (pNum < 0.05) return `p = ${pNum.toFixed(3)} → 유의한 차이가 있습니다 (*).`;
  return `p = ${pNum.toFixed(3)} → 유의한 차이가 없습니다 (p ≥ 0.05).`;
}

/* ── 2. 독립표본 T검정 ── */
export function TTestResult({ result }) {
  const s = result.summary;
  const pText = pInterpret(s?.['p값']);
  const dVal = typeof s?.["Cohen's d"] === 'number' ? s["Cohen's d"] : parseFloat(s?.["Cohen's d"]);
  const dText = !isNaN(dVal)
    ? (Math.abs(dVal) < 0.2 ? '효과 크기: 작음' : Math.abs(dVal) < 0.8 ? '효과 크기: 중간' : '효과 크기: 큼')
    : '';

  return (
    <div>
      <SummaryCards summary={s} />
      <InterpretBox text={[pText, dText].filter(Boolean).join(' | ') || null} />
      <StatsTable data={result.details} title="그룹별 기술통계" />
      {result.chartData?.length > 0 && (
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={result.chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="평균" radius={[4, 4, 0, 0]}>
                {result.chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

/* ── 3. 대응표본 T검정 ── */
export function PairedTTestResult({ result }) {
  const s = result.summary;
  const pText = pInterpret(s?.['p값']);

  return (
    <div>
      <SummaryCards summary={s} />
      <InterpretBox text={pText || null} />
      <StatsTable data={result.details} title="변수별 기술통계" />
      {result.chartData?.length > 0 && (
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={result.chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="평균" radius={[4, 4, 0, 0]}>
                {result.chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

/* ── 4. ANOVA ── */
export function AnovaResult({ result }) {
  const s = result.summary;
  const pText = pInterpret(s?.['p값']);
  const eta = typeof s?.['η²'] === 'number' ? s['η²'] : parseFloat(s?.['η²']);
  const etaText = !isNaN(eta)
    ? (eta < 0.01 ? '효과 크기: 매우 작음' : eta < 0.06 ? '효과 크기: 작음' : eta < 0.14 ? '효과 크기: 중간' : '효과 크기: 큼')
    : '';

  return (
    <div>
      <SummaryCards summary={s} />
      <InterpretBox text={[pText, etaText].filter(Boolean).join(' | ') || null} />
      <StatsTable data={result.details} title="그룹별 기술통계" />
      {result.postHoc && (
        <>
          <InterpretBox text="ANOVA가 유의하므로 Bonferroni 사후검정을 수행했습니다. *표시된 쌍이 유의하게 다릅니다." />
          <StatsTable data={result.postHoc} title="사후검정 (Bonferroni)" />
        </>
      )}
      {result.chartData?.length > 0 && (
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={result.chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="평균" radius={[4, 4, 0, 0]}>
                {result.chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

/* ── 5. 카이제곱 검정 ── */
export function ChiSquareResult({ result }) {
  const s = result.summary;
  const pText = pInterpret(s?.['p값']);
  const vVal = typeof s?.["Cramér's V"] === 'number' ? s["Cramér's V"] : parseFloat(s?.["Cramér's V"]);
  const vText = !isNaN(vVal)
    ? (vVal < 0.1 ? '연관성: 매우 약함' : vVal < 0.3 ? '연관성: 약함~중간' : vVal < 0.5 ? '연관성: 중간~강함' : '연관성: 강함')
    : '';

  return (
    <div>
      <SummaryCards summary={s} />
      <InterpretBox text={[pText, vText].filter(Boolean).join(' | ') || null} />
      <StatsTable data={result.details} title="교차표 (관측빈도)" />
      {result.chartData?.length > 0 && result.categories && (
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={result.chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              {result.categories.map((cat, i) => (
                <Bar key={cat} dataKey={cat} fill={COLORS[i % COLORS.length]} stackId="a" />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

/* ── 6. 상관분석 ── */
export function CorrelationResult({ result }) {
  return (
    <div>
      <SummaryCards summary={result.summary} />
      <InterpretBox text="r < 0.3: 약한 상관 | 0.3~0.7: 중간 상관 | r > 0.7: 강한 상관. p < 0.05이면 상관이 통계적으로 유의합니다." />
      <StatsTable data={result.details} title="상관계수 행렬 (Pearson r)" />
      {result.pMatrix && <StatsTable data={result.pMatrix} title="p값 행렬" />}
      {result.chartData?.length > 0 && (
        <div className={styles.chartContainer}>
          <h4 className={styles.chartTitle}>
            산점도 ({result.labels?.[0]} vs {result.labels?.[1]})
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" name={result.labels?.[0] || 'X'} type="number" />
              <YAxis dataKey="y" name={result.labels?.[1] || 'Y'} type="number" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={result.chartData} fill="#6366f1" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

/* ── 7. 단순선형회귀 ── */
export function RegressionResult({ result }) {
  const s = result.summary;
  const r2 = typeof s?.['R²'] === 'number' ? s['R²'] : parseFloat(s?.['R²']);
  const pText = pInterpret(s?.['p값']);
  const r2Text = !isNaN(r2) ? `R² = ${r2.toFixed(3)} → 독립변수가 종속변수 분산의 ${(r2 * 100).toFixed(1)}%를 설명합니다.` : '';

  return (
    <div>
      <SummaryCards summary={s} />
      <InterpretBox text={[pText, r2Text].filter(Boolean).join(' | ') || null} />
      <StatsTable data={result.details} title="회귀 상세" />
      {result.chartData?.length > 0 && (
        <div className={styles.chartContainer}>
          <h4 className={styles.chartTitle}>회귀선 + 산점도</h4>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" type="number" name="X" />
              <YAxis dataKey="y" type="number" name="Y" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={result.chartData} fill="#6366f1" name="관측값" />
              <Scatter
                data={result.chartData.map(d => ({ x: d.x, y: d.predicted }))}
                fill="#ef4444"
                name="예측값"
                shape="cross"
                legendType="cross"
              />
            </ScatterChart>
          </ResponsiveContainer>
          <h4 className={styles.chartTitle}>잔차도</h4>
          <ResponsiveContainer width="100%" height={200}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" type="number" name="X" />
              <YAxis dataKey="residual" type="number" name="잔차" />
              <Tooltip />
              <Scatter
                data={result.chartData.map(d => ({ x: d.x, residual: d.residual }))}
                fill="#8b5cf6"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

/* ── 8. 크론바흐 알파 ── */
export function CronbachResult({ result }) {
  const s = result.summary;
  const alpha = typeof s?.["Cronbach's α"] === 'number' ? s["Cronbach's α"] : parseFloat(s?.["Cronbach's α"]);
  const alphaText = !isNaN(alpha)
    ? (alpha >= 0.9 ? '신뢰도: 매우 높음 (우수)' : alpha >= 0.8 ? '신뢰도: 높음 (양호)' : alpha >= 0.7 ? '신뢰도: 수용 가능' : alpha >= 0.6 ? '신뢰도: 다소 낮음 (주의)' : '신뢰도: 낮음 (문항 재검토 필요)')
    : '';

  return (
    <div>
      <SummaryCards summary={s} />
      <InterpretBox text={alphaText || null} />
      <StatsTable data={result.details} title="항목별 분석" />
      {result.chartData?.length > 0 && (
        <div className={styles.chartContainer}>
          <h4 className={styles.chartTitle}>항목 삭제 시 알파</h4>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={result.chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 1]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="삭제 시 α" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="항목-총점 상관" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

/* ── 9. 교차분석 ── */
export function CrossTabResult({ result }) {
  const s = result.summary;
  const pText = pInterpret(s?.['p값']);

  return (
    <div>
      <SummaryCards summary={s} />
      <InterpretBox text={pText ? `${pText} 잔차 > 1.96이면 해당 셀이 기대보다 유의하게 많습니다.` : null} />
      <StatsTable data={result.details} title="빈도표" />
      {result.pctTable && <StatsTable data={result.pctTable} title="행 비율표 (%)" />}
      {result.expectedTable && <StatsTable data={result.expectedTable} title="기대빈도" />}
      {result.residualTable && <StatsTable data={result.residualTable} title="잔차 (관측-기대)" />}
      {result.chartData?.length > 0 && result.categories && (
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={result.chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              {result.categories.map((cat, i) => (
                <Bar key={cat} dataKey={cat} fill={COLORS[i % COLORS.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

/* ── 10. Spearman 순위상관 ── */
export function SpearmanResult({ result }) {
  return (
    <div>
      <SummaryCards summary={result.summary} />
      <InterpretBox text="Spearman ρ는 순위 기반 상관이므로 비정규 데이터에도 적합합니다. 해석 기준은 Pearson r과 동일합니다." />
      <StatsTable data={result.details} title="상관계수 행렬 (Spearman ρ)" />
      {result.pMatrix && <StatsTable data={result.pMatrix} title="p값 행렬" />}
      {result.chartData?.length > 0 && (
        <div className={styles.chartContainer}>
          <h4 className={styles.chartTitle}>
            산점도 ({result.labels?.[0]} vs {result.labels?.[1]})
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" name={result.labels?.[0] || 'X'} type="number" />
              <YAxis dataKey="y" name={result.labels?.[1] || 'Y'} type="number" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={result.chartData} fill="#8b5cf6" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

/* ── 결과 렌더러 매핑 ── */
const RENDERERS = {
  descriptive: DescriptiveResult,
  independentT: TTestResult,
  pairedT: PairedTTestResult,
  anova: AnovaResult,
  chiSquare: ChiSquareResult,
  correlation: CorrelationResult,
  regression: RegressionResult,
  cronbach: CronbachResult,
  crossTab: CrossTabResult,
  spearman: SpearmanResult,
};

export default function ResultRenderer({ analysisType, result }) {
  const Comp = RENDERERS[analysisType];
  if (!Comp) return <div>알 수 없는 분석 유형</div>;
  return <Comp result={result} />;
}
