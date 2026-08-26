import { describe, expect, it } from "vitest";
import { layoutFlowchart, type FlowchartSpec, type PlacedFlowNode } from "./flowchart";

const spec: FlowchartSpec = {
  nodes: [
    { id: "start", label: "Taker order", col: 1, row: 0, kind: "terminal" },
    { id: "check", label: "Is a maker quoting inside the auction price?", col: 1, row: 1, kind: "decision" },
    { id: "jit", label: "Fill against the JIT maker", col: 1, row: 2, tone: "signal" },
    { id: "amm", label: "Fall back to the vAMM", col: 2, row: 2, note: "spread applies" },
    { id: "done", label: "Order filled", col: 1, row: 3, kind: "terminal" },
    { id: "retry", label: "Wait one slot", col: 0, row: 1, tone: "out" },
  ],
  edges: [
    { from: "start", to: "check" },
    { from: "check", to: "jit", label: "yes", tone: "signal" },
    { from: "check", to: "amm", label: "no" },
    { from: "jit", to: "done" },
    { from: "amm", to: "done" },
    { from: "retry", to: "check" },
    { from: "done", to: "retry", label: "next order", tone: "out" },
  ],
};
const opts = { width: 560 };

const byId = (nodes: PlacedFlowNode[]) => Object.fromEntries(nodes.map((n) => [n.id, n]));
const firstNumbers = (path: string) => path.slice(1).split(/[ ,]/).slice(0, 2).map(Number);

describe("layoutFlowchart", () => {
  it("keeps the authored grid: x rises with col, y rises with row", () => {
    const { nodes } = layoutFlowchart(spec, opts);
    const n = byId(nodes);
    expect(n.retry.x).toBeLessThan(n.check.x);
    expect(n.check.x).toBeLessThan(n.amm.x);
    expect(n.start.y).toBeLessThan(n.check.y);
    expect(n.check.y).toBeLessThan(n.jit.y);
    expect(n.jit.y).toBeLessThan(n.done.y);
    expect(n.jit.cy).toBeCloseTo(n.amm.cy, 5);
  });

  it("gives every node in a lane the same width, so drops line up", () => {
    const { nodes } = layoutFlowchart(spec, opts);
    const lane = nodes.filter((node) => node.col === 1);
    const widths = new Set(lane.map((node) => node.width));
    expect(widths.size).toBe(1);
    for (const node of lane) expect(node.cx).toBeCloseTo(lane[0].cx, 5);
  });

  it("sizes a node to its label and wraps the long ones", () => {
    const { nodes } = layoutFlowchart(spec, opts);
    const n = byId(nodes);
    expect(n.check.lines.length).toBeGreaterThan(1);
    expect(n.check.lines.join(" ")).toBe("Is a maker quoting inside the auction price?");
    expect(n.check.height).toBeGreaterThan(n.start.height);
    const narrow = layoutFlowchart(
      { nodes: [{ id: "a", label: "Go", col: 0, row: 0 }], edges: [] },
      { ...opts, minNodeWidth: 60 },
    );
    expect(narrow.nodes[0].width).toBe(60);
  });

  it("draws a terminal as a pill and a step with the authored corner", () => {
    const { nodes } = layoutFlowchart(spec, { ...opts, corner: 8 });
    const n = byId(nodes);
    expect(n.start.rx).toBeCloseTo(n.start.height / 2, 5);
    expect(n.jit.rx).toBe(8);
    expect(n.check.kind).toBe("decision");
    expect(n.jit.kind).toBe("step");
  });

  it("starts and ends every connector on a box edge", () => {
    const { nodes, edges } = layoutFlowchart(spec, opts);
    const n = byId(nodes);
    for (const edge of edges) {
      const from = n[edge.from];
      const to = n[edge.to];
      expect(onBoxEdge(edge.points[0], from)).toBe(true);
      expect(onBoxEdge(edge.points[edge.points.length - 1], to)).toBe(true);
      expect(firstNumbers(edge.path)).toEqual([edge.points[0].x, edge.points[0].y]);
    }
  });

  it("routes a same-lane step as a straight drop from bottom to top", () => {
    const { nodes, edges } = layoutFlowchart(spec, opts);
    const n = byId(nodes);
    const drop = edges.find((e) => e.from === "start" && e.to === "check")!;
    expect(drop.points).toHaveLength(2);
    expect(drop.points[0].x).toBeCloseTo(drop.points[1].x, 5);
    expect(drop.points[0].y).toBeCloseTo(n.start.y + n.start.height, 5);
    expect(drop.points[1].y).toBeCloseTo(n.check.y, 5);
  });

  it("leaves the facing side when the lane changes, then drops into the target", () => {
    const { nodes, edges } = layoutFlowchart(spec, opts);
    const n = byId(nodes);
    const branch = edges.find((e) => e.from === "check" && e.to === "amm")!;
    expect(branch.points[0].x).toBeCloseTo(n.check.x + n.check.width, 5);
    expect(branch.points[0].y).toBeCloseTo(n.check.cy, 5);
    expect(branch.points[branch.points.length - 1].x).toBeCloseTo(n.amm.cx, 5);
    for (let i = 1; i < branch.points.length; i++) {
      const a = branch.points[i - 1];
      const b = branch.points[i];
      expect(a.x === b.x || a.y === b.y).toBe(true);
    }
  });

  it("runs a back edge outside the boxes and rejoins at the target's top", () => {
    const { nodes, edges } = layoutFlowchart(spec, opts);
    const n = byId(nodes);
    const back = edges.find((e) => e.from === "done" && e.to === "retry")!;
    const laneX = back.points[1].x;
    expect(laneX).toBeLessThan(Math.min(...nodes.map((node) => node.x)));
    expect(back.points[2].x).toBeCloseTo(laneX, 5);
    const end = back.points[back.points.length - 1];
    expect(end.x).toBeCloseTo(n.retry.cx, 5);
    expect(end.y).toBeCloseTo(n.retry.y, 5);
    // The label goes on the outward side of the margin lane, clear of the boxes.
    expect(back.labelAnchor).toBe("end");
    expect(back.labelX!).toBeLessThan(laneX);
  });

  it("drops below the source rather than running sideways through a box", () => {
    const { nodes, edges } = layoutFlowchart(spec, opts);
    const n = byId(nodes);
    // amm sits right of jit, so the sideways run into jit's lane would cross jit.
    const rejoin = edges.find((e) => e.from === "amm" && e.to === "done")!;
    expect(rejoin.points[0].x).toBeCloseTo(n.amm.cx, 5);
    expect(rejoin.points[0].y).toBeCloseTo(n.amm.y + n.amm.height, 5);
    for (const p of rejoin.points) expect(p.y).toBeGreaterThanOrEqual(n.amm.y + n.amm.height - 0.01);
  });

  it("puts an edge label clear of the boxes it runs between", () => {
    const { nodes, edges } = layoutFlowchart(spec, opts);
    const labelled = edges.filter((e) => e.label);
    expect(labelled).toHaveLength(3);
    for (const edge of labelled) {
      expect(edge.labelX).toBeTypeOf("number");
      expect(edge.labelY).toBeTypeOf("number");
      for (const node of nodes) {
        const inside =
          edge.labelX! > node.x &&
          edge.labelX! < node.x + node.width &&
          edge.labelY! > node.y &&
          edge.labelY! < node.y + node.height;
        expect(inside).toBe(false);
      }
    }
  });

  it("staggers the draw-in by the source row", () => {
    const { edges } = layoutFlowchart(spec, opts);
    expect(edges.find((e) => e.from === "start")!.step).toBe(0);
    expect(edges.find((e) => e.from === "jit")!.step).toBe(2);
  });

  it("fits everything inside the drawn box", () => {
    const { nodes, edges, width, height } = layoutFlowchart(spec, opts);
    expect(width).toBeGreaterThanOrEqual(560);
    for (const node of nodes) {
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.y).toBeGreaterThanOrEqual(0);
      expect(node.x + node.width).toBeLessThanOrEqual(width);
      expect(node.y + node.height).toBeLessThanOrEqual(height);
    }
    for (const edge of edges) {
      for (const p of edge.points) {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(width);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeLessThanOrEqual(height);
      }
    }
  });

  it("grows past the minimum width rather than shrinking the content", () => {
    const wide: FlowchartSpec = {
      nodes: [
        { id: "a", label: "One", col: 0, row: 0 },
        { id: "b", label: "Two", col: 1, row: 0 },
        { id: "c", label: "Three", col: 2, row: 0 },
      ],
      edges: [],
    };
    const tight = layoutFlowchart(wide, { width: 100 });
    expect(tight.width).toBeGreaterThan(100);
    const roomy = layoutFlowchart(wide, { width: 900 });
    expect(roomy.width).toBe(900);
    expect(roomy.nodes[0].width).toBe(tight.nodes[0].width);
  });

  it("centres the drawing when the container has room to spare", () => {
    const { nodes, width } = layoutFlowchart(spec, { width: 900 });
    const left = Math.min(...nodes.map((n) => n.x));
    const right = Math.max(...nodes.map((n) => n.x + n.width));
    expect(left).toBeGreaterThan(0);
    expect(width - right).toBeGreaterThan(0);
  });

  it("is deterministic", () => {
    expect(layoutFlowchart(spec, opts)).toEqual(layoutFlowchart(spec, opts));
  });

  it("throws on an edge to an unknown node", () => {
    const bad = { ...spec, edges: [...spec.edges, { from: "done", to: "nope" }] };
    expect(() => layoutFlowchart(bad, opts)).toThrow(/unknown node "nope"/);
  });

  it("throws on an edge from an unknown node", () => {
    const bad = { ...spec, edges: [...spec.edges, { from: "nope", to: "done" }] };
    expect(() => layoutFlowchart(bad, opts)).toThrow(/unknown node "nope"/);
  });

  it("throws on a duplicate id, a shared cell, a self edge, and an empty spec", () => {
    expect(() =>
      layoutFlowchart({ ...spec, nodes: [...spec.nodes, { id: "jit", label: "Again", col: 3, row: 3 }] }, opts),
    ).toThrow(/two nodes with id "jit"/);
    expect(() =>
      layoutFlowchart({ ...spec, nodes: [...spec.nodes, { id: "clash", label: "Again", col: 1, row: 2 }] }, opts),
    ).toThrow(/share column 1 row 2/);
    expect(() => layoutFlowchart({ ...spec, edges: [{ from: "jit", to: "jit" }] }, opts)).toThrow(/loops on node/);
    expect(() => layoutFlowchart({ nodes: [], edges: [] }, opts)).toThrow(/at least one node/);
  });

  it("rejects a left or right side on an edge that stays in one lane", () => {
    const nodes = [
      { id: "a", label: "A", col: 0, row: 0 },
      { id: "b", label: "B", col: 0, row: 1 },
    ];
    expect(() => layoutFlowchart({ nodes, edges: [{ from: "a", to: "b", side: "right" }] }, opts)).toThrow(/route through the source box/);
    expect(() => layoutFlowchart({ nodes, edges: [{ from: "a", to: "b", side: "bottom" }] }, opts)).not.toThrow();
  });

  it("counts node and edge stagger steps from the first row, not row zero", () => {
    const shifted = {
      nodes: [
        { id: "a", label: "A", col: 0, row: 5 },
        { id: "b", label: "B", col: 0, row: 6 },
      ],
      edges: [{ from: "a", to: "b" }],
    };
    const { nodes, edges } = layoutFlowchart(shifted, opts);
    expect(nodes.map((n) => n.step)).toEqual([0, 1]);
    expect(edges[0].step).toBe(0);
  });

  it("throws on a non-integer grid position", () => {
    const bad = { ...spec, nodes: [...spec.nodes, { id: "half", label: "Half", col: 1.5, row: 4 }] };
    expect(() => layoutFlowchart(bad, opts)).toThrow(/integer col and row/);
  });
});

function onBoxEdge(p: { x: number; y: number }, node: PlacedFlowNode): boolean {
  const e = 0.01;
  const right = node.x + node.width;
  const bottom = node.y + node.height;
  const withinX = p.x >= node.x - e && p.x <= right + e;
  const withinY = p.y >= node.y - e && p.y <= bottom + e;
  const onVertical = (Math.abs(p.x - node.x) < e || Math.abs(p.x - right) < e) && withinY;
  const onHorizontal = (Math.abs(p.y - node.y) < e || Math.abs(p.y - bottom) < e) && withinX;
  return onVertical || onHorizontal;
}
