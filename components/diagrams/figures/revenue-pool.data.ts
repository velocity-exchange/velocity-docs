import type { SankeySpec } from "../layout/sankey";

// Source: content/protocol/how-it-works/revenue-pool.mdx. The page names the three
// fee sources and the two destinations but gives no split percentages between the
// Insurance Fund's cut and the protocol's cut, or between vault settlement and AMM
// draws, so link widths here are illustrative only (not to scale).
export const revenuePoolSpec: SankeySpec = {
  nodes: [
    { id: "fees", label: "Protocol fees", note: "borrow interest, liquidations, trading fees", column: 0 },
    { id: "revenue_pool", label: "Revenue pool", note: "SpotMarket.revenuePool, staging only", column: 1 },
    { id: "protocol_pool", label: "Protocol fee pool", note: "direct, withdrawable", column: 1, tone: "signal" },
    { id: "if_vault", label: "Insurance Fund vault", note: "100% staker-owned", column: 2 },
    { id: "amm_topups", label: "Perp market AMMs", note: "conditional revenue withdraws", column: 2, tone: "out" },
  ],
  links: [
    {
      from: "fees",
      to: "revenue_pool",
      value: 60,
      label: "Insurance Fund's cut of borrow interest, liquidation fees, and trading fees stages here before settling",
    },
    {
      from: "fees",
      to: "protocol_pool",
      value: 40,
      tone: "signal",
      label: "Protocol's own cut of the same fees goes straight to the protocol fee pool, bypassing the revenue pool entirely",
    },
    {
      from: "revenue_pool",
      to: "if_vault",
      value: 45,
      label: "Settles to the Insurance Fund vault via the permissionless settle_revenue_to_insurance_fund instruction, capped per settlement",
    },
    {
      from: "revenue_pool",
      to: "amm_topups",
      value: 15,
      tone: "out",
      label: "A perp market can draw up to max_revenue_withdraw_per_period from the revenue pool to cover funding shortfalls or PnL settlement",
    },
  ],
};
