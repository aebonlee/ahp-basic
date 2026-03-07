/**
 * 통계분석 페이지 — SPSS 대체 통계분석
 * 3단계 UI: 분석 유형 카드 선택 → 변수 설정 → 결과 표시
 */
import { useState, useCallback, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import ProjectLayout from '../components/layout/ProjectLayout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import VariableSelector from '../components/statistics/VariableSelector';
import ResultRenderer from '../components/statistics/ResultRenderers';
import { useStatisticalAnalysis } from '../hooks/useStatisticalAnalysis';
import { useToast } from '../contexts/ToastContext';
import {
  descriptiveStats, independentTTest, pairedTTest, oneWayAnova,
  chiSquareTest, correlationMatrix, spearmanCorrelation, linearRegression,
  cronbachAlpha, crossTabulation,
} from '../lib/statsEngine';
import { exportStatsToExcel } from '../lib/statsExport';
import common from '../styles/common.module.css';
import styles from './StatisticalAnalysisPage.module.css';

const ANALYSIS_CARDS = [
  { key: 'descriptive',  icon: '\u{1F4CA}', title: '기술통계',         desc: '평균, 표준편차, 왜도, 첨도 등' },
  { key: 'independentT', icon: '\u{1F4CF}', title: '독립표본 T검정',   desc: '두 집단 간 평균 차이 검정' },
  { key: 'pairedT',      icon: '\u{1F501}', title: '대응표본 T검정',   desc: '사전-사후 비교 등 대응 검정' },
  { key: 'anova',        icon: '\u{1F4C8}', title: '일원분산분석',     desc: '3개 이상 집단 간 평균 비교' },
  { key: 'chiSquare',    icon: '\u{1F4CB}', title: '카이제곱 검정',    desc: '범주형 변수 간 독립성 검정' },
  { key: 'correlation',  icon: '\u{1F517}', title: '상관분석',         desc: 'Pearson 상관계수 행렬' },
  { key: 'regression',   icon: '\u{1F4C9}', title: '단순선형회귀',     desc: '독립-종속 변수 회귀 분석' },
  { key: 'cronbach',     icon: '\u{2705}',  title: '크론바흐 알파',    desc: '리커트 문항 신뢰도 분석' },
  { key: 'crossTab',     icon: '\u{1F5C2}', title: '교차분석',         desc: '빈도표, 비율, 기대빈도, 잔차' },
  { key: 'spearman',     icon: '\u{1F4C7}', title: 'Spearman 순위상관', desc: '비정규 데이터 순위 상관분석' },
];

const VALID_TYPES = new Set([...ANALYSIS_CARDS.map(c => c.key), 'guide']);

const GUIDE_SECTIONS = [
  {
    title: '1. 어떤 분석을 선택해야 할까?',
    content: [
      { q: '변수 하나의 분포를 파악하고 싶다', a: '기술통계', key: 'descriptive' },
      { q: '두 집단(예: 남/여)의 평균 차이를 비교하고 싶다', a: '독립표본 T검정', key: 'independentT' },
      { q: '같은 집단의 사전-사후 차이를 비교하고 싶다', a: '대응표본 T검정', key: 'pairedT' },
      { q: '3개 이상 집단의 평균 차이를 비교하고 싶다', a: '일원분산분석 (ANOVA)', key: 'anova' },
      { q: '두 범주형 변수의 연관성을 보고 싶다', a: '카이제곱 검정', key: 'chiSquare' },
      { q: '두 수치 변수 간 관련성 방향과 크기를 알고 싶다', a: '상관분석 (Pearson)', key: 'correlation' },
      { q: '순위 데이터이거나 정규분포가 아닌 경우', a: 'Spearman 순위상관', key: 'spearman' },
      { q: '독립변수(X)로 종속변수(Y)를 예측하고 싶다', a: '단순선형회귀', key: 'regression' },
      { q: '리커트 척도 문항의 내적 일관성을 확인하고 싶다', a: '크론바흐 알파', key: 'cronbach' },
      { q: '두 범주형 변수의 빈도/비율/기대빈도를 상세히 보고 싶다', a: '교차분석', key: 'crossTab' },
    ],
  },
  {
    title: '2. p값 해석 가이드',
    table: {
      headers: ['p값 범위', '판정', '의미'],
      rows: [
        ['p < 0.001', '매우 유의 (***)', '차이/관계가 매우 강하게 지지됨'],
        ['p < 0.01', '유의 (**)', '통계적으로 유의한 결과'],
        ['p < 0.05', '유의 (*)', '일반적 유의수준 충족'],
        ['p < 0.10', '경계 유의', '추가 데이터 수집 권장'],
        ['p ≥ 0.10', '유의하지 않음', '귀무가설을 기각하기 어려움'],
      ],
    },
  },
  {
    title: '3. 효과크기 해석 기준',
    table: {
      headers: ['지표', '작은 효과', '중간 효과', '큰 효과'],
      rows: [
        ["Cohen's d (T검정)", '0.2', '0.5', '0.8'],
        ['η² (ANOVA)', '0.01', '0.06', '0.14'],
        ['r (상관)', '0.1', '0.3', '0.5'],
        ["Cramér's V (χ²)", '0.1', '0.3', '0.5'],
        ['R² (회귀)', '0.02', '0.13', '0.26'],
      ],
    },
  },
  {
    title: '4. 크론바흐 알파 신뢰도 기준',
    table: {
      headers: ['α 범위', '신뢰도 판단', '권고'],
      rows: [
        ['α ≥ 0.9', '매우 우수', '그대로 사용'],
        ['0.8 ≤ α < 0.9', '우수', '그대로 사용'],
        ['0.7 ≤ α < 0.8', '양호', '그대로 사용 (탐색적 연구)'],
        ['0.6 ≤ α < 0.7', '보통', '항목 제거/수정 검토'],
        ['α < 0.6', '미흡', '문항 재구성 필요'],
      ],
    },
  },
  {
    title: '5. 분석 전 체크리스트',
    checklist: [
      '데이터 수집이 완료되었는지 확인 (응답자 수 ≥ 30 권장)',
      '결측값이나 이상치가 없는지 기술통계로 먼저 확인',
      '수치형 변수와 범주형 변수를 구분하여 적절한 분석 선택',
      'T검정/ANOVA는 수치형 종속변수 + 범주형 독립변수 필요',
      '상관/회귀 분석은 두 변수 모두 수치형이어야 함',
      '카이제곱/교차분석은 두 변수 모두 범주형이어야 함',
      '크론바흐 알파는 같은 척도(리커트)의 문항 3개 이상 필요',
    ],
  },
  {
    title: '6. 용어 사전',
    glossary: [
      { term: '귀무가설 (H₀)', def: '차이/관계가 없다는 가설. p값이 0.05 미만이면 기각' },
      { term: '자유도 (df)', def: '통계량 계산에 사용된 독립적 정보의 수' },
      { term: '표준편차 (SD)', def: '데이터가 평균에서 얼마나 퍼져 있는지 나타내는 척도' },
      { term: '왜도 (Skewness)', def: '분포의 비대칭 정도. 0이면 대칭, 양수면 오른쪽 꼬리' },
      { term: '첨도 (Kurtosis)', def: '분포의 꼬리 두께. 0이면 정규분포, 양수면 뾰족한 분포' },
      { term: 'Bonferroni 보정', def: 'ANOVA 사후검정에서 다중 비교 시 유의수준을 조정하는 방법' },
    ],
  },
];

function StatsGuide({ onBack, onSelect }) {
  return (
    <div className={styles.guideWrap}>
      <div className={styles.guideHeader}>
        <button className={styles.backBtn} onClick={onBack}>&larr; 분석 선택</button>
        <h2 className={styles.guideTitle}>통계 분석 가이드</h2>
      </div>

      {GUIDE_SECTIONS.map((section, si) => (
        <section key={si} className={styles.guideSection}>
          <h3 className={styles.guideSectionTitle}>{section.title}</h3>

          {/* 분석 선택 안내 (클릭 가능) */}
          {section.content && (
            <div className={styles.guideList}>
              {section.content.map((item, i) => (
                <button
                  key={i}
                  className={styles.guideItem}
                  onClick={() => onSelect(item.key)}
                >
                  <span className={styles.guideQ}>{item.q}</span>
                  <span className={styles.guideA}>&rarr; {item.a}</span>
                </button>
              ))}
            </div>
          )}

          {/* 테이블 형태 */}
          {section.table && (
            <div className={styles.guideTableWrap}>
              <table className={styles.guideTable}>
                <thead>
                  <tr>{section.table.headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {section.table.rows.map((row, ri) => (
                    <tr key={ri}>{row.map((cell, ci) => <td key={ci}>{cell}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 체크리스트 */}
          {section.checklist && (
            <ul className={styles.guideChecklist}>
              {section.checklist.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          )}

          {/* 용어 사전 */}
          {section.glossary && (
            <dl className={styles.guideGlossary}>
              {section.glossary.map((item, i) => (
                <div key={i} className={styles.glossaryItem}>
                  <dt>{item.term}</dt>
                  <dd>{item.def}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>
      ))}
    </div>
  );
}

export default function StatisticalAnalysisPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const {
    loading, variables, respondentCount, responseCounts,
    getNumericValues, getCategoricalValues,
    getGroupedNumericValues, getItemMatrix, getPairedValues,
  } = useStatisticalAnalysis(id);

  const [step, setStep] = useState('select'); // 'select' | 'config' | 'result'
  const [analysisType, setAnalysisType] = useState(null);
  const [result, setResult] = useState(null);

  // URL ?type= 파라미터로 바로 분석 유형 진입
  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam && VALID_TYPES.has(typeParam)) {
      setAnalysisType(typeParam);
      setStep('config');
      setResult(null);
    }
  }, [searchParams]);

  const handleSelectAnalysis = (key) => {
    navigate(`/admin/project/${id}/statistics?type=${key}`, { replace: true });
  };

  const handleBack = () => {
    if (step === 'result') {
      setStep('config');
      setResult(null);
    } else {
      setStep('select');
      setAnalysisType(null);
      navigate(`/admin/project/${id}/statistics`, { replace: true });
    }
  };

  const handleRun = useCallback((selections) => {
    try {
      let res;

      switch (analysisType) {
        case 'descriptive': {
          const vals = getNumericValues(selections.variable);
          res = descriptiveStats(vals);
          break;
        }
        case 'independentT': {
          const groups = getGroupedNumericValues(selections.groupVar, selections.testVar);
          if (groups.length < 2) {
            res = { summary: { error: '2개 집단이 필요합니다. 그룹 변수의 범주가 2개 이상인지 확인하세요.' }, details: [], chartData: [] };
          } else {
            if (groups.length > 2) {
              toast.warning(`${groups.length}개 그룹 감지 — 처음 2개 그룹(${groups[0].label}, ${groups[1].label})만 비교합니다.`);
            }
            res = independentTTest(groups[0].values, groups[1].values);
            res.details = res.details.map((d, i) => ({
              ...d, 그룹: groups[i]?.label || d.그룹,
            }));
          }
          break;
        }
        case 'pairedT': {
          const { values1, values2 } = getPairedValues(selections.var1, selections.var2);
          res = pairedTTest(values1, values2);
          break;
        }
        case 'anova': {
          const groups = getGroupedNumericValues(selections.groupVar, selections.testVar);
          if (groups.length < 2) {
            res = { summary: { error: '최소 2개 집단이 필요합니다.' }, details: [], chartData: [] };
          } else {
            res = oneWayAnova(groups);
          }
          break;
        }
        case 'chiSquare': {
          const v1 = getCategoricalValues(selections.var1);
          const v2 = getCategoricalValues(selections.var2);
          res = chiSquareTest(v1, v2);
          break;
        }
        case 'correlation': {
          const vars = selections.variables.map(qid => {
            const q = variables.numeric.find(v => v.id === qid);
            return { label: q?.label || qid, values: getNumericValues(qid) };
          });
          res = correlationMatrix(vars);
          break;
        }
        case 'regression': {
          const { values1, values2 } = getPairedValues(selections.xVar, selections.yVar);
          res = linearRegression(values1, values2);
          break;
        }
        case 'cronbach': {
          const matrix = getItemMatrix(selections.items);
          res = cronbachAlpha(matrix);
          break;
        }
        case 'crossTab': {
          const v1 = getCategoricalValues(selections.var1);
          const v2 = getCategoricalValues(selections.var2);
          res = crossTabulation(v1, v2);
          break;
        }
        case 'spearman': {
          const vars = selections.variables.map(qid => {
            const q = variables.numeric.find(v => v.id === qid);
            return { label: q?.label || qid, values: getNumericValues(qid) };
          });
          res = spearmanCorrelation(vars);
          break;
        }
        default:
          res = { summary: { error: '알 수 없는 분석 유형' }, details: [], chartData: [] };
      }

      setResult(res);
      setStep('result');
    } catch (err) {
      toast.error(`분석 실행 중 오류: ${err.message || '알 수 없는 오류'}`);
    }
  }, [analysisType, getNumericValues, getCategoricalValues, getGroupedNumericValues, getItemMatrix, getPairedValues, variables, toast]);

  const handleExport = async () => {
    if (result) await exportStatsToExcel(analysisType, result, `project_${id}`);
  };

  if (loading) {
    return <ProjectLayout><LoadingSpinner message="데이터 로딩 중..." /></ProjectLayout>;
  }

  return (
    <ProjectLayout>
      <h1 className={common.pageTitle}>통계 분석</h1>

      {/* 응답 현황 */}
      <div className={styles.infoBar}>
        <span>응답자: <strong>{respondentCount}명</strong></span>
        <span>수치 변수: <strong>{variables.numeric.length}개</strong></span>
        <span>범주 변수: <strong>{variables.categorical.length}개</strong></span>
      </div>

      {/* Step 1: 분석 유형 선택 */}
      {step === 'select' && (
        <div className={styles.cardGrid}>
          {ANALYSIS_CARDS.map(card => (
            <button
              key={card.key}
              className={styles.card}
              onClick={() => handleSelectAnalysis(card.key)}
            >
              <span className={styles.cardIcon}>{card.icon}</span>
              <span className={styles.cardTitle}>{card.title}</span>
              <span className={styles.cardDesc}>{card.desc}</span>
            </button>
          ))}
          <button
            className={`${styles.card} ${styles.guideCard}`}
            onClick={() => handleSelectAnalysis('guide')}
          >
            <span className={styles.cardIcon}>{'\u{1F4D6}'}</span>
            <span className={styles.cardTitle}>통계 가이드</span>
            <span className={styles.cardDesc}>분석 방법 선택 안내 및 해석 가이드</span>
          </button>
        </div>
      )}

      {/* Step 2: 변수 설정 (가이드가 아닌 경우) */}
      {step === 'config' && analysisType !== 'guide' && (
        <VariableSelector
          analysisType={analysisType}
          variables={variables}
          onRun={handleRun}
          onBack={handleBack}
          responseCounts={responseCounts}
        />
      )}

      {/* 통계 가이드 */}
      {step === 'config' && analysisType === 'guide' && (
        <StatsGuide onBack={handleBack} onSelect={handleSelectAnalysis} />
      )}

      {/* Step 3: 결과 표시 */}
      {step === 'result' && result && (
        <div className={styles.resultWrap}>
          <div className={styles.resultHeader}>
            <button className={styles.backBtn} onClick={handleBack}>&larr; 변수 변경</button>
            <button className={styles.backBtn} onClick={() => { setStep('select'); setAnalysisType(null); setResult(null); navigate(`/admin/project/${id}/statistics`, { replace: true }); }}>
              &larr; 다른 분석
            </button>
            <button className={styles.exportBtn} onClick={handleExport}>
              Excel 내보내기
            </button>
          </div>
          <ResultRenderer analysisType={analysisType} result={result} />
        </div>
      )}

      {/* 변수 없을 때 */}
      {variables.all.length === 0 && step === 'select' && (
        <div className={styles.emptyMsg}>
          설문에 수치형(숫자/리커트) 또는 범주형(객관식/드롭다운) 질문이 없습니다.
          <br />설문 설계에서 질문을 먼저 추가해주세요.
        </div>
      )}
    </ProjectLayout>
  );
}
