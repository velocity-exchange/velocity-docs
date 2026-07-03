"use client";

import {
  calculateAssetWeight,
  calculateLiabilityWeight,
  decodeName,
  VelocityClientAccountSubscriber,
  SpotMarketAccount,
  StrictOraclePrice,
  ZERO,
} from "@velocity-exchange/sdk";
import { useEffect, useMemo, useRef, useState } from "react";
import { singletonHook } from "react-singleton-hook";
import { getSpotMarketAccountSusbcriber } from "../utils/spot-markets";

// type AssetWeightsData = [
//   string,
//   string,
//   string,
//   string,
//   string,
//   number,
//   number
// ];

type AssetWeightsData = {
  asset: string;
  initialAssetWeight: string;
  maintenanceAssetWeight: string;
  initialLiabilityWeight: string;
  maintenanceLiabilityWeight: string;
  poolId: number;
  imfFactor: number;
};

type AssetWeightTableData = AssetWeightsData & {
  flashUpdate: boolean;
};
type AssetWeightTableDataArray = Array<AssetWeightTableData>;

// type LTVsData = [string, string, string, number];
type LTVsData = {
  asset: string;
  initialLTV: string;
  maxLTV: string;
  poolId: number;
};
type LTVTableData = LTVsData & {
  flashUpdate: boolean;
};
type LTVTableDataArray = Array<LTVTableData>;

type CrossCollateralDepositData = {
  weightData: AssetWeightTableDataArray;
  ltvData: LTVTableDataArray;
};

export const useSubscribedCrossCollateralDepositsData =
  (): CrossCollateralDepositData => {
    const [weightData, setWeightData] = useState<AssetWeightTableDataArray>([]);
    const [ltvData, setLTVData] = useState<LTVTableDataArray>([]);
    const subscriptionRef = useRef<VelocityClientAccountSubscriber | null>(null);

    // initial fetch
    useEffect(() => {
      (async () => {
        const subscription = await getSpotMarketAccountSusbcriber();
        await subscription.subscribe();
        subscriptionRef.current = subscription;
        const accounts = subscription.getSpotMarketAccountsAndSlots();
        if (!accounts) return;
        const newData = accounts
          .sort((a, b) => a.data.marketIndex - b.data.marketIndex)
          .map((account) =>
            getWeightDataFromAccount(account.data, subscriptionRef.current!)
          );
        setWeightData(newData.map((data) => ({ ...data, flashUpdate: false })));
        setLTVData(
          newData.map((data) => ({
            ...getLTVDataWeightData(data),
            flashUpdate: false,
          }))
        );
      })();
    }, []);

    useEffect(() => {
      (async () => {
        if (!subscriptionRef.current) return;
        subscriptionRef.current.eventEmitter.on(
          "spotMarketAccountUpdate",
          (account: SpotMarketAccount) => {
            if (!weightData || !ltvData) return;
            const marketName = decodeName(account.name);
            const assetIndex = weightData.findIndex(
              (weight) => weight.asset === marketName
            );
            if (assetIndex !== -1) {
              const newValues = getWeightDataFromAccount(
                account,
                subscriptionRef.current
              );
              const valuesChanged =
                JSON.stringify(weightData[assetIndex]) !==
                JSON.stringify({ ...newValues, flashUpdate: false });
              if (valuesChanged) {
                weightData[assetIndex] = {
                  ...newValues,
                  flashUpdate: true,
                };
                setWeightData([...weightData]);
                setTimeout(() => {
                  weightData[assetIndex].flashUpdate = false;
                  setWeightData([...weightData]);
                }, 1000);
                const newltvValue = getLTVDataWeightData(newValues);
                if (ltvData[assetIndex]) {
                  ltvData[assetIndex] = {
                    ...newltvValue,
                    flashUpdate: true,
                  };
                  setLTVData([...ltvData]);
                  setTimeout(() => {
                    ltvData[assetIndex].flashUpdate = false;
                    setLTVData([...ltvData]);
                  }, 1000);
                }
              }
            }
          }
        );
      })();
    }, [!!subscriptionRef.current]);
    return useMemo(() => ({ weightData, ltvData }), [weightData, ltvData]);
  };

const getWeightDataFromAccount = (
  account: SpotMarketAccount,
  subscription: VelocityClientAccountSubscriber
): AssetWeightsData => {
  const marketName = decodeName(account.name);
  
  const oraclePriceData = subscription.getOraclePriceDataAndSlotForSpotMarket(
    account.marketIndex
  )?.data;

  const strictOraclePrice = new StrictOraclePrice(
    oraclePriceData?.price ?? ZERO
  );

  const scaledInitialAssetWeight = calculateAssetWeight(
    ZERO,
    strictOraclePrice.current,
    account,
    "Initial"
  );

  const scaledMaintenanceAssetWeight = calculateAssetWeight(
    ZERO,
    strictOraclePrice.current,
    account,
    "Maintenance"
  );

  const scaledInitialLiabilityWeight = calculateLiabilityWeight(
    ZERO,
    account,
    "Initial"
  );

  const scaledMaintenanceLiabilityWeight = calculateLiabilityWeight(
    ZERO,
    account,
    "Maintenance"
  );

  return {
    asset: stripPoolId(marketName),
    initialAssetWeight: scaledInitialAssetWeight
      ? Math.floor(scaledInitialAssetWeight / 100) + "%"
      : (account.initialAssetWeight / 100).toFixed(0) + "%",
    maintenanceAssetWeight: scaledMaintenanceAssetWeight
      ? Math.floor(scaledMaintenanceAssetWeight / 100) + "%"
      : (account.maintenanceAssetWeight / 100).toFixed(0) + "%",
    initialLiabilityWeight: scaledInitialLiabilityWeight
      ? Math.floor(scaledInitialLiabilityWeight / 100) + "%"
      : (account.initialLiabilityWeight / 100).toFixed(0) + "%",
    maintenanceLiabilityWeight: scaledMaintenanceLiabilityWeight
      ? Math.floor(scaledMaintenanceLiabilityWeight / 100) + "%"
      : (account.maintenanceLiabilityWeight / 100).toFixed(0) + "%",
    poolId: account.poolId,
    imfFactor: account.imfFactor / 1e6,
  };
};

const getLTVDataWeightData = (weightData: AssetWeightsData): LTVsData => {
  return {
    asset: stripPoolId(weightData.asset),
    initialLTV:
      (
        (1 / Number(weightData.initialLiabilityWeight.replace("%", ""))) *
        10000
      ).toFixed(2) + "%",
    maxLTV:
      (
        (1 / Number(weightData.maintenanceLiabilityWeight.replace("%", ""))) *
        10000
      ).toFixed(2) + "%",
    poolId: weightData.poolId,
  };
};

export default singletonHook(
  {
    weightData: [],
    ltvData: [],
  },
  useSubscribedCrossCollateralDepositsData
);

function stripPoolId(symbol: string): string {
  return symbol.includes("-")
    ? symbol.split("-").slice(0, -1).join("-")
    : symbol;
}
