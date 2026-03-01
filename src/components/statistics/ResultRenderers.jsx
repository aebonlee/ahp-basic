/**
 * 9개 통계분석 결과 렌더러
 */
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, LineChart, Line, Cell, Legend,
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
            <tr key={i}>{keys.map(k => <td key={k}>{row[k]}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
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
  return (
    <div>
      <SummaryCards summary={result.summary} />
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

/* ── 2. 독립표본 T검정 ── */
export function TTestResult({ result }) {
  return (
    <div>
      <SummaryCards summary={result.summary} />
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
  return (
    <div>
      <SummaryCards summary={result.summary} />
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
  return (
    <div>
      <SummaryCards summary={result.summary} />
      <StatsTable data={result.details} title="그룹별 기술통계" />
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
  return (
    <div>
      <SummaryCards summary={result.summary} />
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
  return (
    <div>
      <SummaryCards summary={result.summary} />
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
  return (
    <div>
      <SummaryCards summary={result.summary} />
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
  return (
    <div>
      <SummaryCards summary={result.summary} />
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
};

export default function ResultRenderer({ analysisType, result }) {
  const Comp = RENDERERS[analysisType];
  if (!Comp) return <div>알 수 없는 분석 유형</div>;
  return <Comp result={result} />;
}
