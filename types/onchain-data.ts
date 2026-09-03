// Shared response shape for GET /api/onchain-data. Kept in a neutral module
// (no "use client"/server-only markers) so both the route handler and the
// client hook can import it without pulling either side's runtime into the
// other's bundle.

export type AssetWeightRow = {
  asset: string;
  initialAssetWeight: string;
  maintenanceAssetWeight: string;
  initialLiabilityWeight: string;
  maintenanceLiabilityWeight: string;
  poolId: number;
  imfFactor: number;
};

export type LTVRow = {
  asset: string;
  initialLTV: string;
  maxLTV: string;
  poolId: number;
};

export type PerpMarginRow = {
  index: number;
  name: string;
  initial: string;
  maintenance: string;
  imfFactor: number;
};

// One perp market's effective fee schedule, already resolved to what the
// market actually charges: the per-market taker add-on and fee adjustment are
// folded into each tier's rate, so a reader never has to combine knobs by hand.
// Strings, because the route does the rounding and the table only prints.
export type PerpFeeRow = {
  index: number;
  name: string;
  // One entry per volume tier, in schedule order (Regular, VIP 1, VIP 2, ...).
  takerFees: string[];
  makerRebate: string;
};

// State.perpFeeStructure's split of the taker-fee remainder. The AMM and
// insurance shares are admin-set numerators over a denominator of 100; the
// protocol keeps whatever they leave, so it is derived rather than stored.
export type PerpFeeSplit = {
  amm: string;
  insuranceFund: string;
  protocol: string;
};

export type OnChainData = {
  assetWeights: AssetWeightRow[];
  ltv: LTVRow[];
  perpMargin: PerpMarginRow[];
  // Tier labels for PerpFeeRow.takerFees, so the table's column headings come
  // from the same read as its cells and can't drift out of step with them.
  perpFeeTiers: string[];
  perpFees: PerpFeeRow[];
  perpFeeSplit: PerpFeeSplit;
};
