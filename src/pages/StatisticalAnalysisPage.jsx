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

const VALID_TYPES = new Set(ANALYSIS_CARDS.map(c => c.key));

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

  const handleExport = () => {
    if (result) exportStatsToExcel(analysisType, result, `project_${id}`);
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
        </div>
      )}

      {/* Step 2: 변수 설정 */}
      {step === 'config' && (
        <VariableSelector
          analysisType={analysisType}
          variables={variables}
          onRun={handleRun}
          onBack={handleBack}
          responseCounts={responseCounts}
        />
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
