import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEvaluation } from '../contexts/EvaluationContext';
import { useAuth } from '../hooks/useAuth';
import { useEvaluators } from '../hooks/useEvaluators';
import { buildPageSequence } from '../lib/pairwiseUtils';
import { calculateDirectPriorities } from '../lib/directInputEngine';
import PageLayout from '../components/layout/PageLayout';
import DirectInputPanel from '../components/evaluation/DirectInputPanel';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import common from '../styles/common.module.css';
import styles from './DirectInputPage.module.css';

export default function DirectInputPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { evaluators } = useEvaluators(id);
  const { criteria, alternatives, loading, loadProjectData, directInputValues } = useEvaluation();
  const [validations, setValidations] = useState({});

  const evaluatorId = useMemo(() => {
    return evaluators.find(e => e.user_id === user?.id)?.id || null;
  }, [evaluators, user?.id]);

  useEffect(() => {
    if (evaluatorId) {
      loadProjectData(id, evaluatorId);
    }
  }, [id, evaluatorId, loadProjectData]);

  const pages = useMemo(
    () => buildPageSequence(criteria, alternatives),
    [criteria, alternatives]
  );

  const handleValidationChange = useCallback((criterionId, isComplete) => {
    setValidations(prev => ({ ...prev, [criterionId]: isComplete }));
  }, []);

  const allComplete = pages.length > 0 && pages.every(p => validations[p.parentId]);

  // Calculate priorities for display
  const pagePriorities = useMemo(() => {
    const result = {};
    for (const page of pages) {
      const itemIds = page.items.map(i => i.id);
      const vals = {};
      for (const item of page.items) {
        vals[item.id] = directInputValues?.[`${page.parentId}:${item.id}`] || 0;
      }
      result[page.parentId] = calculateDirectPriorities(itemIds, vals);
    }
    return result;
  }, [pages, directInputValues]);

  if (loading) return <PageLayout><LoadingSpinner /></PageLayout>;

  return (
    <PageLayout>
      <h1 className={common.pageTitle}>직접입력 평가</h1>
      {pages.map(page => {
        const priorities = pagePriorities[page.parentId];
        return (
          <div key={page.parentId} className={styles.section}>
            <h3 className={styles.sectionTitle}>{page.parentName}</h3>
            <DirectInputPanel
              projectId={id}
              evaluatorId={evaluatorId}
              criterionId={page.parentId}
              items={page.items}
              onValidationChange={handleValidationChange}
            />
            {priorities && priorities.priorities.some(p => p > 0) && (
              <div className={styles.previewBar}>
                <p className={styles.previewLabel}>우선순위 미리보기</p>
                {page.items.map((item, idx) => {
                  const pct = (priorities.priorities[idx] * 100).toFixed(1);
                  return (
                    <div key={item.id} className={styles.previewRow}>
                      <span className={styles.previewName}>{item.name}</span>
                      <div className={styles.previewTrack}>
                        <div className={styles.previewFill} style={{ width: `${pct}%` }} />
                      </div>
                      <span className={styles.previewPct}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
      <Button
        onClick={() => navigate(`/eval/project/${id}/result`)}
        disabled={!allComplete}
      >
        {allComplete ? '결과 보기' : '모든 항목을 입력해주세요'}
      </Button>
    </PageLayout>
  );
}
