import { CR_THRESHOLD } from '../../lib/constants';
import HelpButton from '../common/HelpButton';
import styles from './ConsistencyDisplay.module.css';

export default function ConsistencyDisplay({ cr }) {
  const isOk = cr <= CR_THRESHOLD;
  const crDisplay = cr === 0 ? '-' : cr.toFixed(5);

  return (
    <div className={`${styles.container} ${isOk ? styles.pass : styles.fail}`}>
      <span className={styles.label}>비일관성비율 (CR) <HelpButton helpKey="consistencyCheck" /></span>
      <span className={styles.value}>{crDisplay}</span>
      <span className={styles.status}>
        {cr === 0 ? '' : isOk ? '통과' : '기준 초과 (0.1 이하 필요)'}
      </span>
    </div>
  );
}
