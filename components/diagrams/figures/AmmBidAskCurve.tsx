"use client";

import { Diagram } from "../Diagram";
import { PriceRamp } from "../PriceRamp";
import { ammBidAskCurveSpec } from "./amm-bid-ask-curve.data";

const CAPTION =
  "Three points on one constant product curve (base reserve times quote reserve is a fixed k). " +
  "The reservation price is the AMM's own mid, which tracks the oracle. " +
  "The ask sits up the curve where the quote reserve is higher, and the bid sits down it where the quote reserve is lower. " +
  "Each side moves by half of its spread from the reservation quote reserve, and the two spreads can differ: here the ask side is drawn wider than the bid side. " +
  "The reserves are normalised so the reservation point is at 1, 1 and the spreads are exaggerated to be visible, not live market values.";

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
