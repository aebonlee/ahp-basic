import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEvaluation } from '../contexts/EvaluationContext';
import { useAuth } from '../hooks/useAuth';
import { useProject } from '../hooks/useProjects';
import { useEvaluators } from '../hooks/useEvaluators';
import { buildPageSequence } from '../lib/pairwiseUtils';
import { calculateAHP } from '../lib/ahpEngine';
import { CR_THRESHOLD } from '../lib/constants';
import PageLayout from '../components/layout/PageLayout';
import ResultSummary from '../components/results/ResultSummary';
import ComprehensiveChart from '../components/results/ComprehensiveChart';
import ConsistencyTable from '../components/results/ConsistencyTable';
import DetailView from '../components/results/DetailView';
import SignaturePanel from '../components/results/SignaturePanel';
import ExportButtons from '../components/results/ExportButtons';
import LoadingSpinner from '../components/common/LoadingSpinner';
import styles from './EvalResultPage.module.css';

export default function EvalResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentProject } = useProject(id);
  const { evaluators } = useEvaluators(id);
  const { criteria, alternatives, comparisons, loading, loadProjectData } = useEvaluation();
  const [activeTab, setActiveTab] = useState('summary');

  const evaluatorId = useMemo(() => {
    return evaluators.find(e => e.user_id === user?.id)?.id || null;
  }, [evaluators, user?.id]);

  useEffect(() => {
    if (evaluatorId) {
      loadProjectData(id, evaluatorId);
    }
  }, [id, evaluatorId, loadProjectData]);

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
  ];

  return (
    <PageLayout>
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
            onNavigateToPage={(pageIdx) => navigate(`/eval/project/${id}#page=${pageIdx}`)}
          />
        )}
        {activeTab === 'consistency' && (
          <ConsistencyTable
            results={results}
            onNavigateToPage={(pageIdx) => navigate(`/eval/project/${id}#page=${pageIdx}`)}
          />
        )}
      </div>

      {/* Review Section: incomplete / inconsistent pages */}
      {(results.incompletePages.length > 0 || results.inconsistentPages.length > 0) && (
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
        projectId={id}
        evaluatorId={evaluatorId}
        allComplete={results.allComplete}
        allConsistent={results.allConsistent}
        completedCells={results.completedCells}
        totalCells={results.totalCells}
      />
    </PageLayout>
  );
}
