import type { Tone } from "./sankey";

export type { Tone };

/**
 * `decision` is drawn as a rounded box with a heavier outline, not a diamond.
 * A diamond only fits about half the text of its bounding box, so every decision
 * would have to be shortened to two or three words, and the wasted corners push
 * the neighbouring lanes apart. The outline plus the labelled branches
 * ("yes" / "no") carry the same meaning in the space a step already uses.
 */
export type FlowNodeKind = "step" | "decision" | "terminal";

export type FlowNode = {
  id: string;
  label: string;
  /** Lane, left to right. Gaps are kept: skipping a column leaves an empty lane. */
  col: number;
  /** Step, top to bottom. Flow reads downward. */
  row: number;
  kind?: FlowNodeKind;
  /** Secondary text under the label, e.g. a condition or a source. */
  note?: string;
  tone?: Tone;
};

/** The box edge an edge leaves its source by. */
export type FlowPort = "top" | "right" | "bottom" | "left";

export type FlowEdge = {
  from: string;
  to: string;
  /** Short branch text, e.g. "yes". Becomes the accessible title. */
  label?: string;
  tone?: Tone;
  /**
   * Forces the port the edge leaves its source by. The default follows the grid:
   * straight down within a lane, out of the facing side when the lane changes.
   * Reach for `bottom` when the default sideways run would cross a box.
   */
  side?: FlowPort;
};

export type FlowchartSpec = { nodes: FlowNode[]; edges: FlowEdge[] };

export type FlowLayoutOptions = {
  /** Minimum drawn width. Wider content wins, so the frame scrolls instead of shrinking. */
  width: number;
  /** Minimum drawn height. */
  height?: number;
  /** Longest label line before wrapping. */
  maxTextWidth?: number;
  minNodeWidth?: number;
  colGap?: number;
  rowGap?: number;
  marginX?: number;
  marginY?: number;
  /** Corner radius on connector elbows. */
  corner?: number;
};

export type Point = { x: number; y: number };

export type PlacedFlowNode = FlowNode & {
  kind: FlowNodeKind;
  x: number;
  y: number;
  width: number;
  height: number;
  cx: number;
  cy: number;
  /** Corner radius: half the height for a terminal, so it draws as a pill. */
  rx: number;
  /** Label wrapped to the node width, one string per line. */
  lines: string[];
  /** Baseline of the first label line. Later lines step by `lineHeight`. */
  labelBaseline: number;
  lineHeight: number;
  noteBaseline?: number;
};

export type PlacedFlowEdge = FlowEdge & {
  /** Corner points, source box edge first, target box edge last. */
  points: Point[];
  path: string;
  labelX?: number;
  labelY?: number;
  labelAnchor?: "start" | "middle" | "end";
  /** Stagger index for the draw-in: rows are the flow steps here. */
  step: number;
};

export type FlowchartLayout = {
  nodes: PlacedFlowNode[];
  edges: PlacedFlowEdge[];
  width: number;
  height: number;
};

const LABEL_SIZE = 13;
const NOTE_SIZE = 12;
const LINE_H = 18;
const NOTE_LINE_H = 16;
const NOTE_GAP = 2;
/** Baseline inside a line box, roughly the cap height of the 13px label. */
const BASELINE = 13;
const NOTE_BASELINE = 12;
const PAD_X = 14;
const PAD_Y = 12;
const MIN_NODE_HEIGHT = 40;
/** Gap between a connector and its label. */
const EDGE_LABEL_PAD = 7;
/** How far outside the drawing a back edge runs. */
const BACK_LANE = 22;

/** Wider and narrower glyphs, so a one-factor estimate does not wrap mid-phrase. */
const WIDE = new Set([..."MWmw@%"]);
const NARROW = new Set([..."iljtfrI.,;:'’!|()[]{} "]);

/** Advance-width estimate for the UI sans. Layout is pure, so it cannot measure. */
export function estimateTextWidth(text: string, fontSize: number): number {
  let em = 0;
  for (const ch of text) {
    if (NARROW.has(ch)) em += 0.34;
    else if (WIDE.has(ch)) em += 0.88;
    else if (ch >= "A" && ch <= "Z") em += 0.66;
    else em += 0.55;
  }
  return em * fontSize;
}

function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];
  const lines: string[] = [];
  let line = words[0];
  for (const word of words.slice(1)) {
    const next = `${line} ${word}`;
    if (estimateTextWidth(next, fontSize) <= maxWidth) line = next;
    else {
      lines.push(line);
      line = word;
    }
  }
  lines.push(line);
  return lines;
}

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Pure layout for an authored grid: `col` is the lane, `row` is the step, and
 * nothing is placed automatically. Every node in a lane shares that lane's width
 * so the vertical connectors between them line up.
 */
export function layoutFlowchart(spec: FlowchartSpec, opts: FlowLayoutOptions): FlowchartLayout {
  const {
    width: minWidth,
    height: minHeight = 0,
    maxTextWidth = 168,
    minNodeWidth = 104,
    colGap = 44,
    rowGap = 44,
    marginX = 8,
    marginY = 8,
    corner = 8,
  } = opts;

  validate(spec);

  // 1. Size every node from its own text, then widen each lane to its widest node.
  const sized = spec.nodes.map((n) => {
    const lines = wrapText(n.label, maxTextWidth, LABEL_SIZE);
    const textWidth = Math.max(
      ...lines.map((l) => estimateTextWidth(l, LABEL_SIZE)),
      n.note ? estimateTextWidth(n.note, NOTE_SIZE) : 0,
    );
    const height = Math.max(
      MIN_NODE_HEIGHT,
      PAD_Y * 2 + lines.length * LINE_H + (n.note ? NOTE_GAP + NOTE_LINE_H : 0),
    );
    return { node: n, lines, width: Math.max(minNodeWidth, Math.ceil(textWidth) + PAD_X * 2), height };
  });

  const cols = spec.nodes.map((n) => n.col);
  const rows = spec.nodes.map((n) => n.row);
  const minCol = Math.min(...cols);
  const minRow = Math.min(...rows);
  const colCount = Math.max(...cols) - minCol + 1;
  const rowCount = Math.max(...rows) - minRow + 1;

  // An unused lane or step keeps its slot at zero size, so a skipped column still
  // reads as a skip rather than collapsing onto its neighbour.
  const colWidths = new Array<number>(colCount).fill(0);
  const rowHeights = new Array<number>(rowCount).fill(0);
  for (const s of sized) {
    const c = s.node.col - minCol;
    const r = s.node.row - minRow;
    colWidths[c] = Math.max(colWidths[c], s.width);
    rowHeights[r] = Math.max(rowHeights[r], s.height);
  }

  const colX: number[] = [];
  let x = 0;
  for (let c = 0; c < colCount; c++) {
    colX.push(x);
    x += colWidths[c] + colGap;
  }
  const rowY: number[] = [];
  let y = 0;
  for (let r = 0; r < rowCount; r++) {
    rowY.push(y);
    y += rowHeights[r] + rowGap;
  }

  // 2. Place in content coordinates. The whole drawing is shifted once at the end.
  const nodes: PlacedFlowNode[] = sized.map(({ node, lines, height }) => {
    const c = node.col - minCol;
    const r = node.row - minRow;
    const nx = colX[c];
    const ny = rowY[r] + (rowHeights[r] - height) / 2;
    const nw = colWidths[c];
    const kind = node.kind ?? "step";
    const textHeight = lines.length * LINE_H + (node.note ? NOTE_GAP + NOTE_LINE_H : 0);
    const textTop = ny + (height - textHeight) / 2;
    return {
      ...node,
      kind,
      x: nx,
      y: ny,
      width: nw,
      height,
      cx: nx + nw / 2,
      cy: ny + height / 2,
      rx: kind === "terminal" ? height / 2 : corner,
      lines,
      labelBaseline: textTop + BASELINE,
      lineHeight: LINE_H,
      noteBaseline: node.note ? textTop + lines.length * LINE_H + NOTE_GAP + NOTE_BASELINE : undefined,
    };
  });

  const placedById = new Map(nodes.map((n) => [n.id, n]));
  const contentRight = Math.max(...nodes.map((n) => n.x + n.width));
  const contentLeft = Math.min(...nodes.map((n) => n.x));

  // 3. Route connectors between box edges, then find where each label sits.
  const occupied = new Set(spec.nodes.map((n) => `${n.col},${n.row}`));
  const centreX = (contentLeft + contentRight) / 2;
  const routed = spec.edges.map((edge) => {
    const from = placedById.get(edge.from)!;
    const to = placedById.get(edge.to)!;
    const drawn = route(edge, from, to, { occupied, contentLeft, contentRight, rowGap });
    const points = simplify(drawn.points);
    const label = labelAnchorOf(edge.label, drawn.labelAt ?? longestSegment(points), centreX);
    return { edge, from, points, label };
  });

  // 4. Bounds cover boxes, connectors, and edge labels, so nothing is clipped.
  let minX = contentLeft;
  let maxX = contentRight;
  let minY = Math.min(...nodes.map((n) => n.y));
  let maxY = Math.max(...nodes.map((n) => n.y + n.height));
  for (const r of routed) {
    for (const p of r.points) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
    if (r.label) {
      minX = Math.min(minX, r.label.left);
      maxX = Math.max(maxX, r.label.right);
      minY = Math.min(minY, r.label.y - NOTE_SIZE);
      maxY = Math.max(maxY, r.label.y + 4);
    }
  }

  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;
  const width = Math.max(minWidth, Math.ceil(contentWidth + marginX * 2));
  const height = Math.max(minHeight, Math.ceil(contentHeight + marginY * 2));
  const dx = round((width - contentWidth) / 2 - minX);
  const dy = round((height - contentHeight) / 2 - minY);

  for (const n of nodes) {
    n.x = round(n.x + dx);
    n.y = round(n.y + dy);
    n.cx = round(n.cx + dx);
    n.cy = round(n.cy + dy);
    n.labelBaseline = round(n.labelBaseline + dy);
    if (n.noteBaseline !== undefined) n.noteBaseline = round(n.noteBaseline + dy);
  }

  const edges: PlacedFlowEdge[] = routed.map(({ edge, from, points, label }) => {
    const moved = points.map((p) => ({ x: round(p.x + dx), y: round(p.y + dy) }));
    return {
      ...edge,
      points: moved,
      path: orthPath(moved, corner),
      labelX: label ? round(label.x + dx) : undefined,
      labelY: label ? round(label.y + dy) : undefined,
      labelAnchor: label?.anchor,
      step: from.row - minRow,
    };
  });

  return { nodes, edges, width, height };
}

function validate(spec: FlowchartSpec): void {
  if (spec.nodes.length === 0) throw new Error("Flowchart needs at least one node");
  const byId = new Map<string, FlowNode>();
  const cells = new Map<string, string>();
  for (const n of spec.nodes) {
    if (byId.has(n.id)) throw new Error(`Flowchart has two nodes with id "${n.id}"`);
    if (!Number.isInteger(n.col) || !Number.isInteger(n.row)) {
      throw new Error(`Flowchart node "${n.id}" needs integer col and row`);
    }
    const cell = `${n.col},${n.row}`;
    const taken = cells.get(cell);
    if (taken) throw new Error(`Flowchart nodes "${taken}" and "${n.id}" share column ${n.col} row ${n.row}`);
    cells.set(cell, n.id);
    byId.set(n.id, n);
  }
  for (const e of spec.edges) {
    if (!byId.has(e.from)) throw new Error(`Flowchart edge references unknown node "${e.from}"`);
    if (!byId.has(e.to)) throw new Error(`Flowchart edge references unknown node "${e.to}"`);
    if (e.from === e.to) throw new Error(`Flowchart edge loops on node "${e.from}"`);
  }
}

type RouteContext = {
  occupied: Set<string>;
  contentLeft: number;
  contentRight: number;
  rowGap: number;
};

type Route = {
  points: Point[];
  /** Segment the label must sit beside, when the longest one is the wrong place. */
  labelAt?: [Point, Point];
};

/**
 * Orthogonal routes only. Downward within a lane is a straight drop; a lane
 * change leaves the facing side and drops into the target's top; a step back up
 * runs out to a lane beside the drawing and rejoins at the target's top.
 */
function route(edge: FlowEdge, from: PlacedFlowNode, to: PlacedFlowNode, ctx: RouteContext): Route {
  const down = to.row > from.row;
  const up = to.row < from.row;
  const sameCol = to.col === from.col;

  if (down && sameCol && edge.side !== "left" && edge.side !== "right") {
    return {
      points: [
        { x: from.cx, y: from.y + from.height },
        { x: to.cx, y: to.y },
      ],
    };
  }

  if (down) {
    // Leaving sideways only works while the source's own row stays clear all the
    // way across, target lane included. Otherwise drop below the source first.
    const port = edge.side ?? (sidewaysIsClear(from, to, ctx.occupied) ? (to.col > from.col ? "right" : "left") : "bottom");
    if (port === "bottom" || port === "top") {
      const midY = (from.y + from.height + to.y) / 2;
      return {
        points: [
          { x: from.cx, y: from.y + from.height },
          { x: from.cx, y: midY },
          { x: to.cx, y: midY },
          { x: to.cx, y: to.y },
        ],
      };
    }
    const startX = port === "right" ? from.x + from.width : from.x;
    return {
      points: [
        { x: startX, y: from.cy },
        { x: to.cx, y: from.cy },
        { x: to.cx, y: to.y },
      ],
    };
  }

  if (!up) {
    // Same row: a straight run between the two facing sides.
    const rightwards = to.col > from.col;
    return {
      points: [
        { x: rightwards ? from.x + from.width : from.x, y: from.cy },
        { x: rightwards ? to.x : to.x + to.width, y: to.cy },
      ],
    };
  }

  // Back edge: out to a lane beside the drawing, up, and in at the target's top,
  // the one port a forward edge in the same lane also uses, so the two converge
  // instead of fighting over a side.
  const side = edge.side === "left" || edge.side === "right" ? edge.side : to.col <= from.col ? "left" : "right";
  const laneX = side === "right" ? ctx.contentRight + BACK_LANE : ctx.contentLeft - BACK_LANE;
  const approachY = to.y - ctx.rowGap / 2;
  const lane: [Point, Point] = [
    { x: laneX, y: from.cy },
    { x: laneX, y: approachY },
  ];
  return {
    points: [
      { x: side === "right" ? from.x + from.width : from.x, y: from.cy },
      ...lane,
      { x: to.cx, y: approachY },
      { x: to.cx, y: to.y },
    ],
    labelAt: lane,
  };
}

/** True when no box sits in the source's row between the two lanes, inclusive of the target lane. */
function sidewaysIsClear(from: PlacedFlowNode, to: PlacedFlowNode, occupied: Set<string>): boolean {
  const step = to.col > from.col ? 1 : -1;
  for (let col = from.col + step; ; col += step) {
    if (occupied.has(`${col},${from.row}`)) return false;
    if (col === to.col) return true;
  }
}

function longestSegment(points: Point[]): [Point, Point] {
  let best: [Point, Point] = [points[0], points[1]];
  let bestLength = -1;
  for (let i = 0; i < points.length - 1; i++) {
    const length = len(points[i], points[i + 1]);
    if (length > bestLength) {
      bestLength = length;
      best = [points[i], points[i + 1]];
    }
  }
  return best;
}

/**
 * Labels sit beside a segment rather than on it: the gaps between rows and lanes
 * are empty by construction, so an offset label needs no backing rect, which
 * would either hide the connector or show it through. A vertical run takes its
 * label on the outward side, away from the drawing's centre, so a loop-back
 * running down the margin never lands its label on a box.
 */
function labelAnchorOf(label: string | undefined, [a, b]: [Point, Point], centreX: number) {
  if (!label) return undefined;
  const textWidth = estimateTextWidth(label, NOTE_SIZE);
  if (Math.abs(b.y - a.y) >= Math.abs(b.x - a.x)) {
    const y = (a.y + b.y) / 2 + 4;
    if (a.x < centreX - 1) {
      const x = a.x - EDGE_LABEL_PAD;
      return { x, y, anchor: "end" as const, left: x - textWidth, right: x };
    }
    const x = a.x + EDGE_LABEL_PAD;
    return { x, y, anchor: "start" as const, left: x, right: x + textWidth };
  }
  const x = (a.x + b.x) / 2;
  const y = Math.min(a.y, b.y) - EDGE_LABEL_PAD;
  return { x, y, anchor: "middle" as const, left: x - textWidth / 2, right: x + textWidth / 2 };
}

/** Drops repeated and collinear points so the corner radius has room to apply. */
function simplify(points: Point[]): Point[] {
  const out: Point[] = [];
  for (const p of points) {
    const last = out[out.length - 1];
    if (last && last.x === p.x && last.y === p.y) continue;
    out.push(p);
  }
  const kept: Point[] = [];
  for (let i = 0; i < out.length; i++) {
    const prev = kept[kept.length - 1];
    const next = out[i + 1];
    if (prev && next) {
      const flat = prev.y === out[i].y && out[i].y === next.y;
      const upright = prev.x === out[i].x && out[i].x === next.x;
      if (flat || upright) continue;
    }
    kept.push(out[i]);
  }
  return kept;
}

/** Orthogonal path with quadratic corners, clamped to half the shorter leg. */
export function orthPath(points: Point[], radius: number): string {
  if (points.length < 2) return "";
  const at = (p: Point) => `${round(p.x)},${round(p.y)}`;
  let d = `M${at(points[0])}`;
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    const next = points[i + 1];
    const r = Math.min(radius, len(prev, cur) / 2, len(cur, next) / 2);
    d += ` L${at(towards(cur, prev, r))} Q${at(cur)} ${at(towards(cur, next, r))}`;
  }
  d += ` L${at(points[points.length - 1])}`;
  return d;
}

const len = (a: Point, b: Point) => Math.abs(b.x - a.x) + Math.abs(b.y - a.y);

function towards(from: Point, to: Point, distance: number): Point {
  const total = len(from, to);
  if (total === 0) return from;
  return {
    x: from.x + ((to.x - from.x) * distance) / total,
    y: from.y + ((to.y - from.y) * distance) / total,
  };
}
