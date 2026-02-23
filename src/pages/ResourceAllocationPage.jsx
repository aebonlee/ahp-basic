import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useProject } from '../hooks/useProjects';
import { useAlternatives } from '../hooks/useAlternatives';
import { useCriteria } from '../hooks/useCriteria';
import { useEvaluation } from '../contexts/EvaluationContext';
import { buildPageSequence } from '../lib/pairwiseUtils';
import { calculateAHP } from '../lib/ahpEngine';
import ProjectLayout from '../components/layout/ProjectLayout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import HelpButton from '../components/common/HelpButton';
import common from '../styles/common.module.css';
import styles from './ResourceAllocationPage.module.css';

/**
 * Calculate global weight of a criterion through the hierarchy.
 * Walks up the parent chain, multiplying local priorities at each level.
 */
function getCriteriaGlobal(criteria, criterionId, comparisons) {
  const criterion = criteria.find(c => c.id === criterionId);
  if (!criterion) return 0;

  // Build the chain from root to this criterion
  const chain = [];
  let current = criterion;
  while (current) {
    chain.unshift(current);
    current = criteria.find(c => c.id === current.parent_id);
  }

  let global = 1;
  for (const node of chain) {
    const parentId = node.parent_id || 'root';
    // Find siblings under same parent
    const siblings = criteria.filter(c => (c.parent_id || null) === (node.parent_id || null));
    if (siblings.length < 2) continue;

    const siblingIds = siblings.map(s => s.id);
    const values = {};
    for (let i = 0; i < siblingIds.length; i++) {
      for (let j = i + 1; j < siblingIds.length; j++) {
        const key = `${parentId}:${siblingIds[i]}:${siblingIds[j]}`;
        if (comparisons[key]) values[`${siblingIds[i]}:${siblingIds[j]}`] = comparisons[key];
      }
    }
    const result = calculateAHP(siblingIds, values);
    const idx = siblingIds.indexOf(node.id);
    global *= (result.priorities[idx] || 0);
  }

  return global;
}

export default function ResourceAllocationPage() {
  const { id } = useParams();
  const { currentProject, loading: projLoading } = useProject(id);
  const { criteria } = useCriteria(id);
  const { alternatives } = useAlternatives(id);
  const { comparisons, loadProjectData, loading } = useEvaluation();
  const [totalResource, setTotalResource] = useState(100);

  useEffect(() => {
    loadProjectData(id);
  }, [id, loadProjectData]);

  const allocations = useMemo(() => {
    if (criteria.length === 0 || alternatives.length === 0) return [];

    const mainAlts = alternatives.filter(a => !a.parent_id);
    const leafCriteria = criteria.filter(c => !criteria.some(other => other.parent_id === c.id));
    const altIds = mainAlts.map(a => a.id);

    return mainAlts.map(alt => {
      let totalScore = 0;
      for (const leaf of leafCriteria) {
        // Get global weight of this leaf criterion
        const criteriaGlobal = getCriteriaGlobal(criteria, leaf.id, comparisons);

        // Get alternative priority under this leaf
        const altValues = {};
        for (let i = 0; i < altIds.length; i++) {
          for (let j = i + 1; j < altIds.length; j++) {
            const key = `${leaf.id}:${altIds[i]}:${altIds[j]}`;
            if (comparisons[key]) altValues[`${altIds[i]}:${altIds[j]}`] = comparisons[key];
          }
        }
        const altResult = calculateAHP(altIds, altValues);
        const idx = altIds.indexOf(alt.id);
        totalScore += criteriaGlobal * (altResult.priorities[idx] || 0);
      }
      return { name: alt.name, score: totalScore };
    });
  }, [criteria, alternatives, comparisons]);

  const totalScore = allocations.reduce((sum, a) => sum + a.score, 0);

  if (projLoading || loading) return <ProjectLayout><LoadingSpinner /></ProjectLayout>;

  return (
    <ProjectLayout projectName={currentProject?.name}>
      <h1 className={common.pageTitle}>
        자원 배분 <HelpButton helpKey="resourceAllocation" />
      </h1>

      <div className={common.card}>
        <div className={styles.inputRow}>
          <label className={styles.inputLabel}>총 자원량:</label>
          <input
            type="number"
            value={totalResource}
            onChange={(e) => setTotalResource(Number(e.target.value) || 0)}
            className={styles.resourceInput}
          />
        </div>

        <table className={common.dataTable}>
          <thead>
            <tr>
              <th>대안</th>
              <th style={{ textAlign: 'right' }}>중요도</th>
              <th style={{ textAlign: 'right' }}>배분량</th>
            </tr>
          </thead>
          <tbody>
            {allocations.map(a => {
              const pct = totalScore > 0 ? a.score / totalScore : 0;
              const alloc = pct * totalResource;
              return (
                <tr key={a.name}>
                  <td>{a.name}</td>
                  <td className={styles.tdRight}>
                    {(pct * 100).toFixed(2)}%
                  </td>
                  <td className={styles.tdRightBold}>
                    {alloc.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td className={styles.tfootCell}>합계</td>
              <td className={`${styles.tfootCell} ${styles.tdRight}`}>100%</td>
              <td className={`${styles.tfootCell} ${styles.tdRightBold}`}>{totalResource}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </ProjectLayout>
  );
}
