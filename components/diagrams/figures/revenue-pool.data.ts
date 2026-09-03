import type { SankeySpec } from "../layout/sankey";

// Source: programs/velocity/src, verified against the program rather than the
// prose. Two corrections against the previous version of this spec, both of
// which the page's own text also carried:
//
//   1. There is no revenue_pool -> perp market AMM route. The draw that tops a
//      perp market up comes from the INSURANCE FUND VAULT, via
//      resolve_perp_pnl_deficit, which takes insurance_vault_amount.
//   2. It does not cover "funding shortfalls". It covers a P&L deficit, and it
//      lands in the market's pnl_pool.
//
// max_revenue_withdraw_per_period rate-limits that insurance draw, not a
// revenue-pool allowance. Splits are drawn equal because the numerators that
// set them are admin-configured and this figure is about the routes, not the
// proportions. They are NOT 0, which an earlier version of this comment
// claimed by reading the program's defaults: mainnet runs an insurance share
// of 15% of the perp fee remainder. The live numbers are on the Trading fees
// page, which reads them from the chain.
export const revenuePoolSpec: SankeySpec = {
  nodes: [
    { id: "fees", label: "Protocol fees", note: "deposit interest, liquidations, trading fees", column: 0 },
    // Note is deliberately short, not "SpotMarket.revenuePool, staging only": this
    // page is protocol tree, no program identifiers, and at 4 columns in 600px a
    // note past ~20 characters runs into whatever sits at the next column's label,
    // which is exactly what the field name did to "Insurance fund vault" one
    // column over.
    { id: "revenue_pool", label: "Revenue pool", note: "staging only", column: 1 },
    { id: "protocol_pool", label: "Protocol fee pool", note: "direct, withdrawable", column: 1, tone: "signal" },
    { id: "if_vault", label: "Insurance fund vault", note: "100% staker-owned", column: 2 },
    { id: "pnl_pool", label: "Perp market P&L pool", note: "only on a P&L deficit", column: 3, tone: "out" },
  ],
  links: [
    {
      from: "fees",
      to: "revenue_pool",
      value: 50,
      label: "The insurance fund's cut of deposit interest, liquidation fees, and trading fees stages here before settling",
    },
    {
      from: "fees",
      to: "protocol_pool",
      value: 50,
      tone: "signal",
      label: "The protocol's own cut of the same fees goes straight to the protocol fee pool, bypassing the revenue pool entirely",
    },
    {
      from: "revenue_pool",
      to: "if_vault",
      value: 50,
      label: "Settles to the insurance fund vault through the permissionless settle_revenue_to_insurance_fund instruction, capped per settlement",
    },
    {
      from: "if_vault",
      to: "pnl_pool",
      value: 25,
      tone: "out",
      label: "resolve_perp_pnl_deficit draws from the insurance fund vault into a perp market's P&L pool to cover a deficit, rate-limited by max_revenue_withdraw_per_period",
    },
  ],
};
