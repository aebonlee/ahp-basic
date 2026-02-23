import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { buildCanvasTree, computeLayout } from '../../lib/hierarchyLayout';
import CanvasNode from './CanvasNode';
import styles from './HierarchyCanvas.module.css';

export default function HierarchyCanvas({
  projectName,
  criteriaTree,
  alternatives,
  onAddCriterion,
  onEditCriterion,
  onDeleteCriterion,
  onAddAlternative,
  onEditAlternative,
  onDeleteAlternative,
}) {
  const [selectedId, setSelectedId] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const wrapperRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(800);

  // Measure container width
  useEffect(() => {
    if (!wrapperRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, []);

  // Build tree and compute layout
  const layout = useMemo(() => {
    const { goalNode, altNodes } = buildCanvasTree(projectName, criteriaTree, alternatives);
    return computeLayout(goalNode, altNodes, containerWidth);
  }, [projectName, criteriaTree, alternatives, containerWidth]);

  const { nodes, connections, canvasWidth, canvasHeight, separatorY } = layout;

  // Build a node lookup map for connection line rendering
  const nodeMap = useMemo(() => {
    const map = {};
    for (const n of nodes) map[n.id] = n;
    return map;
  }, [nodes]);

  const handleCanvasClick = useCallback(() => {
    setSelectedId(null);
    setContextMenu(null);
  }, []);

  const handleNodeClick = useCallback((node) => {
    setSelectedId(node.id);
    setContextMenu(null);
  }, []);

  const handleContextMenu = useCallback((e, node) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX - (wrapperRef.current?.getBoundingClientRect().left || 0) + (wrapperRef.current?.scrollLeft || 0),
      y: e.clientY - (wrapperRef.current?.getBoundingClientRect().top || 0) + (wrapperRef.current?.scrollTop || 0),
      node,
    });
    setSelectedId(node.id);
  }, []);

  const handleCanvasContextMenu = useCallback((e) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX - (wrapperRef.current?.getBoundingClientRect().left || 0) + (wrapperRef.current?.scrollLeft || 0),
      y: e.clientY - (wrapperRef.current?.getBoundingClientRect().top || 0) + (wrapperRef.current?.scrollTop || 0),
      node: null,
    });
  }, []);

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return;
    const handler = () => setContextMenu(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [contextMenu]);

  // Node action handlers
  const handleAddChild = useCallback((node) => {
    if (node.type === 'goal') onAddCriterion?.(null);
    else if (node.type === 'criteria') onAddCriterion?.(node.data.id);
  }, [onAddCriterion]);

  const handleEdit = useCallback((node) => {
    if (node.type === 'criteria') onEditCriterion?.(node.data);
    else if (node.type === 'alternative') onEditAlternative?.(node.data);
  }, [onEditCriterion, onEditAlternative]);

  const handleDelete = useCallback((node) => {
    if (node.type === 'criteria') onDeleteCriterion?.(node.data.id);
    else if (node.type === 'alternative') onDeleteAlternative?.(node.data.id);
  }, [onDeleteCriterion, onDeleteAlternative]);

  // Context menu actions
  const contextMenuItems = useMemo(() => {
    if (!contextMenu) return [];
    const { node } = contextMenu;

    if (!node) {
      return [
        { label: '기준 추가', action: () => onAddCriterion?.(null) },
        { label: '대안 추가', action: () => onAddAlternative?.(null) },
      ];
    }
    if (node.type === 'goal') {
      return [
        { label: '기준 추가', action: () => onAddCriterion?.(null) },
      ];
    }
    if (node.type === 'criteria') {
      return [
        { label: '하위기준 추가', action: () => onAddCriterion?.(node.data.id) },
        { label: '수정', action: () => onEditCriterion?.(node.data) },
        { label: '삭제', action: () => onDeleteCriterion?.(node.data.id), danger: true },
      ];
    }
    if (node.type === 'alternative') {
      return [
        { label: '수정', action: () => onEditAlternative?.(node.data) },
        { label: '삭제', action: () => onDeleteAlternative?.(node.data.id), danger: true },
      ];
    }
    return [];
  }, [contextMenu, onAddCriterion, onAddAlternative, onEditCriterion, onDeleteCriterion, onEditAlternative, onDeleteAlternative]);

  // Render SVG connection lines
  const renderConnections = () => {
    return connections.map((conn, i) => {
      const from = nodeMap[conn.from];
      const to = nodeMap[conn.to];
      if (!from || !to) return null;

      const x1 = from.x + from.width / 2;
      const y1 = from.y + from.height;
      const x2 = to.x + to.width / 2;
      const y2 = to.y;

      const isActive = selectedId === conn.from || selectedId === conn.to;
      const isAlt = conn.type === 'alternative';

      const midY = (y1 + y2) / 2;
      const d = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;

      return (
        <path
          key={i}
          d={d}
          className={
            isAlt
              ? styles.connectionLineAlt
              : isActive
                ? styles.connectionLineActive
                : styles.connectionLine
          }
        />
      );
    });
  };

  // Empty state
  const isEmpty = criteriaTree.length === 0 && alternatives.length === 0;

  if (isEmpty) {
    return (
      <div className={styles.canvasWrapper} ref={wrapperRef}>
        <div className={styles.emptyState}>
          <p>기준과 대안을 추가하여 AHP 계층 모델을 구성하세요.</p>
          <div className={styles.emptyActions}>
            <button className={styles.emptyBtn} onClick={() => onAddCriterion?.(null)}>+ 기준 추가</button>
            <button className={styles.emptyBtn} onClick={() => onAddAlternative?.(null)}>+ 대안 추가</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={styles.canvasWrapper}
      ref={wrapperRef}
      onClick={handleCanvasClick}
      onContextMenu={handleCanvasContextMenu}
    >
      <div
        className={styles.canvas}
        style={{ width: canvasWidth, height: canvasHeight }}
      >
        {/* SVG layer */}
        <svg
          className={styles.svgLayer}
          width={canvasWidth}
          height={canvasHeight}
        >
          {renderConnections()}
          {/* Separator line between criteria and alternatives */}
          {separatorY && (
            <line
              x1={40}
              y1={separatorY}
              x2={canvasWidth - 40}
              y2={separatorY}
              className={styles.separatorLine}
            />
          )}
        </svg>

        {/* Node layer */}
        {nodes.map(node => (
          <CanvasNode
            key={node.id}
            node={node}
            isSelected={selectedId === node.id}
            onClick={handleNodeClick}
            onContextMenu={handleContextMenu}
            onAddChild={handleAddChild}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Context menu */}
      {contextMenu && contextMenuItems.length > 0 && (
        <div
          className={styles.contextMenu}
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenuItems.map((item, i) => (
            <button
              key={i}
              className={`${styles.menuItem} ${item.danger ? styles.menuItemDanger : ''}`}
              onClick={() => { item.action(); setContextMenu(null); }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
