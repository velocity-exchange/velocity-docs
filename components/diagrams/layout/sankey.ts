import { sankey, sankeyLinkHorizontal } from "d3-sankey";

export type Tone = "default" | "out" | "signal";

export type SankeyNode = {
  id: string;
  label: string;
  column: number;
  /** Short value text shown next to the label, e.g. "10%". */
  value?: string;
  /** Secondary text under the label, e.g. a range. */
  note?: string;
  tone?: Tone;
};

export type SankeyLink = {
  from: string;
  to: string;
  value: number;
  label?: string;
  tone?: Tone;
};

export type SankeySpec = { nodes: SankeyNode[]; links: SankeyLink[] };

export type LayoutOptions = {
  width: number;
  height: number;
  nodeWidth?: number;
  nodeGap?: number;
  marginX?: number;
  marginY?: number;
};

export type PlacedNode = SankeyNode & {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  inflow: number;
  outflow: number;
};

export type PlacedLink = SankeyLink & {
  path: string;
  width: number;
  y0: number;
  y1: number;
};

// Deliberately not `SankeyNode & {...}`: d3-sankey's own node shape expects an
// optional numeric `value`, which collides with our domain `value?: string`
// (the label text, e.g. "10%"). Only pass the fields d3 needs to compute layout;
// the rest of each SankeyNode is merged back in from `spec.nodes` after layout.
type DNode = { id: string; column: number; index?: number; x0?: number; x1?: number; y0?: number; y1?: number };
type DLink = { source: DNode | string; target: DNode | string; value: number; width?: number; y0?: number; y1?: number; tone?: Tone; label?: string };

/**
 * Pure layout: fixed columns (node.column), vertical order = spec order.
 * Wraps d3-sankey so renderers never import d3.
 */
export function layoutSankey(spec: SankeySpec, opts: LayoutOptions): { nodes: PlacedNode[]; links: PlacedLink[] } {
  const { width, height, nodeWidth = 12, nodeGap = 16, marginX = 0, marginY = 0 } = opts;

  const ids = new Set(spec.nodes.map((n) => n.id));
  for (const l of spec.links) {
    if (!ids.has(l.from)) throw new Error(`Sankey link references unknown node "${l.from}"`);
    if (!ids.has(l.to)) throw new Error(`Sankey link references unknown node "${l.to}"`);
  }

  const order = new Map(spec.nodes.map((n, i) => [n.id, i]));
  const dNodes: DNode[] = spec.nodes.map((n) => ({ id: n.id, column: n.column }));
  const dLinks: DLink[] = spec.links.map((l) => ({ source: l.from, target: l.to, value: l.value, tone: l.tone, label: l.label }));

  const gen = sankey<DNode, DLink>()
    .nodeId((d) => d.id)
    .nodeAlign((d) => d.column)
    .nodeWidth(nodeWidth)
    .nodePadding(nodeGap)
    .nodeSort((a, b) => order.get(a.id)! - order.get(b.id)!)
    .linkSort((a, b) => order.get((a.target as DNode).id)! - order.get((b.target as DNode).id)!)
    .extent([
      [marginX, marginY],
      [width - marginX, height - marginY],
    ]);

  const graph = gen({ nodes: dNodes, links: dLinks });
  const pathOf = sankeyLinkHorizontal<DNode, DLink>();

  const inflow = new Map<string, number>();
  const outflow = new Map<string, number>();
  for (const l of spec.links) {
    outflow.set(l.from, (outflow.get(l.from) ?? 0) + l.value);
    inflow.set(l.to, (inflow.get(l.to) ?? 0) + l.value);
  }

  const nodes: PlacedNode[] = spec.nodes.map((n) => {
    const d = graph.nodes.find((g) => g.id === n.id)!;
    return {
      ...n,
      x0: d.x0!,
      x1: d.x1!,
      y0: d.y0!,
      y1: d.y1!,
      inflow: inflow.get(n.id) ?? 0,
      outflow: outflow.get(n.id) ?? 0,
    };
  });

  const links: PlacedLink[] = graph.links.map((l, i) => ({
    ...spec.links[i],
    path: pathOf(l) ?? "",
    width: l.width!,
    y0: l.y0!,
    y1: l.y1!,
  }));

  return { nodes, links };
}
