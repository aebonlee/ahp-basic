// Layout constants
const NODE_WIDTH = 140;
const NODE_HEIGHT = 48;
const LEVEL_GAP = 80;
const NODE_GAP = 24;
const PADDING = 40;
const ALT_SEPARATOR_GAP = 40;

/**
 * Build a unified canvas tree from criteria tree + alternatives.
 * Each node: { id, label, type, level, children, data }
 */
export function buildCanvasTree(projectName, criteriaTree, alternatives) {
  const goalNode = {
    id: '__goal__',
    label: projectName || '프로젝트',
    type: 'goal',
    level: 0,
    children: [],
    data: null,
  };

  function mapCriteria(nodes, level) {
    return nodes.map(c => ({
      id: `c_${c.id}`,
      label: c.name,
      type: 'criteria',
      level,
      children: mapCriteria(c.children || [], level + 1),
      data: c,
    }));
  }

  goalNode.children = mapCriteria(criteriaTree, 1);

  const altNodes = alternatives.map(a => ({
    id: `a_${a.id}`,
    label: a.name,
    type: 'alternative',
    level: -1, // will be set during layout
    children: [],
    data: a,
  }));

  return { goalNode, altNodes };
}

/**
 * Compute positions for all nodes.
 * Returns { nodes: [{...node, x, y, width, height}], connections: [{from, to, type}], canvasWidth, canvasHeight }
 */
export function computeLayout(goalNode, altNodes, containerWidth) {
  const positioned = [];
  const connections = [];

  // Step 1: Calculate subtree widths (bottom-up)
  function subtreeWidth(node) {
    if (!node.children || node.children.length === 0) {
      return NODE_WIDTH;
    }
    const childWidths = node.children.map(subtreeWidth);
    return childWidths.reduce((sum, w) => sum + w, 0) + NODE_GAP * (node.children.length - 1);
  }

  const totalCriteriaWidth = subtreeWidth(goalNode);
  const totalAltWidth = altNodes.length > 0
    ? altNodes.length * NODE_WIDTH + NODE_GAP * (altNodes.length - 1)
    : 0;
  const contentWidth = Math.max(totalCriteriaWidth, totalAltWidth);
  const canvasWidth = Math.max(contentWidth + PADDING * 2, containerWidth || 600);

  // Step 2: Position criteria tree (top-down, center-aligned)
  let maxCriteriaLevel = 0;

  function positionTree(node, left, top) {
    const sw = subtreeWidth(node);
    const x = left + (sw - NODE_WIDTH) / 2;
    const y = top;

    if (node.level > maxCriteriaLevel) maxCriteriaLevel = node.level;

    positioned.push({
      ...node,
      x,
      y,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    });

    if (node.children && node.children.length > 0) {
      let childLeft = left;
      for (const child of node.children) {
        const cw = subtreeWidth(child);
        positionTree(child, childLeft, top + NODE_HEIGHT + LEVEL_GAP);
        connections.push({
          from: node.id,
          to: child.id,
          type: 'criteria',
        });
        childLeft += cw + NODE_GAP;
      }
    }
  }

  const criteriaLeft = (canvasWidth - totalCriteriaWidth) / 2;
  positionTree(goalNode, criteriaLeft, PADDING);

  // Step 3: Find leaf criteria for alt connections
  function getLeaves(node) {
    if (!node.children || node.children.length === 0) {
      return [node.id];
    }
    return node.children.flatMap(getLeaves);
  }
  const leafCriteriaIds = goalNode.children.length > 0
    ? goalNode.children.flatMap(getLeaves)
    : [];

  // Step 4: Position alternative nodes below criteria with separator
  const altTop = PADDING + (maxCriteriaLevel + 1) * (NODE_HEIGHT + LEVEL_GAP) + ALT_SEPARATOR_GAP;
  const separatorY = altTop - ALT_SEPARATOR_GAP / 2;

  if (altNodes.length > 0) {
    const altTotalWidth = altNodes.length * NODE_WIDTH + NODE_GAP * (altNodes.length - 1);
    let altLeft = (canvasWidth - altTotalWidth) / 2;

    for (const alt of altNodes) {
      positioned.push({
        ...alt,
        level: maxCriteriaLevel + 2,
        x: altLeft,
        y: altTop,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      });

      // Connect each leaf criterion to each alternative
      for (const leafId of leafCriteriaIds) {
        connections.push({
          from: leafId,
          to: alt.id,
          type: 'alternative',
        });
      }

      altLeft += NODE_WIDTH + NODE_GAP;
    }
  }

  const canvasHeight = altNodes.length > 0
    ? altTop + NODE_HEIGHT + PADDING
    : PADDING + (maxCriteriaLevel + 1) * (NODE_HEIGHT + LEVEL_GAP) + PADDING;

  return {
    nodes: positioned,
    connections,
    canvasWidth,
    canvasHeight,
    separatorY: altNodes.length > 0 ? separatorY : null,
    separatorX: null,
    orientation: 'vertical',
  };
}

// Horizontal layout constants
const H_NODE_HEIGHT = 56;
const H_MIN_WIDTH = 120;
const H_MAX_WIDTH = 280;

/** Estimate node width from label text (Korean ~11px, Latin ~7px at 0.82rem) */
function estimateNodeWidth(label) {
  let w = 0;
  for (const ch of label) {
    w += ch.charCodeAt(0) > 255 ? 11 : 7;
  }
  return Math.max(H_MIN_WIDTH, Math.min(H_MAX_WIDTH, w + 28));
}

/**
 * Compute horizontal (left-to-right) layout.
 * Dynamic node widths based on text length. Nodes in the same level
 * share the widest width for clean column alignment.
 */
export function computeHorizontalLayout(goalNode, altNodes, containerHeight) {
  const positioned = [];
  const connections = [];
  const nodeHeight = H_NODE_HEIGHT;

  // Step 1: Estimate width per node, collect max per level
  const widthMap = new Map();
  const levelMaxWidth = {};
  let maxCriteriaLevel = 0;

  function measureTree(node) {
    widthMap.set(node.id, estimateNodeWidth(node.label));
    if (node.level > maxCriteriaLevel) maxCriteriaLevel = node.level;
    levelMaxWidth[node.level] = Math.max(levelMaxWidth[node.level] || 0, widthMap.get(node.id));
    node.children?.forEach(measureTree);
  }
  measureTree(goalNode);
  altNodes.forEach(a => widthMap.set(a.id, estimateNodeWidth(a.label)));

  // Step 2: X offset per level (columns)
  const levelX = {};
  let xOffset = PADDING;
  for (let l = 0; l <= maxCriteriaLevel; l++) {
    levelX[l] = xOffset;
    xOffset += (levelMaxWidth[l] || H_MIN_WIDTH) + LEVEL_GAP;
  }

  // Step 3: Subtree heights
  function subtreeHeight(node) {
    if (!node.children || node.children.length === 0) return nodeHeight;
    return node.children.map(subtreeHeight).reduce((s, h) => s + h, 0) + NODE_GAP * (node.children.length - 1);
  }

  const totalCriteriaHeight = subtreeHeight(goalNode);
  const totalAltHeight = altNodes.length > 0
    ? altNodes.length * nodeHeight + NODE_GAP * (altNodes.length - 1) : 0;
  const canvasHeight = Math.max(
    Math.max(totalCriteriaHeight, totalAltHeight) + PADDING * 2,
    containerHeight || 400
  );

  // Step 4: Position criteria tree
  function positionTree(node, top) {
    const sh = subtreeHeight(node);
    const lvl = node.level;
    const w = levelMaxWidth[lvl] || widthMap.get(node.id);
    const x = levelX[lvl];
    const y = top + (sh - nodeHeight) / 2;

    positioned.push({ ...node, x, y, width: w, height: nodeHeight });

    if (node.children?.length > 0) {
      let childTop = top;
      for (const child of node.children) {
        const ch = subtreeHeight(child);
        positionTree(child, childTop);
        connections.push({ from: node.id, to: child.id, type: 'criteria' });
        childTop += ch + NODE_GAP;
      }
    }
  }

  const criteriaTop = (canvasHeight - totalCriteriaHeight) / 2;
  positionTree(goalNode, criteriaTop);

  // Step 5: Leaf criteria
  function getLeaves(node) {
    if (!node.children || node.children.length === 0) return [node.id];
    return node.children.flatMap(getLeaves);
  }
  const leafCriteriaIds = goalNode.children.length > 0
    ? goalNode.children.flatMap(getLeaves) : [];

  // Step 6: Position alternatives
  const altLeft = xOffset + ALT_SEPARATOR_GAP;
  const separatorX = xOffset + ALT_SEPARATOR_GAP / 2;
  const altWidth = altNodes.length > 0
    ? Math.max(...altNodes.map(a => widthMap.get(a.id)), H_MIN_WIDTH) : H_MIN_WIDTH;

  if (altNodes.length > 0) {
    const altTotalHeight = altNodes.length * nodeHeight + NODE_GAP * (altNodes.length - 1);
    let altTop = (canvasHeight - altTotalHeight) / 2;

    for (const alt of altNodes) {
      positioned.push({
        ...alt,
        level: maxCriteriaLevel + 2,
        x: altLeft,
        y: altTop,
        width: altWidth,
        height: nodeHeight,
      });
      for (const leafId of leafCriteriaIds) {
        connections.push({ from: leafId, to: alt.id, type: 'alternative' });
      }
      altTop += nodeHeight + NODE_GAP;
    }
  }

  const canvasWidth = altNodes.length > 0
    ? altLeft + altWidth + PADDING
    : xOffset + PADDING;

  return {
    nodes: positioned,
    connections,
    canvasWidth,
    canvasHeight,
    separatorY: null,
    separatorX: altNodes.length > 0 ? separatorX : null,
    orientation: 'horizontal',
  };
}

export { NODE_WIDTH, NODE_HEIGHT, LEVEL_GAP, NODE_GAP, PADDING };
