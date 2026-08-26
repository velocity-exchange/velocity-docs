import { describe, expect, it } from "vitest";
import { layoutFlow, type FlowSpec } from "../layout/flow";
import {
  fillTopologySpec,
  orderLifecycleSpec,
  relayLoopSpec,
  signingSpec,
} from "./router-fill.data";

/**
 * Node text is a single SVG line — it does not wrap, and it does not clip
 * either, so an over-long label silently spills across the figure. These
 * figures are drawn at a fixed width, so whether the text fits is arithmetic,
 * and arithmetic can be pinned.
 *
 * Advances are conservative averages for the three type roles the flow uses:
 * 13px sans labels, 12px sans notes, 12px mono values.
 */
const ADVANCE = { label: 6.8, note: 6.0, value: 7.2 } as const;
/** Room for an arrow head and a short edge label between two columns. */
const MIN_GAP = 45;

/** Every figure on the PropAMM page, at the width its component draws it. */
const figures: { name: string; spec: FlowSpec; width: number; nodeWidth: number }[] = [
  { name: "fill topology", spec: fillTopologySpec, width: 790, nodeWidth: 150 },
  { name: "signing identities", spec: signingSpec, width: 640, nodeWidth: 210 },
  { name: "order lifecycle", spec: orderLifecycleSpec, width: 790, nodeWidth: 150 },
  { name: "relay loop", spec: relayLoopSpec, width: 790, nodeWidth: 150 },
];

describe.each(figures)("$name", ({ spec, width, nodeWidth }) => {
  const { nodes, edges } = layoutFlow(spec, { width, nodeWidth });

  it("leaves room between columns for an arrow", () => {
    const columns = [...new Set(nodes.map((n) => n.column))].sort((a, b) => a - b);
    for (let i = 1; i < columns.length; i++) {
      const left = nodes.find((n) => n.column === columns[i - 1])!;
      const right = nodes.find((n) => n.column === columns[i])!;
      expect(right.x0 - left.x1).toBeGreaterThanOrEqual(MIN_GAP);
    }
  });

  it("keeps every line inside its own node box", () => {
    for (const node of nodes) {
      const room = node.x1 - node.x0 - 16;
      for (const role of ["label", "note", "value"] as const) {
        const text = node[role];
        if (!text) continue;
        // The message carries the text, because the fix is always to shorten it.
        expect(
          Math.round(text.length * ADVANCE[role]),
          `${node.id}.${role} "${text}" does not fit ${room}px`,
        ).toBeLessThanOrEqual(room);
      }
    }
  });

  it("keeps a forward edge's label inside the gap it sits in", () => {
    for (const edge of edges) {
      if (!edge.label || edge.back) continue;
      const from = nodes.find((n) => n.id === edge.from)!;
      const to = nodes.find((n) => n.id === edge.to)!;
      expect(edge.label.length * ADVANCE.note).toBeLessThanOrEqual(to.x0 - from.x1);
    }
  });

  it("stacks nodes in a column without overlap", () => {
    const columns = [...new Set(nodes.map((n) => n.column))];
    for (const column of columns) {
      const stack = nodes.filter((n) => n.column === column);
      for (let i = 1; i < stack.length; i++) {
        expect(stack[i].y0).toBeGreaterThanOrEqual(stack[i - 1].y1);
      }
    }
  });
});
