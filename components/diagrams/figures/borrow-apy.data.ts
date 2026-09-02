import type { SankeySpec } from "../layout/sankey";

// Source: content/protocol/borrow-lend/borrow-lend-apy.mdx ("Borrow APY" section) and
// content/protocol/how-it-works/borrow-interest-rate.mdx. Both pages describe the
// ifFeeFactor / protocolFeeFactor cuts by name but publish no factor values (they are
// on-chain, per-market parameters), so link widths here are illustrative only.
export const borrowApySpec: SankeySpec = {
  nodes: [
    { id: "interest", label: "Borrow interest paid", column: 0 },
    { id: "if_cut", label: "Insurance Fund", note: "market-set share", column: 1 },
    { id: "protocol_cut", label: "Protocol fee pool", note: "market-set share", column: 1 },
    { id: "lenders", label: "Lenders", note: "via Supply APY", column: 1, tone: "signal" },
  ],
  links: [
    {
      from: "interest",
      to: "if_cut",
      value: 10,
      label: "The insurance fund's carveout, admin-set per market, goes to that market's Insurance Fund",
    },
    {
      from: "interest",
      to: "protocol_cut",
      value: 10,
      label: "The protocol's carveout, admin-set per market, goes to a protocol-owned withdrawable fee pool",
    },
    {
      from: "interest",
      to: "lenders",
      value: 80,
      tone: "signal",
      label: "Remainder distributed to lenders as Supply APY",
    },
  ],
};
