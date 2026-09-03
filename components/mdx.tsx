import defaultComponents from "fumadocs-ui/mdx";
import { Callout } from "fumadocs-ui/components/callout";
import { Cards, Card } from "fumadocs-ui/components/card";
import { Steps, Step } from "fumadocs-ui/components/steps";
import { Tabs, Tab } from "fumadocs-ui/components/tabs";
import type { MDXComponents } from "mdx/types";

import { PerpMarginTable } from "./data/MarginTables";
import { PerpFeeSplitTable, PerpFeeTable } from "./data/FeeTables";
import { AssetWeightsTable, LTVTable } from "./data/CrossCollateralTables";
import { Api, Rust, SDKDoc, TypeScript } from "./SDKDoc";
import CanvasText from "./CanvasText";
import { FeeFlowSankey } from "./diagrams/figures/FeeFlowSankey";
import {
  FillTopologyFlow,
  OrderLifecycleFlow,
  QuoterCallFlow,
  RouterReachSankey,
  RoutingLanesFlow,
  SigningFlow,
  SplitSankey,
} from "./diagrams/figures/RouterFigures";
import { RevenuePoolSankey } from "./diagrams/figures/RevenuePoolSankey";
import { BorrowApySankey } from "./diagrams/figures/BorrowApySankey";
import { BuilderFeeSankey } from "./diagrams/figures/BuilderFeeSankey";
import { AuctionPriceRamp } from "./diagrams/figures/AuctionPriceRamp";
import { JitAuctionSequence } from "./diagrams/figures/JitAuctionSequence";
import { LiquidityRoutingFlow } from "./diagrams/figures/LiquidityRoutingFlow";
import { AuctionSanitizationFlow } from "./diagrams/figures/AuctionSanitizationFlow";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultComponents,
    Callout,
    Cards,
    Card,
    Steps,
    Step,
    Tabs,
    Tab,
    table: Table,
    thead: TableHeader,
    tbody: TableBody,
    tfoot: TableFooter,
    tr: TableRow,
    th: TableHead,
    td: TableCell,
    caption: TableCaption,
    CanvasText,
    PerpMarginTable,
    PerpFeeTable,
    PerpFeeSplitTable,
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
  };
}
