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
  ZERO,
} from "@velocity-exchange/sdk";
import { getVelocityProgram } from "../../../utils/spot-markets";
import type {
  AssetWeightRow,
  LTVRow,
  OnChainData,
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

function getWeightRowFromSpotMarket(
  account: SpotMarketAccount,
  oraclePrice: BN
): AssetWeightRow {
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

  return {
    asset: stripPoolId(marketName),
    initialAssetWeight: Math.floor(initialAssetWeight.toNumber() / 100) + "%",
    maintenanceAssetWeight:
      Math.floor(maintenanceAssetWeight.toNumber() / 100) + "%",
    initialLiabilityWeight:
      Math.floor(initialLiabilityWeight.toNumber() / 100) + "%",
    maintenanceLiabilityWeight:
      Math.floor(maintenanceLiabilityWeight.toNumber() / 100) + "%",
    poolId: account.poolId,
    imfFactor: account.imfFactor / 1e6,
  };
}

function getLTVRowFromWeightRow(weightRow: AssetWeightRow): LTVRow {
  return {
    asset: weightRow.asset,
    initialLTV:
      (
        (1 / Number(weightRow.initialLiabilityWeight.replace("%", ""))) *
        10000
      ).toFixed(2) + "%",
    maxLTV:
      (
        (1 / Number(weightRow.maintenanceLiabilityWeight.replace("%", ""))) *
        10000
      ).toFixed(2) + "%",
    poolId: weightRow.poolId,
  };
}

function getPerpMarginRow(market: PerpMarketAccount): PerpMarginRow | null {
  // "prediction" markets are the SDK's deprecated/inert contract-type stub —
  // never assigned to a live market, but skipped for parity with the previous
  // drift.trade-backed implementation, which excluded them by the same name.
  if (isVariant(market.contractType, "deprecatedPrediction")) return null;

  const initRatio = market.marginRatioInitial / 1e4;
  const maintRatio = market.marginRatioMaintenance / 1e4;
  const imfFactor = +(market.imfFactor / 1e6).toFixed(6);

  return {
    index: market.marketIndex,
    name: decodeName(market.name),
    initial: `${(initRatio * 100).toFixed(2)}% / ${(1 / initRatio).toFixed(
      0
    )}x`,
    maintenance: `${(maintRatio * 100).toFixed(2)}% / ${(
      1 / maintRatio
    ).toFixed(0)}x`,
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
    // markets — needed to scale initial asset weight by deposit value.
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
        // patch version than the app, so pnpm keeps a second, structurally
        // incompatible `Connection` class purely at the type level (same
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
        // Oracle account missing/undecodable — fall back to zero, matching
        // the previous websocket-subscriber implementation's behavior when
        // no oracle price data was yet available.
        oraclePrice = ZERO;
      }

      const weightRow = getWeightRowFromSpotMarket(spotMarket, oraclePrice);
      assetWeights.push(weightRow);
      ltv.push(getLTVRowFromWeightRow(weightRow));
    });

    const perpMargin = perpMarkets
    .map(getPerpMarginRow)
    .filter((row): row is PerpMarginRow => row !== null);

  return { assetWeights, ltv, perpMargin };
}

// Cache only successful snapshots: unstable_cache stores the resolved value
// and does not cache a thrown error, so a transient RPC failure can't poison
// the cache for the whole revalidate window.
const getCachedOnChainData = unstable_cache(loadOnChainData, ["onchain-data"], {
  revalidate: REVALIDATE_SECONDS,
});

export async function GET() {
  const rpcUrl = process.env.RPC_URL ?? process.env.NEXT_PUBLIC_RPC_URL;
  if (!rpcUrl) {
    return NextResponse.json(
      { error: "RPC_URL (or NEXT_PUBLIC_RPC_URL) is not configured" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const body = await getCachedOnChainData(rpcUrl);
    return NextResponse.json(body);
  } catch (error) {
    console.error("[api/onchain-data] failed to fetch on-chain data", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch on-chain data",
      },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
