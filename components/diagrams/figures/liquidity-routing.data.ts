import type { FlowchartSpec } from "../layout/flowchart";

// Source: content/protocol/how-it-works/matching-engine.mdx and
// content/developers/market-makers/orderbook-and-matching.mdx ("How matching works"),
// which describe the fill plan built by determine_perp_fulfillment_methods.
// Only the ordering those pages state is drawn: no waterfall between sources,
// an AMM quote inserted ahead of a level it beats, and one residual AMM fill.
export const liquidityRoutingSpec: FlowchartSpec = {
  nodes: [
    { id: "order", label: "Taker order", col: 0, row: 0, kind: "terminal", note: "your limit caps fills" },
    { id: "level", label: "Take the next best price level", col: 0, row: 1, note: "price, then time" },
    { id: "compare", label: "Is the AMM quote better than this level?", col: 0, row: 2, kind: "decision" },
    { id: "ammFirst", label: "AMM fills first", col: 1, row: 3, note: "up to this price", tone: "signal" },
    { id: "maker", label: "Best quote at this level fills", col: 0, row: 3, note: "resting or JIT maker" },
    { id: "more", label: "Size left, and more levels?", col: 0, row: 4, kind: "decision" },
    { id: "residual", label: "Residual AMM fill", col: 0, row: 5, note: "if size still crosses" },
    { id: "done", label: "Fill complete", col: 0, row: 6, kind: "terminal" },
  ],
  edges: [
    { from: "order", to: "level" },
    { from: "level", to: "compare" },
    { from: "compare", to: "ammFirst", label: "yes", tone: "signal" },
    { from: "compare", to: "maker", label: "no" },
    { from: "ammFirst", to: "maker", label: "then", tone: "signal" },
    { from: "maker", to: "more" },
    { from: "more", to: "level", label: "yes" },
    { from: "more", to: "residual", label: "no" },
    { from: "residual", to: "done" },
  ],
};
