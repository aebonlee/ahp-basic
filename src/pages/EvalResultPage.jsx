import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useEvaluation } from '../contexts/EvaluationContext';
import { useAuth } from '../hooks/useAuth';
import { useProject } from '../hooks/useProjects';
import { useEvaluators } from '../hooks/useEvaluators';
import { useSurveyQuestions, useSurveyResponses } from '../hooks/useSurvey';
import { buildPageSequence } from '../lib/pairwiseUtils';
import { calculateAHP } from '../lib/ahpEngine';
import { CR_THRESHOLD } from '../lib/constants';
import { findEvaluatorId } from '../lib/evaluatorUtils';
import PageLayout from '../components/layout/PageLayout';
import ResultSummary from '../components/results/ResultSummary';
import ComprehensiveChart from '../components/results/ComprehensiveChart';
import ConsistencyTable from '../components/results/ConsistencyTable';
import DetailView from '../components/results/DetailView';
import SurveyResponseView from '../components/results/SurveyResponseView';
import SignaturePanel from '../components/results/SignaturePanel';
import ExportButtons from '../components/results/ExportButtons';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import { useConfirm } from '../hooks/useConfirm';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useToast } from '../contexts/ToastContext';
import styles from './EvalResultPage.module.css';


export default function EvalResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentProject } = useProject(id);
  const { evaluators, fetchEvaluators } = useEvaluators(id);
  const { criteria, alternatives, comparisons, loading, loadProjectData } = useEvaluation();
  const { questions: surveyQuestions } = useSurveyQuestions(id);
  const { responses: surveyResponses } = useSurveyResponses(id);
  const [activeTab, setActiveTab] = useState('summary');
  const [unlocked, setUnlocked] = useState(false);
  const toast = useToast();
  const { confirm, confirmDialogProps } = useConfirm();

  const evaluatorId = useMemo(() => {
    return findEvaluatorId(evaluators, user, id);
  }, [evaluators, user?.id, id]);

  // 평가 완료(잠금) 여부: evaluators.completed 또는 evaluation_signatures 존재
  const [hasSigned, setHasSigned] = useState(false);
  useEffect(() => {
    if (!evaluatorId || !id) return;
    supabase
      .from('evaluation_signatures')
      .select('id')
      .eq('project_id', id)
      .eq('evaluator_id', evaluatorId)
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) setHasSigned(true);
      });
  }, [id, evaluatorId]);

  const isCompleted = useMemo(() => {
    if (hasSigned) return true;
    if (!evaluatorId || evaluators.length === 0) return false;
    const ev = evaluators.find(e => e.id === evaluatorId);
    return !!ev?.completed;
  }, [evaluatorId, evaluators, hasSigned]);

  useEffect(() => {
    if (evaluatorId) {
      loadProjectData(id, evaluatorId);
    }
  }, [id, evaluatorId, loadProjectData]);

  const hasSurveyResponses = useMemo(() => {
    if (!evaluatorId || surveyQuestions.length === 0) return false;
    return surveyResponses.some(r => r.evaluator_id === evaluatorId);
  }, [evaluatorId, surveyQuestions, surveyResponses]);

  // 재평가: 서명 삭제 + completed 해제
  const handleUnlock = useCallback(async () => {
    if (!evaluatorId || !id) return;
    const ok = await confirm({
      title: '재평가하기',
      message: '평가 완료를 취소하고 평가/설문을 수정할 수 있습니다.\n계속하시겠습니까?',
      variant: 'warning',
    });
    if (!ok) return;
    try {
      await supabase.from('evaluation_signatures').delete().eq('project_id', id).eq('evaluator_id', evaluatorId);
      await supabase.from('evaluators').update({ completed: false }).eq('id', evaluatorId);
      setHasSigned(false);
      setUnlocked(true);
      await fetchEvaluators();
      toast.success('잠금이 해제되었습니다.');
    } catch (err) {
      toast.error('잠금 해제 실패: ' + (err.message || ''));
    }
  }, [evaluatorId, id, confirm, toast, fetchEvaluators]);

  // Calculate all results
  const results = useMemo(() => {
    if (criteria.length === 0) return null;

    const pageSequence = buildPageSequence(criteria, alternatives, id);
    const pageResults = {};
    let allConsistent = true;
    let allComplete = true;
    let totalCells = 0;
    let completedCells = 0;

    const incompletePages = [];
    const inconsistentPages = [];

    for (let pageIdx = 0; pageIdx < pageSequence.length; pageIdx++) {
      const page = pageSequence[pageIdx];
      const itemIds = page.items.map(i => i.id);
      const values = {};
      const expectedPairs = (itemIds.length * (itemIds.length - 1)) / 2;
      let pageCells = 0;
      let pageCompleted = 0;

      for (let i = 0; i < itemIds.length; i++) {
        for (let j = i + 1; j < itemIds.length; j++) {
          const key = `${page.parentId}:${itemIds[i]}:${itemIds[j]}`;
          const calcKey = `${itemIds[i]}:${itemIds[j]}`;
          totalCells++;
          pageCells++;
          if (comparisons[key] !== undefined) {
            values[calcKey] = comparisons[key] === 0 ? 1 : comparisons[key];
            completedCells++;
            pageCompleted++;
          }
        }
      }

      const ahp = calculateAHP(itemIds, values);
      pageResults[page.parentId] = {
        ...page,
        priorities: ahp.priorities,
        cr: ahp.cr,
        isConsistent: ahp.cr <= CR_THRESHOLD,
      };

      const pageComplete = Object.keys(values).length >= expectedPairs;
      if (!pageComplete) {
        incompletePages.push({ pageIdx, name: page.parentName, completed: pageCompleted, total: pageCells });
        allComplete = false;
      }
      if (ahp.cr > CR_THRESHOLD && itemIds.length > 2) {
        inconsistentPages.push({ pageIdx, name: page.parentName, cr: ahp.cr });
        allConsistent = false;
      }
    }

    return {
      goalId: id,
      pageResults,
      pageSequence,
      allConsistent,
      allComplete,
      totalCells,
      completedCells,
      incompletePages,
      inconsistentPages,
    };
  }, [id, criteria, alternatives, comparisons]);

  if (loading || !results) {
    return <PageLayout><LoadingSpinner message="결과 계산 중..." /></PageLayout>;
  }

  const tabs = [
    { key: 'summary', label: '종합결과' },
    { key: 'detail', label: '세부내용' },
    { key: 'consistency', label: '비일관성비율' },
    ...(surveyQuestions.length > 0 ? [{ key: 'survey', label: '설문 응답' }] : []),
  ];

  return (
    <PageLayout>
      {/* 상단 네비게이션 */}
      <div className={styles.navBar}>
        {!isCompleted ? (
          <div style={{ display: 'flex', gap: '6px' }}>
            <Button variant="secondary" onClick={() => navigate(`/eval/project/${id}`)}>
              &larr; 평가로 돌아가기
            </Button>
            {surveyQuestions.length > 0 && (
              <Button variant="secondary" onClick={() => navigate(`/eval/project/${id}/pre-survey?edit=1`)}>
                설문 수정
              </Button>
            )}
          </div>
        ) : (
          <Button variant="secondary" onClick={handleUnlock}>
            재평가하기
          </Button>
        )}
        <div className={styles.navRight}>
          <Button variant="secondary" onClick={() => navigate('/evaluator')}>
            평가 목록
          </Button>
        </div>
      </div>

      {/* 잠금 해제 후 안내 패널 */}
      {unlocked && !isCompleted && (
        <div className={styles.unlockGuide}>
          <div className={styles.unlockGuideHeader}>
            <span className={styles.unlockIcon}>&#128275;</span>
            <h3 className={styles.unlockTitle}>평가 잠금이 해제되었습니다</h3>
          </div>
          <p className={styles.unlockDesc}>
            수정할 항목을 선택하세요. <strong>&lsquo;비일관성비율&rsquo;</strong> 탭에서 재점검이 필요한 항목을 확인할 수 있습니다.
            <br />수정 완료 후 이 페이지 하단의 <strong>&ldquo;평가 완료&rdquo;</strong> 버튼을 다시 눌러주세요.
          </p>
          <div className={styles.unlockActions}>
            <Button onClick={() => navigate(`/eval/project/${id}`)}>
              쌍대비교 평가 수정
            </Button>
            {surveyQuestions.length > 0 && (
              <Button variant="secondary" onClick={() => navigate(`/eval/project/${id}/pre-survey?edit=1`)}>
                설문 응답 수정
              </Button>
            )}
          </div>
        </div>
      )}

      <div className={styles.header}>
        <h1 className={styles.title}>평가 결과</h1>
        <ExportButtons
          criteria={criteria}
          alternatives={alternatives}
          results={results}
          projectName={currentProject?.name}
        />
      </div>

      <div className={styles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`${styles.tab} ${activeTab === tab.key ? styles.activeTab : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div id="ahp-print-area" className={styles.content}>
        {activeTab === 'summary' && (
          <>
            <ResultSummary
              criteria={criteria}
              alternatives={alternatives}
              results={results}
            />
            <ComprehensiveChart
              criteria={criteria}
              alternatives={alternatives}
              results={results}
            />
          </>
        )}
        {activeTab === 'detail' && (
          <DetailView
            criteria={criteria}
            alternatives={alternatives}
            results={results}
            onNavigateToPage={isCompleted ? undefined : (pageIdx) => navigate(`/eval/project/${id}#page=${pageIdx}`)}
          />
        )}
        {activeTab === 'consistency' && (
          <ConsistencyTable
            results={results}
            onNavigateToPage={isCompleted ? undefined : (pageIdx) => navigate(`/eval/project/${id}#page=${pageIdx}`)}
          />
        )}
        {activeTab === 'survey' && (
          <SurveyResponseView
            questions={surveyQuestions}
            responses={surveyResponses}
            evaluatorId={evaluatorId}
          />
        )}
      </div>

      {/* Review Section: incomplete / inconsistent pages (완료된 평가자에게는 숨김) */}
      {!isCompleted && (results.incompletePages.length > 0 || results.inconsistentPages.length > 0) && (
        <div className={styles.reviewSection}>
          <h3 className={styles.reviewTitle}>재점검 필요 항목</h3>

          {results.incompletePages.length > 0 && (
            <div className={styles.reviewGroup}>
              <h4 className={styles.reviewSubtitle}>미완료 항목</h4>
              {results.incompletePages.map(p => (
                <div key={p.pageIdx} className={styles.reviewItem}>
                  <div className={styles.reviewInfo}>
                    <span className={styles.reviewName}>{p.name}</span>
                    <span className={styles.reviewBadge} data-type="incomplete">
                      {p.completed}/{p.total} 완료
                    </span>
                  </div>
                  <button
                    className={styles.reviewBtn}
                    onClick={() => navigate(`/eval/project/${id}#page=${p.pageIdx}`)}
                  >
                    돌아가기
                  </button>
                </div>
              ))}
            </div>
          )}

          {results.inconsistentPages.length > 0 && (
            <div className={styles.reviewGroup}>
              <h4 className={styles.reviewSubtitle}>비일관성 초과 항목</h4>
              {results.inconsistentPages.map(p => (
                <div key={p.pageIdx} className={styles.reviewItem}>
                  <div className={styles.reviewInfo}>
                    <span className={styles.reviewName}>{p.name}</span>
                    <span className={styles.reviewBadge} data-type="inconsistent">
                      CR {p.cr.toFixed(3)}
                    </span>
                  </div>
                  <button
                    className={styles.reviewBtn}
                    onClick={() => navigate(`/eval/project/${id}#page=${p.pageIdx}`)}
                  >
                    돌아가기
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <SignaturePanel
        key={hasSigned ? 'signed' : 'unsigned'}
        projectId={id}
        evaluatorId={evaluatorId}
        allComplete={results.allComplete}
        allConsistent={results.allConsistent}
        completedCells={results.completedCells}
        totalCells={results.totalCells}
        hasSurveyResponses={hasSurveyResponses}
      />
      <ConfirmDialog {...confirmDialogProps} />
    </PageLayout>
  );
}
