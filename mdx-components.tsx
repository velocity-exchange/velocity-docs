import { useMDXComponents as useDocsMDXComponents } from "nextra-theme-docs";
import { Callout,Cards, Steps, Tabs } from "nextra/components";

import { PerpMarginTable } from "./components/data/MarginTables";
import {
  AssetWeightsTable,
  LTVTable,
} from "./components/data/CrossCollateralTables";
import { Api, Rust, SDKDoc, TypeScript } from "./components/SDKDoc";
import { FeeFlowSankey } from "./components/diagrams/figures/FeeFlowSankey";
import {
  FillTopologyFlow,
  OrderLifecycleFlow,
  QuoterCallFlow,
  RouterReachSankey,
  RoutingLanesFlow,
  SigningFlow,
  SplitSankey,
} from "./components/diagrams/figures/RouterFigures";
import { RevenuePoolSankey } from "./components/diagrams/figures/RevenuePoolSankey";
import { BorrowApySankey } from "./components/diagrams/figures/BorrowApySankey";
import { BuilderFeeSankey } from "./components/diagrams/figures/BuilderFeeSankey";
import { AuctionPriceRamp } from "./components/diagrams/figures/AuctionPriceRamp";
import { JitAuctionSequence } from "./components/diagrams/figures/JitAuctionSequence";
import { LiquidityRoutingFlow } from "./components/diagrams/figures/LiquidityRoutingFlow";
import { AuctionSanitizationFlow } from "./components/diagrams/figures/AuctionSanitizationFlow";

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
    FillTopologyFlow,
    SplitSankey,
    SigningFlow,
    OrderLifecycleFlow,
    RoutingLanesFlow,
    QuoterCallFlow,
    RouterReachSankey,
    RevenuePoolSankey,
    BorrowApySankey,
    BuilderFeeSankey,
    AuctionPriceRamp,
    JitAuctionSequence,
    LiquidityRoutingFlow,
    AuctionSanitizationFlow,
    ...components,
  });
}
