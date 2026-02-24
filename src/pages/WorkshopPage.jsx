import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useProject } from '../hooks/useProjects';
import { useEvaluators } from '../hooks/useEvaluators';
import { useCriteria } from '../hooks/useCriteria';
import { useAlternatives } from '../hooks/useAlternatives';
import { buildPageSequence } from '../lib/pairwiseUtils';
import { pairCount } from '../lib/ahpEngine';
import ProjectLayout from '../components/layout/ProjectLayout';
import ProgressBar from '../components/common/ProgressBar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import HelpButton from '../components/common/HelpButton';
import common from '../styles/common.module.css';
import styles from './WorkshopPage.module.css';

export default function WorkshopPage() {
  const { id } = useParams();
  const { currentProject, loading: projLoading } = useProject(id);
  const { evaluators } = useEvaluators(id);
  const { criteria } = useCriteria(id);
  const { alternatives } = useAlternatives(id);
  const [progress, setProgress] = useState({});

  const loadProgress = useCallback(async () => {
    const { data } = await supabase
      .from('pairwise_comparisons')
      .select('evaluator_id')
      .eq('project_id', id);

    const counts = {};
    for (const row of (data || [])) {
      counts[row.evaluator_id] = (counts[row.evaluator_id] || 0) + 1;
    }
    setProgress(counts);
  }, [id]);

  useEffect(() => {
    const channel = supabase
      .channel(`workshop-${id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pairwise_comparisons',
        filter: `project_id=eq.${id}`,
      }, () => {
        loadProgress();
      })
      .subscribe();

    loadProgress();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, loadProgress]);

  // Calculate total required comparisons
  const totalRequired = useMemo(() => {
    if (criteria.length === 0) return 0;
    const pages = buildPageSequence(criteria, alternatives, id);
    return pages.reduce((sum, page) => sum + pairCount(page.items.length), 0);
  }, [criteria, alternatives]);

  if (projLoading) return <ProjectLayout><LoadingSpinner /></ProjectLayout>;

  return (
    <ProjectLayout projectName={currentProject?.name}>
      <h1 className={common.pageTitle}>
        실시간 워크숍 <HelpButton helpKey="workshopProgress" />
      </h1>

      <div className={common.card}>
        <h2 className={common.cardTitle}>평가자 진행 현황</h2>

        {evaluators.length === 0 ? (
          <p className={common.emptyText}>등록된 평가자가 없습니다.</p>
        ) : (
          <div className={styles.evalList}>
            {evaluators.map(ev => {
              const count = progress[ev.id] || 0;
              return (
                <div key={ev.id}>
                  <div className={styles.evalRow}>
                    <span className={styles.evalName}>{ev.name}</span>
                    <span className={ev.completed ? styles.evalStatusDone : styles.evalStatusPending}>
                      {ev.completed ? '완료' : `${count} / ${totalRequired}`}
                    </span>
                  </div>
                  <ProgressBar
                    value={count}
                    max={totalRequired || 1}
                    color={ev.completed ? 'var(--color-success)' : 'var(--color-primary)'}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ProjectLayout>
  );
}
