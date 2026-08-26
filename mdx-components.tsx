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
  RoutingLanesFlow,
  SigningFlow,
  SplitSankey,
} from "./components/diagrams/figures/RouterFigures";

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
    ...components,
  });
}
