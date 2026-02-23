import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEvaluation } from '../contexts/EvaluationContext';
import { useAuth } from '../hooks/useAuth';
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

    const pageSequence = buildPageSequence(criteria, alternatives);
    const pageResults = {};
    let allConsistent = true;
    let allComplete = true;
    let totalCells = 0;
    let completedCells = 0;

    for (const page of pageSequence) {
      const itemIds = page.items.map(i => i.id);
      const values = {};

      for (let i = 0; i < itemIds.length; i++) {
        for (let j = i + 1; j < itemIds.length; j++) {
          const key = `${page.parentId}:${itemIds[i]}:${itemIds[j]}`;
          const calcKey = `${itemIds[i]}:${itemIds[j]}`;
          totalCells++;
          if (comparisons[key] !== undefined && comparisons[key] !== 0) {
            values[calcKey] = comparisons[key];
            completedCells++;
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

      if (ahp.cr > CR_THRESHOLD && itemIds.length > 2) allConsistent = false;
      if (Object.keys(values).length < (itemIds.length * (itemIds.length - 1)) / 2) allComplete = false;
    }

    return {
      pageResults,
      pageSequence,
      allConsistent,
      allComplete,
      totalCells,
      completedCells,
    };
  }, [criteria, alternatives, comparisons]);

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

      <div className={styles.content}>
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
