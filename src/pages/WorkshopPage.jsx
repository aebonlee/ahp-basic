import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useProject } from '../hooks/useProjects';
import { useEvaluators } from '../hooks/useEvaluators';
import { useCriteria } from '../hooks/useCriteria';
import { useAlternatives } from '../hooks/useAlternatives';
import { buildPageSequence } from '../lib/pairwiseUtils';
import { pairCount } from '../lib/ahpEngine';
import PageLayout from '../components/layout/PageLayout';
import ProgressBar from '../components/common/ProgressBar';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function WorkshopPage() {
  const { id } = useParams();
  const { currentProject, loading: projLoading } = useProject(id);
  const { evaluators } = useEvaluators(id);
  const { criteria } = useCriteria(id);
  const { alternatives } = useAlternatives(id);
  const [progress, setProgress] = useState({});

  useEffect(() => {
    // Subscribe to realtime changes
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
  }, [id]);

  const loadProgress = async () => {
    const { data } = await supabase
      .from('pairwise_comparisons')
      .select('evaluator_id')
      .eq('project_id', id);

    const counts = {};
    for (const row of (data || [])) {
      counts[row.evaluator_id] = (counts[row.evaluator_id] || 0) + 1;
    }
    setProgress(counts);
  };

  // Calculate total required comparisons
  const totalRequired = useMemo(() => {
    if (criteria.length === 0) return 0;
    const pages = buildPageSequence(criteria, alternatives);
    return pages.reduce((sum, page) => sum + pairCount(page.items.length), 0);
  }, [criteria, alternatives]);

  if (projLoading) return <PageLayout><LoadingSpinner /></PageLayout>;

  return (
    <PageLayout>
      <h1 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 16 }}>
        {currentProject?.name} - 실시간 워크숍
      </h1>

      <div style={{ background: 'var(--color-surface)', borderRadius: 8, padding: 24, boxShadow: 'var(--shadow-sm)' }}>
        <h2 style={{ fontSize: '1rem', marginBottom: 16 }}>평가자 진행 현황</h2>

        {evaluators.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>등록된 평가자가 없습니다.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {evaluators.map(ev => {
              const count = progress[ev.user_id] || 0;
              return (
                <div key={ev.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{ev.name}</span>
                    <span style={{ fontSize: '0.8rem', color: ev.completed ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
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
    </PageLayout>
  );
}
