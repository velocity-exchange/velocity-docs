"use client";

import { Diagram } from "../Diagram";
import { Flowchart } from "../Flowchart";
import { liquidityRoutingSpec } from "./liquidity-routing.data";

export function LiquidityRoutingFlow() {
  return (
    <Diagram
      title="How one taker order fills"
      caption="Shows how a single taker order fills across price levels. Source: Matching Engine and Orderbook and Matching in these docs. There is no fixed JIT, then orderbook, then AMM order: at each level the AMM quote and the best maker quote (resting or just in time) compete on price, and the AMM comes last only for the residual fill. The docs do not say which side wins when two quotes tie on price, only that a priority flag decides. The walk is per fill transaction and best effort: a filler can only match the maker orders it includes, so a better resting order can be skipped. Among tied resting orders, the earlier one fills first."
    >
      {({ captionId }) => (
        <Flowchart
          spec={liquidityRoutingSpec}
          ariaLabel="Flowchart of one taker order filling level by level against the AMM, resting orders, and just-in-time makers"
          describedBy={captionId}
          width={440}
        />
      )}
    </Diagram>
  );
}
