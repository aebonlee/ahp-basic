import { LEVEL_COLORS } from '../../lib/constants';
import styles from './CanvasNode.module.css';

const PAPER_LEVEL_COLORS = ['#222', '#444', '#666', '#888', '#aaa'];

export default function CanvasNode({
  node,
  isSelected,
  onClick,
  onContextMenu,
  onAddChild,
  onEdit,
  onDelete,
  paperMode,
  orientation,
}) {
  const { x, y, width, height, label, type, level } = node;

  const typeClass = {
    goal: styles.goalNode,
    criteria: styles.criteriaNode,
    alternative: styles.altNode,
  }[type];

  const colors = paperMode ? PAPER_LEVEL_COLORS : LEVEL_COLORS;
  const levelColor = type === 'criteria' ? colors[(level - 1) % colors.length] : null;
  const isHorizontal = orientation === 'horizontal';

  return (
    <div
      className={`${styles.node} ${typeClass} ${isSelected ? styles.selected : ''} ${paperMode ? styles.paper : ''}`}
      style={{
        left: x,
        top: y,
        width,
        height,
        borderLeftColor: levelColor || undefined,
      }}
      onClick={(e) => { e.stopPropagation(); onClick?.(node); }}
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onContextMenu?.(e, node); }}
      title={label}
    >
      <span className={`${styles.label} ${isHorizontal ? styles.wrapLabel : ''}`}>{label}</span>
      {!paperMode && (
        <div className={styles.nodeActions}>
          {type === 'goal' && (
            <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); onAddChild?.(node); }} title="기준 추가">+</button>
          )}
          {type === 'criteria' && (
            <>
              <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); onAddChild?.(node); }} title="하위기준 추가">+</button>
              <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); onEdit?.(node); }} title="수정">✎</button>
              <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={(e) => { e.stopPropagation(); onDelete?.(node); }} title="삭제">&times;</button>
            </>
          )}
          {type === 'alternative' && (
            <>
              <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); onEdit?.(node); }} title="수정">✎</button>
              <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={(e) => { e.stopPropagation(); onDelete?.(node); }} title="삭제">&times;</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
