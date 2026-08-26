import type { SankeySpec } from "../layout/sankey";

// Source: content/developers/builder-codes.mdx ("How the builder fee is calculated",
// "Fee Accrual (Per Order)", "Settlement"). The taker fee and builder fee are two
// separate charges added together, not two parts split off one pool; they are drawn
// as a single source here only to show them on one figure. fee_tenth_bps and the
// taker's fee tier both vary per order, so the split shown is illustrative, not to scale.
export const builderFeeSpec: SankeySpec = {
  nodes: [
    { id: "payment", label: "What the taker pays", note: "taker fee + builder fee, added together", column: 0 },
    { id: "taker_fee", label: "Taker fee", note: "see Fee Mechanics for its split", column: 1 },
    { id: "builder_fee", label: "Builder fee", note: "on top, does not reduce the taker fee", column: 1, tone: "signal" },
    { id: "settled", label: "Paid to builder", note: "via settlePnl or settleRevenueShare", column: 2 },
    { id: "waived", label: "Waived this fill", note: "taker below initial margin, or invalid oracle", column: 2, tone: "out" },
  ],
  links: [
    {
      from: "payment",
      to: "taker_fee",
      value: 70,
      label: "The normal tiered taker fee, unaffected by the builder fee",
    },
    {
      from: "payment",
      to: "builder_fee",
      value: 30,
      tone: "signal",
      label: "builder_fee = notional x fee_tenth_bps / 100,000, capped at 1% of notional",
    },
    {
      from: "builder_fee",
      to: "settled",
      value: 24,
      label: "Accrues to the taker's RevenueShareEscrow, then swept to the builder's RevenueShare account",
    },
    {
      from: "builder_fee",
      to: "waived",
      value: 6,
      tone: "out",
      label: "Waived when the taker does not clear initial margin at fill time, or a required oracle is invalid; the fill still happens",
    },
  ],
};
