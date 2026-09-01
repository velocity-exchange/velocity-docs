import { describe, expect, it } from "vitest";
import { layoutFlow, type FlowSpec } from "./flow";

const spec: FlowSpec = {
  nodes: [
    { id: "taker", label: "Taker", column: 0 },
    { id: "router", label: "Router", column: 1, note: "one pass" },
    { id: "amm", label: "vAMM", column: 2 },
    { id: "book", label: "Book", column: 2, note: "clob", value: "execute_v0" },
  ],
  edges: [
    { from: "taker", to: "router" },
    { from: "router", to: "amm" },
    { from: "router", to: "book" },
  ],
};
const opts = { width: 640 };

describe("layoutFlow", () => {
  it("places columns left to right and spec order top to bottom", () => {
    const { nodes } = layoutFlow(spec, opts);
    const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));

    expect(nodes.map((n) => n.id)).toEqual(["taker", "router", "amm", "book"]);
    expect(byId.router.x0).toBeGreaterThan(byId.taker.x1);
    expect(byId.amm.x0).toBeGreaterThan(byId.router.x1);
    expect(byId.amm.x0).toBe(byId.book.x0);
    expect(byId.amm.y1).toBeLessThanOrEqual(byId.book.y0);
  });

  it("sizes a node by its own lines and centres each column on the tallest", () => {
    const { nodes, height } = layoutFlow(spec, opts);
    const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));

    // One line, two lines, three lines: strictly increasing box heights.
    const h = (id: string) => byId[id].y1 - byId[id].y0;
    expect(h("taker")).toBeLessThan(h("router"));
    expect(h("router")).toBeLessThan(h("book"));

    // The single-node column sits on the centre of the two-node column.
    const mid = (id: string) => (byId[id].y0 + byId[id].y1) / 2;
    expect(mid("taker")).toBeCloseTo((byId.amm.y0 + byId.book.y1) / 2, 5);
    expect(height).toBeGreaterThan(h("amm") + h("book"));
  });

  it("draws a forward edge between the facing sides", () => {
    const { nodes, edges } = layoutFlow(spec, opts);
    const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
    const edge = edges.find((e) => e.to === "amm")!;

    expect(edge.back).toBe(false);
    expect(edge.path.startsWith(`M${byId.router.x1},`)).toBe(true);
    expect(edge.labelX).toBeCloseTo((byId.router.x1 + byId.amm.x0) / 2, 5);
  });

  it("routes a return edge in a lane under every column, and pays height for it", () => {
    const forward = layoutFlow(spec, opts);
    const cycle = layoutFlow(
      { ...spec, edges: [...spec.edges, { from: "book", to: "router", label: "settles" }] },
      opts,
    );
    const edge = cycle.edges.find((e) => e.from === "book")!;
    const lowest = Math.max(...cycle.nodes.map((n) => n.y1));

    expect(edge.back).toBe(true);
    expect(edge.labelY).toBeGreaterThan(lowest);
    expect(cycle.height).toBeGreaterThan(forward.height);
  });

  it("treats a same-column edge as a return, so it never runs through a box", () => {
    const { edges } = layoutFlow(
      { ...spec, edges: [...spec.edges, { from: "amm", to: "book" }] },
      opts,
    );
    expect(edges.find((e) => e.from === "amm" && e.to === "book")!.back).toBe(true);
  });

  it("refuses an edge that names a node the spec does not hold", () => {
    expect(() => layoutFlow({ ...spec, edges: [{ from: "router", to: "ghost" }] }, opts)).toThrow(
      /unknown node "ghost"/,
    );
  });
});
