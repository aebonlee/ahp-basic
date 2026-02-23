import styles from './EvaluationProgress.module.css';

export default function EvaluationProgress({ current, total, pageSequence, comparisons }) {
  // Count total completed comparisons across all pages
  let totalPairs = 0;
  let completedPairs = 0;

  for (const page of pageSequence) {
    for (const pair of page.pairs) {
      totalPairs++;
      const key = `${page.parentId}:${pair.left.id}:${pair.right.id}`;
      if (comparisons[key] !== undefined && comparisons[key] !== 0) {
        completedPairs++;
      }
    }
  }

  const pairPercent = totalPairs > 0 ? (completedPairs / totalPairs) * 100 : 0;

  return (
    <div className={styles.container}>
      <div className={styles.info}>
        <span>페이지: {current}/{total}</span>
        <span className={styles.pairCount}>
          평가 완료: <strong>{completedPairs}/{totalPairs}</strong> 항목
          ({Math.round(pairPercent)}%)
        </span>
      </div>
      <div className={styles.bar}>
        <div className={styles.fill} style={{ width: `${pairPercent}%` }} />
      </div>
    </div>
  );
}
