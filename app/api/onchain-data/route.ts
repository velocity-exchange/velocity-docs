import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import type { AccountInfo, Connection, PublicKey } from "@solana/web3.js";
import type { BN } from "@coral-xyz/anchor";
import {
  calculateAssetWeight,
  calculateLiabilityWeight,
  decodeName,
  getOracleClient,
  getPerpMarketPublicKeySync,
  getSpotMarketPublicKeySync,
  getVelocityStateAccountPublicKey,
  isVariant,
  PerpMarketAccount,
  SpotMarketAccount,
  StateAccount,
  StrictOraclePrice,
  FeeStructure,
  FeeTier,
  ZERO,
} from "@velocity-exchange/sdk";
import { getVelocityProgram } from "../../../utils/spot-markets";
import type {
  AssetWeightRow,
  LTVRow,
  OnChainData,
  PerpFeeRow,
  PerpFeeSplit,
  PerpMarginRow,
} from "../../../types/onchain-data";

// The handler itself runs per request (so an error response is never baked
// into the route cache); the expensive on-chain read below is what's cached,
// via unstable_cache, and only successful snapshots are stored.
export const dynamic = "force-dynamic";

// Cross-collateral and margin tables only change when governance updates
// protocol params, so a same-hour-old snapshot is fine to serve from cache.
const REVALIDATE_SECONDS = 3600;

// solana-web3.js's getMultipleAccountsInfo caps out at 100 pubkeys per call.
const MAX_ACCOUNTS_PER_CALL = 100;

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function getMultipleAccountBuffersChunked(
  connection: Connection,
  pubkeys: PublicKey[]
): Promise<(Buffer | null)[]> {
  const buffers: (Buffer | null)[] = [];
  for (const group of chunk(pubkeys, MAX_ACCOUNTS_PER_CALL)) {
    const infos: (AccountInfo<Buffer> | null)[] =
      await connection.getMultipleAccountsInfo(group);
    for (const info of infos) {
      buffers.push(info ? info.data : null);
    }
  }
  return buffers;
}

function stripPoolId(symbol: string): string {
  return symbol.includes("-")
    ? symbol.split("-").slice(0, -1).join("-")
    : symbol;
}

// Liability weights use SPOT_MARKET_WEIGHT_PRECISION (1e4), so a raw weight of
// 10250 means a ratio of 1.025. LTV is 1/ratio, i.e. 1e4/weight as a fraction
// or 1e6/weight as a percent. Computing from the raw BN keeps full precision:
// deriving it from the floor()'d display string (e.g. 1.025 shown as "102%")
// would silently produce a wrong figure for any non-whole-percent weight.
function ltvPercentFromWeight(liabilityWeight: BN): string {
  const weight = liabilityWeight.toNumber();
  if (weight <= 0) return "N/A";
  return ((1e6 / weight).toFixed(2)) + "%";
}

function getWeightAndLTVRows(
  account: SpotMarketAccount,
  oraclePrice: BN
): { weightRow: AssetWeightRow; ltvRow: LTVRow } {
  const marketName = decodeName(account.name);
  const strictOraclePrice = new StrictOraclePrice(oraclePrice);

  const initialAssetWeight = calculateAssetWeight(
    ZERO,
    strictOraclePrice.current,
    account,
    "Initial"
  );
  const maintenanceAssetWeight = calculateAssetWeight(
    ZERO,
    strictOraclePrice.current,
    account,
    "Maintenance"
  );
  const initialLiabilityWeight = calculateLiabilityWeight(
    ZERO,
    account,
    "Initial"
  );
  const maintenanceLiabilityWeight = calculateLiabilityWeight(
    ZERO,
    account,
    "Maintenance"
  );

  const asset = stripPoolId(marketName);
  const poolId = account.poolId;

  return {
    weightRow: {
      asset,
      initialAssetWeight: Math.floor(initialAssetWeight.toNumber() / 100) + "%",
      maintenanceAssetWeight:
        Math.floor(maintenanceAssetWeight.toNumber() / 100) + "%",
      initialLiabilityWeight:
        Math.floor(initialLiabilityWeight.toNumber() / 100) + "%",
      maintenanceLiabilityWeight:
        Math.floor(maintenanceLiabilityWeight.toNumber() / 100) + "%",
      poolId,
      imfFactor: +(account.imfFactor / 1e6).toFixed(6),
    },
    // LTV derived from the raw liability weights, not the display strings.
    ltvRow: {
      asset,
      initialLTV: ltvPercentFromWeight(initialLiabilityWeight),
      maxLTV: ltvPercentFromWeight(maintenanceLiabilityWeight),
      poolId,
    },
  };
}

// Renders a margin ratio as "<pct>% / <leverage>x". A zero ratio would make
// 1/ratio non-finite, so leverage falls back to "N/A" for that (unexpected) case.
function marginCell(ratio: number): string {
  const pct = `${(ratio * 100).toFixed(2)}%`;
  const leverage = ratio > 0 ? `${(1 / ratio).toFixed(0)}x` : "N/A";
  return `${pct} / ${leverage}`;
}

// FEE_PERCENTAGE_DENOMINATOR. ammFeeNumerator and ifFeeNumerator are shares of
// the taker-fee remainder over this, and the program requires their sum to be
// at most 100, so the protocol's residual can never go negative.
const FEE_PERCENTAGE_DENOMINATOR = 100;

// Tier 0 is the base schedule and tiers above it are the VIP levels. The
// program stores no names for them, so they are labelled here to match the
// published schedule.
function feeTierLabel(index: number): string {
  return index === 0 ? "Regular" : `VIP ${index}`;
}

// A rate held as a numerator/denominator fraction of notional, rendered in bps.
// Two decimals, trailing zeros dropped: the maker rebate is 0.25 bps and the
// per-market add-on is denominated in tenths of a basis point, so rounding any
// harder than this reports rates the protocol does not charge. The unary plus
// is what drops the zeros, so 4 renders "4 bps" rather than "4.00 bps".
function bps(rate: number): string {
  return `${+(rate * 1e4).toFixed(2)} bps`;
}

// feeTiers is a fixed-length array of ten slots and the schedule occupies the
// first few, so a raw read reports ten tiers where mainnet publishes three:
// slots 3 and up all repeat the last real tier's 2 bps taker fee. Trailing
// duplicates are that padding, so trim them, or the fee table renders seven
// identical VIP columns.
//
// Comparison is on the two rates this table actually shows, not the whole
// tier struct. The padding slots are not byte-identical to each other (the
// referral numerators are live in some and zeroed in others), so a full-struct
// compare stops early and leaves four dead columns behind. Trailing tiers that
// charge the same taker fee and pay the same maker rebate are one column as
// far as a fee table is concerned, whatever else differs inside them.
function chargesSameRates(a: FeeTier, b: FeeTier): boolean {
  return (
    a.feeNumerator * b.feeDenominator === b.feeNumerator * a.feeDenominator &&
    a.makerRebateNumerator * b.makerRebateDenominator ===
      b.makerRebateNumerator * a.makerRebateDenominator
  );
}

function configuredFeeTiers(tiers: FeeTier[]): FeeTier[] {
  let end = tiers.length;
  while (end > 1 && chargesSameRates(tiers[end - 1], tiers[end - 2])) end--;
  return tiers.slice(0, end);
}

// Mirrors velocityClient.getFeeStructure / calculate_taker_fee in the program:
// the per-market add-on is added to the tier rate first, and feeAdjustment
// then scales the sum. The maker rebate sees feeAdjustment alone, never the
// add-on, which is taker-only and can never be a discount.
function effectiveTakerFee(tier: FeeTier, market: PerpMarketAccount): number {
  const base =
    tier.feeNumerator / tier.feeDenominator +
    market.takerFeeAddonTenthBps / 100_000;
  return base + (base * market.feeAdjustment) / 100;
}

function effectiveMakerRebate(
  tier: FeeTier,
  market: PerpMarketAccount
): number {
  const base = tier.makerRebateNumerator / tier.makerRebateDenominator;
  return base + (base * market.feeAdjustment) / 100;
}

function getPerpFeeRow(
  market: PerpMarketAccount,
  feeTiers: FeeTier[]
): PerpFeeRow | null {
  if (isVariant(market.contractType, "deprecatedPrediction")) return null;

  return {
    index: market.marketIndex,
    name: decodeName(market.name),
    takerFees: feeTiers.map((tier) => bps(effectiveTakerFee(tier, market))),
    // Flat across tiers in the published schedule, but read from tier 0 rather
    // than assumed: makerRebateNumerator is per-tier onchain and nothing stops
    // an admin from setting the tiers apart.
    makerRebate: bps(effectiveMakerRebate(feeTiers[0], market)),
  };
}

function getPerpFeeSplit(feeStructure: FeeStructure): PerpFeeSplit {
  const amm = feeStructure.ammFeeNumerator;
  const insuranceFund = feeStructure.ifFeeNumerator;
  return {
    amm: `${amm}%`,
    insuranceFund: `${insuranceFund}%`,
    protocol: `${FEE_PERCENTAGE_DENOMINATOR - amm - insuranceFund}%`,
  };
}

function getPerpMarginRow(market: PerpMarketAccount): PerpMarginRow | null {
  // "prediction" markets are the SDK's deprecated/inert contract-type stub,
  // never assigned to a live market, but skipped for parity with the previous
  // drift.trade-backed implementation, which excluded them by the same name.
  if (isVariant(market.contractType, "deprecatedPrediction")) return null;

  const initRatio = market.marginRatioInitial / 1e4;
  const maintRatio = market.marginRatioMaintenance / 1e4;
  const imfFactor = +(market.imfFactor / 1e6).toFixed(6);

  return {
    index: market.marketIndex,
    name: decodeName(market.name),
    initial: marginCell(initRatio),
    maintenance: marginCell(maintRatio),
    imfFactor,
  };
}

async function loadOnChainData(rpcUrl: string): Promise<OnChainData> {
  const program = getVelocityProgram(rpcUrl);
  const connection = program.provider.connection;
  const programId = program.programId;

  // Fetch the tiny State account alone first, so we know how many
  // spot/perp markets exist before deriving their PDAs.
  const statePublicKey = await getVelocityStateAccountPublicKey(programId);
  const stateAccountInfo = await connection.getAccountInfo(statePublicKey);
  if (!stateAccountInfo) {
    throw new Error("Velocity State account not found");
  }
  // Note: Program's constructor camelCases IDL account names (the raw IDL
  // has "State"/"SpotMarket"/"PerpMarket"), so program.coder.accounts keys
  // off "state"/"spotMarket"/"perpMarket" rather than the PascalCase names.
  const state = program.coder.accounts.decode<StateAccount>(
    "state",
    stateAccountInfo.data
  );

  const spotMarketPubkeys = Array.from(
    { length: state.numberOfSpotMarkets },
    (_, marketIndex) => getSpotMarketPublicKeySync(programId, marketIndex)
  );
  const perpMarketPubkeys = Array.from(
    { length: state.numberOfMarkets },
    (_, marketIndex) => getPerpMarketPublicKeySync(programId, marketIndex)
  );

  // Round trip (a): all spot markets + all perp markets in one batch
  // (chunked internally to respect the 100-pubkey cap). State was already
  // fetched above to learn the counts, so it isn't re-requested here.
  const marketBuffers = await getMultipleAccountBuffersChunked(connection, [
    ...spotMarketPubkeys,
    ...perpMarketPubkeys,
  ]);
  const spotMarketBuffers = marketBuffers.slice(0, spotMarketPubkeys.length);
  const perpMarketBuffers = marketBuffers.slice(spotMarketPubkeys.length);

  const spotMarkets = spotMarketBuffers
      .map((buffer) =>
        buffer
          ? program.coder.accounts.decode<SpotMarketAccount>(
              "spotMarket",
              buffer
            )
          : null
      )
      .filter((market): market is SpotMarketAccount => market !== null);

    const perpMarkets = perpMarketBuffers
      .map((buffer) =>
        buffer
          ? program.coder.accounts.decode<PerpMarketAccount>(
              "perpMarket",
              buffer
            )
          : null
      )
      .filter((market): market is PerpMarketAccount => market !== null);

    // Round trip (b): oracle accounts referenced by the decoded spot
    // markets, needed to scale initial asset weight by deposit value.
    const oracleBuffers = await getMultipleAccountBuffersChunked(
      connection,
      spotMarkets.map((market) => market.oracle)
    );

    const assetWeights: AssetWeightRow[] = [];
    const ltv: LTVRow[] = [];

    spotMarkets.forEach((spotMarket, i) => {
      const oracleBuffer = oracleBuffers[i];
      let oraclePrice: BN = ZERO;
      try {
        // The SDK's own sub-dependencies pin a different @solana/web3.js
        // patch version than the app, so the installed tree keeps a second,
        // structurally incompatible `Connection` class purely at the type level (same
        // reason utils/spot-markets.ts casts through `unknown` for
        // `VelocityProgram`). The runtime objects are interchangeable.
        const oracleClient = getOracleClient(
          spotMarket.oracleSource,
          connection as unknown as Parameters<typeof getOracleClient>[1],
          program
        );
        oraclePrice = oracleClient.getOraclePriceDataFromBuffer(
          oracleBuffer ?? Buffer.alloc(0)
        ).price;
      } catch {
        // Oracle account missing/undecodable: fall back to zero, matching
        // the previous websocket-subscriber implementation's behavior when
        // no oracle price data was yet available.
        oraclePrice = ZERO;
      }

      const { weightRow, ltvRow } = getWeightAndLTVRows(spotMarket, oraclePrice);
      assetWeights.push(weightRow);
      ltv.push(ltvRow);
    });

    const perpMargin = perpMarkets
    .map(getPerpMarginRow)
    .filter((row): row is PerpMarginRow => row !== null);

  // Fee schedule comes off the State account already fetched above, so the
  // fee table and split cost no extra round trip.
  const perpFeeTiers = configuredFeeTiers(state.perpFeeStructure.feeTiers);
  const perpFees = perpMarkets
    .map((market) => getPerpFeeRow(market, perpFeeTiers))
    .filter((row): row is PerpFeeRow => row !== null);

  return {
    assetWeights,
    ltv,
    perpMargin,
    perpFeeTiers: perpFeeTiers.map((_, index) => feeTierLabel(index)),
    perpFees,
    perpFeeSplit: getPerpFeeSplit(state.perpFeeStructure),
  };
}

// Cache only successful snapshots: unstable_cache stores the resolved value
// and does not cache a thrown error, so a transient RPC failure can't poison
// the cache for the whole revalidate window.
const getCachedOnChainData = unstable_cache(loadOnChainData, ["onchain-data"], {
  revalidate: REVALIDATE_SECONDS,
});

export async function GET() {
  // Server-side only, intentionally not NEXT_PUBLIC_ so the RPC endpoint (and
  // any embedded API key) never reaches the client bundle.
  const rpcUrl = process.env.RPC_URL;
  if (!rpcUrl) {
    return NextResponse.json(
      { error: "RPC_URL is not configured" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const body = await getCachedOnChainData(rpcUrl);
    return NextResponse.json(body);
  } catch (error) {
    // Log the full error server-side, but never echo error.message back to
    // the client: RPC endpoints embed the API key in the URL and web3.js
    // errors routinely include that URL, so returning it would leak the
    // credential to any unauthenticated caller on an RPC outage.
    console.error("[api/onchain-data] failed to fetch on-chain data", error);
    return NextResponse.json(
      { error: "Failed to fetch on-chain data" },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
