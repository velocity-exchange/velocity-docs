"use client";

import { Diagram } from "../Diagram";
import { PriceRamp } from "../PriceRamp";
import { auctionPriceRampSpec } from "./auction-price-ramp.data";

const CAPTION =
  "A long market order with the oracle at $100.00, an auction start price of $100.00, an end price of $100.10 (the taker's limit), and an auctionDuration of 10 (10 x 400ms = 4 seconds). " +
  "The auction price moves in a straight line from start to end, so a maker quoting $100.05 can fill from 2 seconds in onward. " +
  "After 4 seconds the auction is over and any size still unfilled can fill at the limit price until the order expires, drawn as the dashed line. " +
  "The numbers are the worked example on this site, not live market data. " +
  "The unit is wall clock, not a live slot, and the program can raise a requested duration, so a real auction may run longer than 4 seconds.";

export function AuctionPriceRamp() {
  return (
    <Diagram title="How the auction price moves" caption={CAPTION}>
      {({ captionId }) => (
        <PriceRamp
          spec={auctionPriceRampSpec}
          ariaLabel="Chart of a JIT auction price rising in a straight line from the oracle price to the taker's limit price over 4 seconds, then holding flat at the limit"
          describedBy={captionId}
          width={600}
        />
      )}
    </Diagram>
  );
}
