import type { FlowchartSpec } from "../layout/flowchart";

// Source: content/protocol/trading/auction-parameters.mdx, "How the program sanitizes
// your auction", plus the tier step counts in
// content/protocol/risk-and-safety/contract-tiers.mdx. The steps follow the order that
// section lists them in; nothing here is inferred beyond that.
export const auctionSanitizationSpec: FlowchartSpec = {
  nodes: [
    { id: "submitted", label: "Submitted params", col: 0, row: 0, kind: "terminal" },
    { id: "fill", label: "Fill in missing prices", col: 0, row: 1, note: "oracle, or your limit price" },
    { id: "clamp", label: "Clamp to your limit", col: 0, row: 2, note: "never worse than it" },
    {
      id: "better",
      label: "Is the market start price better?",
      col: 0,
      row: 3,
      kind: "decision",
      note: "signed order: 0.1% deadband",
    },
    { id: "keepStart", label: "Keep your start price", col: 1, row: 4 },
    { id: "useMarket", label: "Use the market start", col: 0, row: 4 },
    { id: "floor", label: "Duration floor from spread and tier", col: 0, row: 5 },
    { id: "swift", label: "Signed message within 4s of the floor?", col: 0, row: 6, kind: "decision" },
    { id: "keepDur", label: "Keep your duration", col: 1, row: 7 },
    { id: "store", label: "Store the longer one", col: 0, row: 7, note: "yours or the floor", tone: "signal" },
    { id: "stored", label: "Auction runs", col: 0, row: 8, kind: "terminal" },
  ],
  edges: [
    { from: "submitted", to: "fill" },
    { from: "fill", to: "clamp" },
    { from: "clamp", to: "better" },
    { from: "better", to: "keepStart", label: "no" },
    { from: "better", to: "useMarket", label: "yes" },
    { from: "keepStart", to: "floor" },
    { from: "useMarket", to: "floor" },
    { from: "floor", to: "swift" },
    { from: "swift", to: "keepDur", label: "yes" },
    { from: "swift", to: "store", label: "no", tone: "signal" },
    { from: "keepDur", to: "stored" },
    { from: "store", to: "stored", tone: "signal" },
  ],
};
