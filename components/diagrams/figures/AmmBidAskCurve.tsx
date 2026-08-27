"use client";

import { Diagram } from "../Diagram";
import { PriceRamp } from "../PriceRamp";
import { ammBidAskCurveSpec } from "./amm-bid-ask-curve.data";

const CAPTION =
  "The AMM keeps its reserves on one constant product curve, where base reserve times quote reserve always equals k. " +
  "Instead of quoting a single price from that curve, it tracks three points on it. " +
  "The reservation price is its own mid, and it follows the oracle. " +
  "The ask sits further up the curve, where the quote reserve is higher, so buyers pay a little more than mid. " +
  "The bid sits further down, where the quote reserve is lower, so sellers receive a little less. " +
  "Each side is shifted by half of its spread from the reservation quote reserve, and the two spreads move independently with the AMM's inventory, which is why the ask here sits further from mid than the bid does. " +
  "The reserves are normalised so the reservation point lands at 1, 1, and the spreads are exaggerated so the gaps are visible. These are not live market values.";

export function AmmBidAskCurve() {
  return (
    <Diagram title="Bid, reservation, and ask on the AMM curve" caption={CAPTION}>
      {({ captionId }) => (
        <PriceRamp
          spec={ammBidAskCurveSpec}
          margin={{ left: 128, right: 40 }}
          ariaLabel="Chart of a constant product curve with three marked points: the ask price at a higher quote reserve and lower base reserve, the reservation price in the middle, and the bid price at a lower quote reserve and higher base reserve"
          describedBy={captionId}
        />
      )}
    </Diagram>
  );
}
