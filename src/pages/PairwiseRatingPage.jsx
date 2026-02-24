import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useEvaluation } from '../contexts/EvaluationContext';
import { useAuth } from '../hooks/useAuth';
import { useEvaluators } from '../hooks/useEvaluators';
import { buildPageSequence } from '../lib/pairwiseUtils';
import PageLayout from '../components/layout/PageLayout';
import PairwiseGrid from '../components/evaluation/PairwiseGrid';
import PriorityBarChart from '../components/evaluation/PriorityBarChart';
import ConsistencyDisplay from '../components/evaluation/ConsistencyDisplay';
import BestFitHelper from '../components/evaluation/BestFitHelper';
import PageNavigator from '../components/evaluation/PageNavigator';
import EvaluationProgress from '../components/evaluation/EvaluationProgress';
import AhpIntroduction from '../components/evaluation/AhpIntroduction';
import LoadingSpinner from '../components/common/LoadingSpinner';
import HelpButton from '../components/common/HelpButton';
import { usePairwiseComparison } from '../hooks/usePairwiseComparison';
import { CR_THRESHOLD } from '../lib/constants';
import styles from './PairwiseRatingPage.module.css';

export default function PairwiseRatingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { evaluators } = useEvaluators(id);
  const { criteria, alternatives, comparisons, loading, loadProjectData } = useEvaluation();
  const [currentPage, setCurrentPage] = useState(0);
  const [showIntro, setShowIntro] = useState(true);

  // Handle #page=N hash navigation (from result page "돌아가기")
  useEffect(() => {
    const hash = location.hash;
    const match = hash.match(/page=(\d+)/);
    if (match) {
      const pageIdx = parseInt(match[1], 10);
      setCurrentPage(pageIdx);
      setShowIntro(false);
    }
  }, [location.hash]);

  // evaluators.id (FK target) vs user?.id (auth UUID) — must use evaluators.id
  const evaluatorId = useMemo(() => {
    return evaluators.find(e => e.user_id === user?.id)?.id || null;
  }, [evaluators, user?.id]);

  // 설문 완료 여부 체크 → 미완료면 pre-survey로 리다이렉트
  useEffect(() => {
    if (!evaluatorId || !id) return;
    const checkSurvey = async () => {
      const { data: surveyQs } = await supabase
        .from('survey_questions').select('id').eq('project_id', id).limit(1);
      if (!surveyQs || surveyQs.length === 0) return; // 설문 없으면 패스
      const { data: responses } = await supabase
        .from('survey_responses').select('id').eq('project_id', id).eq('evaluator_id', evaluatorId).limit(1);
      if (!responses || responses.length === 0) {
        navigate(`/eval/project/${id}/pre-survey`, { replace: true });
      }
    };
    checkSurvey();
  }, [evaluatorId, id, navigate]);

  useEffect(() => {
    if (evaluatorId) {
      loadProjectData(id, evaluatorId);
    }
  }, [id, evaluatorId, loadProjectData]);

  const pageSequence = useMemo(
    () => buildPageSequence(criteria, alternatives, id),
    [criteria, alternatives, id]
  );

  // Per-page completion status for navigator dots
  const pageStatuses = useMemo(() => {
    return pageSequence.map(page => {
      const total = page.pairs.length;
      let completed = 0;
      for (const pair of page.pairs) {
        const key = `${page.parentId}:${pair.left.id}:${pair.right.id}`;
        if (comparisons[key] !== undefined) completed++;
      }
      return { total, completed, isComplete: completed === total };
    });
  }, [pageSequence, comparisons]);

  const currentPageData = pageSequence[currentPage] || null;
  const comparison = usePairwiseComparison(currentPageData);

  if (loading) return <PageLayout><LoadingSpinner message="평가 데이터 로딩 중..." /></PageLayout>;

  if (showIntro) {
    return (
      <PageLayout>
        <AhpIntroduction onStart={() => setShowIntro(false)} />
      </PageLayout>
    );
  }

  if (pageSequence.length === 0) {
    return <PageLayout><p>평가할 항목이 없습니다.</p></PageLayout>;
  }

  return (
    <PageLayout wide>
      <EvaluationProgress
        current={currentPage + 1}
        total={pageSequence.length}
        pageSequence={pageSequence}
        comparisons={comparisons}
      />

      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {currentPageData.parentName}
            <span className={styles.pageType}>
              ({currentPageData.type === 'criteria' ? '기준 비교' : '대안 비교'})
            </span>
          </h2>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span className={styles.pageNum}>{currentPage + 1}/{pageSequence.length}</span>
            <HelpButton helpKey="evalProgress" />
          </span>
        </div>

        <PairwiseGrid
          pageData={currentPageData}
          projectId={id}
          evaluatorId={evaluatorId}
        />

        <div className={styles.results}>
          <PriorityBarChart
            items={currentPageData.items}
            priorities={comparison.priorities}
          />
          <ConsistencyDisplay cr={comparison.cr} />
          {comparison.cr > CR_THRESHOLD && comparison.bestFit.length > 0 && (
            <BestFitHelper
              recommendations={comparison.bestFit}
              items={currentPageData.items}
            />
          )}
        </div>
      </div>

      <PageNavigator
        current={currentPage}
        total={pageSequence.length}
        pageStatuses={pageStatuses}
        onPrev={() => setCurrentPage(p => Math.max(0, p - 1))}
        onNext={() => {
          if (currentPage < pageSequence.length - 1) {
            setCurrentPage(p => p + 1);
          } else {
            navigate(`/eval/project/${id}/result`);
          }
        }}
        onGoTo={setCurrentPage}
      />
    </PageLayout>
  );
}
