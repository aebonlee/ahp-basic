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
  };
}

export { NODE_WIDTH, NODE_HEIGHT, LEVEL_GAP, NODE_GAP, PADDING };
