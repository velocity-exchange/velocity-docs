import { useMDXComponents as useDocsMDXComponents } from "nextra-theme-docs";
import { Callout,Cards, Steps, Tabs } from "nextra/components";

import { PerpMarginTable } from "./components/data/MarginTables";
import {
  AssetWeightsTable,
  LTVTable,
} from "./components/data/CrossCollateralTables";
import { Api, Rust, SDKDoc, TypeScript } from "./components/SDKDoc";
import { FeeFlowSankey } from "./components/diagrams/figures/FeeFlowSankey";
import { RevenuePoolSankey } from "./components/diagrams/figures/RevenuePoolSankey";
import { BorrowApySankey } from "./components/diagrams/figures/BorrowApySankey";
import { BuilderFeeSankey } from "./components/diagrams/figures/BuilderFeeSankey";
import { TrustedVaultSankey } from "./components/diagrams/figures/TrustedVaultSankey";

export function useMDXComponents(components?: Record<string, unknown>) {
  return useDocsMDXComponents({
    Callout, Steps, Tabs, Cards,
    PerpMarginTable,
    AssetWeightsTable,
    LTVTable,
    SDKDoc,
    TypeScript,
    Rust,
    Api,
    FeeFlowSankey,
    RevenuePoolSankey,
    BorrowApySankey,
    BuilderFeeSankey,
    TrustedVaultSankey,
    ...components,
  });
}
