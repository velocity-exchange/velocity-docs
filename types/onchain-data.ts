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

export type OnChainData = {
  assetWeights: AssetWeightRow[];
  ltv: LTVRow[];
  perpMargin: PerpMarginRow[];
};
