import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useProject } from '../hooks/useProjects';
import { useEvaluators } from '../hooks/useEvaluators';
import { useCriteria } from '../hooks/useCriteria';
import { useAlternatives } from '../hooks/useAlternatives';
import { aggregateComparisons } from '../lib/ahpAggregation';
import { aggregateDirectInputs } from '../lib/directInputEngine';
import { buildPageSequence } from '../lib/pairwiseUtils';
import { EVAL_METHOD, CR_THRESHOLD } from '../lib/constants';
import ProjectLayout from '../components/layout/ProjectLayout';
import ComprehensiveChart from '../components/results/ComprehensiveChart';
import ConsistencyTable from '../components/results/ConsistencyTable';
import ResultSummary from '../components/results/ResultSummary';
import DetailView from '../components/results/DetailView';
import EvaluatorWeightEditor from '../components/admin/EvaluatorWeightEditor';
import ExportButtons from '../components/results/ExportButtons';
import LoadingSpinner from '../components/common/LoadingSpinner';
import common from '../styles/common.module.css';
import styles from './AdminResultPage.module.css';

export default function AdminResultPage() {
  const { id } = useParams();
  const { currentProject, loading: projLoading } = useProject(id);
  const { evaluators } = useEvaluators(id);
  const { criteria } = useCriteria(id);
  const { alternatives } = useAlternatives(id);
  const [allComparisons, setAllComparisons] = useState({});
  const [allDirectInputs, setAllDirectInputs] = useState({});
  const [weights, setWeights] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, [id, evaluators]);

  const loadAllData = async () => {
    if (!evaluators.length) return;

    try {
      const [compRes, directRes] = await Promise.all([
        supabase.from('pairwise_comparisons').select('*').eq('project_id', id),
        supabase.from('direct_input_values').select('*').eq('project_id', id),
      ]);

      if (compRes.error) {
        console.error('Failed to load pairwise comparisons:', compRes.error);
      }
      if (directRes.error) {
        console.warn('Failed to load direct input values:', directRes.error);
      }

      // Pairwise comparisons by evaluator
      const byEval = {};
      for (const c of (compRes.data || [])) {
        if (!byEval[c.evaluator_id]) byEval[c.evaluator_id] = {};
        byEval[c.evaluator_id][`${c.criterion_id}:${c.row_id}:${c.col_id}`] = c.value;
      }
      setAllComparisons(byEval);

      // Direct input values by evaluator
      const directByEval = {};
      for (const d of (directRes.data || [])) {
        if (!directByEval[d.evaluator_id]) directByEval[d.evaluator_id] = {};
        if (!directByEval[d.evaluator_id][d.criterion_id]) directByEval[d.evaluator_id][d.criterion_id] = {};
        directByEval[d.evaluator_id][d.criterion_id][d.item_id] = d.value;
      }
      setAllDirectInputs(directByEval);

      // Initialize equal weights
      const w = {};
      evaluators.forEach(e => { w[e.id] = 1; });
      setWeights(w);
    } catch (err) {
      console.error('loadAllData error:', err);
    } finally {
      setLoading(false);
    }
  };

  const isDirectInput = currentProject?.eval_method === EVAL_METHOD.DIRECT_INPUT;

  const results = useMemo(() => {
    if (criteria.length === 0) return null;
    if (!isDirectInput && Object.keys(allComparisons).length === 0) return null;
    if (isDirectInput && Object.keys(allDirectInputs).length === 0) return null;

    const pageSequence = buildPageSequence(criteria, alternatives, id);
    const pageResults = {};

    let totalCells = 0;
    let completedCells = 0;
    let allConsistent = true;

    for (const page of pageSequence) {
      const itemIds = page.items.map(i => i.id);

      if (isDirectInput) {
        // Direct input aggregation
        const evalValues = Object.entries(allDirectInputs).map(([evalId, critValues]) => {
          const values = critValues[page.parentId] || {};
          return { values, weight: weights[evalId] || 1 };
        });

        const agg = aggregateDirectInputs(itemIds, evalValues);
        pageResults[page.parentId] = { ...page, ...agg };

        // Track completeness for direct input
        for (const evalId of Object.keys(allDirectInputs)) {
          totalCells += itemIds.length;
          const critValues = allDirectInputs[evalId]?.[page.parentId] || {};
          completedCells += itemIds.filter(iid => critValues[iid] > 0).length;
        }
      } else {
        // Pairwise comparison aggregation
        const expectedPairs = (itemIds.length * (itemIds.length - 1)) / 2;

        const evalValues = Object.entries(allComparisons).map(([evalId, comps]) => {
          const values = {};
          let evalCompletedPairs = 0;
          for (let i = 0; i < itemIds.length; i++) {
            for (let j = i + 1; j < itemIds.length; j++) {
              const key = `${page.parentId}:${itemIds[i]}:${itemIds[j]}`;
              if (comps[key] !== undefined) {
                values[`${itemIds[i]}:${itemIds[j]}`] = comps[key] === 0 ? 1 : comps[key];
                evalCompletedPairs++;
              }
            }
          }

          totalCells += expectedPairs;
          completedCells += evalCompletedPairs;

          return { values, weight: weights[evalId] || 1 };
        });

        const agg = aggregateComparisons(itemIds, evalValues);
        pageResults[page.parentId] = { ...page, ...agg };

        if (agg.cr > CR_THRESHOLD) {
          allConsistent = false;
        }
      }
    }

    const allComplete = totalCells > 0 && completedCells >= totalCells;

    return { goalId: id, pageResults, pageSequence, allConsistent, allComplete, totalCells, completedCells };
  }, [id, criteria, alternatives, allComparisons, allDirectInputs, weights, isDirectInput]);

  // Per-evaluator individual CR values (pairwise only)
  const evaluatorCRs = useMemo(() => {
    if (isDirectInput || !results) return null;
    if (evaluators.length === 0) return null;

    const rows = [];
    for (const page of results.pageSequence) {
      const itemIds = page.items.map(i => i.id);
      if (itemIds.length < 2) continue;

      const evalCRs = evaluators.map(ev => {
        const comps = allComparisons[ev.id] || {};
        const values = {};
        for (let i = 0; i < itemIds.length; i++) {
          for (let j = i + 1; j < itemIds.length; j++) {
            const key = `${page.parentId}:${itemIds[i]}:${itemIds[j]}`;
            if (comps[key] !== undefined) {
              values[`${itemIds[i]}:${itemIds[j]}`] = comps[key] === 0 ? 1 : comps[key];
            }
          }
        }
        const agg = aggregateComparisons(itemIds, [{ values, weight: 1 }]);
        return agg.cr;
      });

      rows.push({ parentName: page.parentName, evalCRs });
    }

    return rows;
  }, [results, evaluators, allComparisons, isDirectInput]);

  if (projLoading || loading) {
    return <ProjectLayout><LoadingSpinner message="집계 결과 로딩 중..." /></ProjectLayout>;
  }

  return (
    <ProjectLayout projectName={currentProject?.name}>
      <h1 className={common.pageTitle}>
        집계 결과
      </h1>

      <EvaluatorWeightEditor
        evaluators={evaluators}
        weights={weights}
        onChange={setWeights}
      />

      {results && (
        <>
          <div className={results.allComplete && results.allConsistent ? common.statusBannerSuccess : common.statusBannerWarning}>
            <p>
              완료: {results.completedCells}/{results.totalCells} ({results.totalCells > 0 ? ((results.completedCells / results.totalCells) * 100).toFixed(0) : 0}%)
              {!results.allComplete && <span className={styles.statusWarning}>미완료 항목이 있습니다</span>}
            </p>
            {!isDirectInput && (
              <p>
                일관성: {results.allConsistent ? '모두 통과' : 'CR > 0.1인 페이지가 있습니다'}
              </p>
            )}
          </div>
          <div className={common.sectionGap}>
            <ExportButtons criteria={criteria} alternatives={alternatives} results={results} projectName={currentProject?.name} />
          </div>
          <div id="ahp-print-area">
            <div className={common.sectionGap}>
              <ComprehensiveChart criteria={criteria} alternatives={alternatives} results={results} />
            </div>
            <div className={common.sectionGap}>
              <ResultSummary criteria={criteria} alternatives={alternatives} results={results} />
            </div>
            <div className={common.sectionGap}>
              <DetailView criteria={criteria} alternatives={alternatives} results={results} onNavigateToPage={() => {}} />
            </div>
            <div className={common.sectionGap}>
              <ConsistencyTable results={results} onNavigateToPage={() => {}} />
            </div>
          </div>
          {evaluatorCRs && evaluatorCRs.length > 0 && (
            <div className={common.sectionGap}>
              <div className={common.card}>
                <h3 className={common.cardTitle}>평가자별 개인 CR 비교</h3>
                <div className={styles.crTableWrap}>
                  <table className={common.dataTable}>
                    <thead>
                      <tr>
                        <th>비교 항목</th>
                        {evaluators.map(ev => (
                          <th key={ev.id} style={{ textAlign: 'center' }}>{ev.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {evaluatorCRs.map((row, idx) => (
                        <tr key={idx}>
                          <td>{row.parentName}</td>
                          {row.evalCRs.map((cr, ci) => (
                            <td
                              key={ci}
                              className={cr > CR_THRESHOLD ? styles.crFail : styles.crPass}
                              style={{ textAlign: 'center' }}
                            >
                              {cr.toFixed(4)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </ProjectLayout>
  );
}
