import type { Tone } from "./sankey";

export type { Tone };

/**
 * Where a node runs. The renderer draws `offchain` with a dashed outline. No
 * on-chain program can depend on an off-chain part, so the difference must be
 * visible without a label.
 */
export type NodeKind = "onchain" | "offchain";

export type FlowNode = {
  id: string;
  label: string;
  /** Left-to-right position. Columns are evenly spread across the width. */
  column: number;
  /** Secondary line, in the body sans. Keep it to a few words. */
  note?: string;
  /** Third line, in the mono stack: an account, a seed, an instruction name. */
  value?: string;
  kind?: NodeKind;
  tone?: Tone;
};

export type FlowEdge = {
  from: string;
  to: string;
  /** Sits at the edge's midpoint. Keep it to a few words. */
  label?: string;
  tone?: Tone;
  /** No on-chain program depends on this edge. The renderer dashes it. */
  dashed?: boolean;
};

export type FlowSpec = { nodes: FlowNode[]; edges: FlowEdge[] };

export type LayoutOptions = {
  width: number;
  nodeWidth?: number;
  /** Vertical gap between nodes in a column. */
  nodeGap?: number;
  /** Room outside the first and last columns. */
  marginX?: number;
  marginY?: number;
};

export type PlacedFlowNode = FlowNode & {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  lines: string[];
};

export type PlacedFlowEdge = FlowEdge & {
  path: string;
  /** Midpoint of the drawn path, where the label goes. */
  labelX: number;
  labelY: number;
  /** Source column, so the draw-in staggers left to right. */
  column: number;
  /** A return edge runs right to left under the columns. */
  back: boolean;
};

export type FlowLayout = {
  nodes: PlacedFlowNode[];
  edges: PlacedFlowEdge[];
  width: number;
  height: number;
};

/** Line box for one row of node text. */
const LINE = 16;
/** Vertical padding inside a node box. */
const PAD_Y = 11;
/** How far a return edge drops below the tallest column. */
const RETURN_DROP = 34;
/** Corner radius on a return edge's turns. */
const TURN = 10;

function linesOf(node: FlowNode): string[] {
  return [node.label, node.note, node.value].filter((line): line is string => Boolean(line));
}

function heightOf(node: FlowNode): number {
  return PAD_Y * 2 + linesOf(node).length * LINE;
}

/**
 * Pure layout for a layered flow. Columns run from left to right. Nodes run in
 * spec order from top to bottom inside a column. Each column is centred on the
 * tallest column.
 *
 * This function calculates the height. The caller does not supply one. The
 * content sets the size of a flow. A fixed height would clip the tallest column
 * or leave empty space under the others.
 */
export function layoutFlow(spec: FlowSpec, opts: LayoutOptions): FlowLayout {
  const { width, nodeWidth = 176, nodeGap = 18, marginX = 8, marginY = 12 } = opts;

  const byId = new Map(spec.nodes.map((n) => [n.id, n]));
  for (const e of spec.edges) {
    if (!byId.has(e.from)) throw new Error(`Flow edge references unknown node "${e.from}"`);
    if (!byId.has(e.to)) throw new Error(`Flow edge references unknown node "${e.to}"`);
  }

  const columns = [...new Set(spec.nodes.map((n) => n.column))].sort((a, b) => a - b);
  const span = width - marginX * 2 - nodeWidth;
  const step = columns.length > 1 ? span / (columns.length - 1) : 0;
  const xOf = new Map(columns.map((c, i) => [c, marginX + i * step]));

  // The tallest column sets the band. Every other column is centred in it.
  const stacks = columns.map((c) => spec.nodes.filter((n) => n.column === c));
  const stackHeights = stacks.map((stack) =>
    stack.reduce((sum, n, i) => sum + heightOf(n) + (i > 0 ? nodeGap : 0), 0),
  );
  const band = Math.max(...stackHeights);

  const nodes: PlacedFlowNode[] = [];
  stacks.forEach((stack, i) => {
    let y = marginY + (band - stackHeights[i]) / 2;
    for (const node of stack) {
      const h = heightOf(node);
      const x0 = xOf.get(node.column)!;
      nodes.push({ ...node, x0, x1: x0 + nodeWidth, y0: y, y1: y + h, lines: linesOf(node) });
      y += h + nodeGap;
    }
  });

  const placed = new Map(nodes.map((n) => [n.id, n]));
  const hasBack = spec.edges.some((e) => placed.get(e.to)!.column <= placed.get(e.from)!.column);
  const laneY = marginY + band + RETURN_DROP;
  // The lane adds height only when an edge uses it.
  const height = Math.round(hasBack ? laneY + marginY : marginY * 2 + band);

  const edges: PlacedFlowEdge[] = spec.edges.map((e) => {
    const from = placed.get(e.from)!;
    const to = placed.get(e.to)!;
    const back = to.column <= from.column;
    return { ...e, ...(back ? returnPath(from, to, laneY) : forwardPath(from, to)), column: from.column, back };
  });

  return { nodes, edges, width, height };
}

function midY(node: PlacedFlowNode): number {
  return (node.y0 + node.y1) / 2;
}

/**
 * Forward edge: a cubic curve between the two facing sides. Both control points
 * are on the horizontal through their own end point. Two nodes at the same
 * height therefore give a straight line.
 */
function forwardPath(from: PlacedFlowNode, to: PlacedFlowNode) {
  const [x0, y0] = [from.x1, midY(from)];
  const [x1, y1] = [to.x0, midY(to)];
  const c = Math.max(24, (x1 - x0) / 2);
  return {
    path: `M${x0},${y0} C${x0 + c},${y0} ${x1 - c},${y1} ${x1},${y1}`,
    labelX: (x0 + x1) / 2,
    labelY: (y0 + y1) / 2,
  };
}

/**
 * Return edge: it leaves the bottom of the source, crosses the figure in a lane
 * below every column, and rises into the bottom of the target. The lane is
 * below the columns, so the edge crosses no node box.
 */
function returnPath(from: PlacedFlowNode, to: PlacedFlowNode, laneY: number) {
  const x0 = (from.x0 + from.x1) / 2;
  const x1 = (to.x0 + to.x1) / 2;
  const y0 = from.y1;
  const y1 = to.y1;
  const dir = x1 < x0 ? -1 : 1;
  return {
    path: [
      `M${x0},${y0}`,
      `L${x0},${laneY - TURN}`,
      `Q${x0},${laneY} ${x0 + dir * TURN},${laneY}`,
      `L${x1 - dir * TURN},${laneY}`,
      `Q${x1},${laneY} ${x1},${laneY - TURN}`,
      `L${x1},${y1}`,
    ].join(" "),
    labelX: (x0 + x1) / 2,
    labelY: laneY,
  };
}
