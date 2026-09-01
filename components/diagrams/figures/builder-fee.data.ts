import type { SankeySpec } from "../layout/sankey";

// Source: content/developers/builder-codes.mdx ("How the builder fee is calculated").
// The taker fee and builder fee are two separate charges added together, drawn from
// one source only so both sit on one figure. fee_tenth_bps and the taker's tier vary
// per order, so the two legs are drawn equal: the figure shows the two charges, not their sizes.
export const builderFeeSpec: SankeySpec = {
  nodes: [
    { id: "payment", label: "What the taker pays", note: "taker fee + builder fee", column: 0 },
    { id: "taker_fee", label: "Taker fee", note: "split per Fee Mechanics", column: 1 },
    { id: "builder_fee", label: "Builder fee", note: "to the builder's escrow", column: 1, tone: "signal" },
  ],
  links: [
    { from: "payment", to: "taker_fee", value: 50, label: "The normal tiered taker fee, unaffected by the builder fee" },
    {
      from: "payment",
      to: "builder_fee",
      value: 50,
      tone: "signal",
      label: "Builder fee: notional x fee_tenth_bps / 100,000, capped at 1% of notional, accrues to the taker's RevenueShareEscrow and is swept to the builder",
    },
  ],
};
