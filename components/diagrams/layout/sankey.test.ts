import { describe, expect, it } from "vitest";
import { layoutSankey, type SankeySpec } from "./sankey";

const spec: SankeySpec = {
  nodes: [
    { id: "gross", label: "Gross", column: 0 },
    { id: "a", label: "A", column: 1, tone: "out" },
    { id: "net", label: "Net", column: 1 },
    { id: "x", label: "X", column: 2 },
    { id: "y", label: "Y", column: 2, tone: "signal" },
  ],
  links: [
    { from: "gross", to: "a", value: 30 },
    { from: "gross", to: "net", value: 70 },
    { from: "net", to: "x", value: 21 },
    { from: "net", to: "y", value: 49 },
  ],
};
const opts = { width: 600, height: 300, nodeWidth: 12, nodeGap: 16 };

describe("layoutSankey", () => {
  it("keeps node order and columns from the spec", () => {
    const { nodes } = layoutSankey(spec, opts);
    expect(nodes.map((n) => n.id)).toEqual(["gross", "a", "net", "x", "y"]);
    const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
    expect(byId.a.x0).toBeGreaterThan(byId.gross.x1);
    expect(byId.x.x0).toBeGreaterThan(byId.net.x1);
    expect(byId.a.x0).toBe(byId.net.x0);
    expect(byId.a.y1).toBeLessThanOrEqual(byId.net.y0);
  });

  it("conserves flow: interior node inflow equals outflow", () => {
    const { nodes } = layoutSankey(spec, opts);
    const net = nodes.find((n) => n.id === "net")!;
    expect(net.inflow).toBe(70);
    expect(net.outflow).toBe(70);
  });

  it("makes link widths sum to the source node height", () => {
    const { nodes, links } = layoutSankey(spec, opts);
    const gross = nodes.find((n) => n.id === "gross")!;
    const out = links.filter((l) => l.from === "gross");
    const sum = out.reduce((s, l) => s + l.width, 0);
    expect(sum).toBeCloseTo(gross.y1 - gross.y0, 5);
  });

  it("stays inside the box and produces a path per link", () => {
    const { nodes, links } = layoutSankey(spec, opts);
    for (const n of nodes) {
      expect(n.x0).toBeGreaterThanOrEqual(0);
      expect(n.y0).toBeGreaterThanOrEqual(0);
      expect(n.x1).toBeLessThanOrEqual(600);
      expect(n.y1).toBeLessThanOrEqual(300);
    }
    for (const l of links) {
      expect(l.path.startsWith("M")).toBe(true);
    }
  });

  it("honours separate left and right margins", () => {
    const { nodes } = layoutSankey(spec, { ...opts, marginLeft: 100, marginRight: 40 });
    const first = nodes.filter((n) => n.column === 0);
    const last = nodes.filter((n) => n.column === 2);
    for (const n of first) expect(n.x0).toBe(100);
    for (const n of last) expect(n.x1).toBe(600 - 40);
  });

  it("is deterministic", () => {
    expect(layoutSankey(spec, opts)).toEqual(layoutSankey(spec, opts));
  });

  it("throws on a link to an unknown node", () => {
    const bad = { ...spec, links: [...spec.links, { from: "net", to: "nope", value: 1 }] };
    expect(() => layoutSankey(bad, opts)).toThrow(/unknown node/i);
  });
});
