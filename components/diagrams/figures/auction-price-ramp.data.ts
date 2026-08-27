import type { PriceRampSpec } from "../layout/price-ramp";

// Source: the worked example in content/developers/market-makers/jit-auctions.mdx
// (Auction pricing formula). A long market order with the oracle at $100.
const ORACLE = 100.0;
const START = 100.0;
const END = 100.1; // the taker's limit, oracle + 0.1%
const DURATION = 10; // slots
const FILL_SLOT = 5;
const FILL_PRICE = START + (END - START) * (FILL_SLOT / DURATION); // 100.05

/** How far past the auction the flat continuation runs. The order stays valid for far
 *  longer than this, so the tail says "and onward", not "and then it stops". */
const TAIL = 3;

export const auctionPriceRampSpec: PriceRampSpec = {
  x: {
    label: "Slots since the auction starts",
    min: 0,
    max: DURATION + TAIL,
    ticks: [0, FILL_SLOT, DURATION],
  },
  y: {
    // Padded either side of the ramp so the oracle line clears the axis rule.
    label: "Auction price, USD",
    min: 99.98,
    max: 100.12,
    ticks: [START, FILL_PRICE, END],
  },
  segments: [
    {
      from: { x: 0, y: START },
      to: { x: DURATION, y: END },
      tone: "signal",
      label: "Auction price, a straight line from $100.00 at slot 0 to $100.10 at slot 10",
    },
    {
      from: { x: DURATION, y: END },
      to: { x: DURATION + TAIL, y: END },
      dashed: true,
      label: "After slot 10 the auction is over and the rest of the order can fill at the $100.10 limit until it expires",
    },
  ],
  references: [
    { y: ORACLE, label: "Oracle, $100.00" },
  ],
  spans: [{ from: 0, to: DURATION, label: "Auction, 10 slots" }],
  markers: [
    {
      x: FILL_SLOT,
      y: FILL_PRICE,
      label: "Maker fills at $100.05",
      place: "below",
    },
  ],
};
