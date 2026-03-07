import { CR_THRESHOLD } from '../../lib/constants';
import styles from '../../styles/results.module.css';

export default function ConsistencyTable({ results, onNavigateToPage }) {
  const pages = results.pageSequence;

  return (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>비일관성비율 (CR) 테이블</h3>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>비교 대상</th>
            <th>항목 수</th>
            <th>CR</th>
            <th>판정</th>
          </tr>
        </thead>
        <tbody>
          {pages.map((page, idx) => {
            const pr = results.pageResults[page.parentId];
            const cr = pr?.cr || 0;
            const n = page.items.length;
            const pass = n <= 2 || cr <= CR_THRESHOLD;
            const crText = n <= 2 ? '-' : cr.toFixed(5);

            return (
              <tr
                key={page.parentId}
                className={!pass ? styles.failRow : ''}
                onClick={() => onNavigateToPage(idx)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigateToPage(idx); } }}
                tabIndex={0}
                role="button"
                style={{ cursor: 'pointer' }}
              >
                <td>{page.parentName}</td>
                <td>{n}</td>
                <td style={{ fontFamily: 'monospace' }}>{crText}</td>
                <td>
                  {n <= 2 ? (
                    <span className={styles.skip}>-</span>
                  ) : pass ? (
                    <span className={styles.passLabel}>통과</span>
                  ) : (
                    <span className={styles.failLabel}>재평가 필요</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
