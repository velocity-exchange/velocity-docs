import { useMDXComponents as useDocsMDXComponents } from "nextra-theme-docs";
import { Callout,Cards, Steps, Tabs } from "nextra/components";

import {
  AdjustedPerpMarketFeesTable,
  AdjustedSpotMarketFeesTable,
  FeeTiersTable,
  PerpFeeStructureTable,
  SpotFeeStructureTable,
} from "./components/data/TradingFeesTables";
import { HighLeverageTable, PerpMarginTable } from "./components/data/MarginTables";
import {
  OtherPerpFeesTable,
  OtherSpotFeesTable,
} from "./components/data/OtherTradingFeesTables";
import {
  AssetWeightsTable,
  LTVTable,
} from "./components/data/CrossCollateralTables";
import { Api, Rust, SDKDoc, TypeScript } from "./components/SDKDoc";

export function useMDXComponents(components?: Record<string, unknown>) {
  return useDocsMDXComponents({
    Callout, Steps, Tabs, Cards,
    AdjustedPerpMarketFeesTable,
    AdjustedSpotMarketFeesTable,
    FeeTiersTable,
    PerpFeeStructureTable,
    SpotFeeStructureTable,
    PerpMarginTable,
    HighLeverageTable,
    OtherPerpFeesTable,
    OtherSpotFeesTable,
    AssetWeightsTable,
    LTVTable,
    SDKDoc,
    TypeScript,
    Rust,
    Api,
    ...components,
  });
}
