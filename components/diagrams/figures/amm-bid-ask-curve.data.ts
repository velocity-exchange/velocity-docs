import type { PriceRampSpec, RampPoint } from "../layout/price-ramp";

// Source: the Inventory Adjusted Spreads section of
// content/protocol/how-it-works/velocity-amm.mdx. Reserves are normalised so
// the reservation point sits at (1, 1) and k = 1; the spreads are illustrative.
const K = 1;
const LONG_SPREAD = 0.5; // moves the ask, drawn wider than the bid to show asymmetry
const SHORT_SPREAD = 0.4; // moves the bid

// Each side moves by half its spread from the reservation quote reserve.
const ASK_QUOTE = 1 + LONG_SPREAD / 2;
const BID_QUOTE = 1 - SHORT_SPREAD / 2;
const ASK_BASE = K / ASK_QUOTE;
const BID_BASE = K / BID_QUOTE;

const MIN = 0.55;
const MAX = 1.6;
const SAMPLES = 48;

/** The constant product curve base * quote = k, sampled across the authored range. */
function curve(): RampPoint[] {
  const points: RampPoint[] = [];
  // Clip to the authored box: x runs from where the curve enters at the top to where it leaves at the right.
  const lo = Math.max(MIN, K / MAX);
  const hi = Math.min(MAX, K / MIN);
  for (let i = 0; i <= SAMPLES; i++) {
    const x = lo + ((hi - lo) * i) / SAMPLES;
    points.push({ x, y: K / x });
  }
  return points;
}

export const ammBidAskCurveSpec: PriceRampSpec = {
  x: {
    label: "Base asset reserve",
    min: MIN,
    max: MAX,
    ticks: [
      { at: ASK_BASE, label: "ask_base" },
      { at: 1, label: "base_reserve" },
      { at: BID_BASE, label: "bid_base" },
    ],
  },
  y: {
    label: "Quote asset reserve",
    min: MIN,
    max: MAX,
    ticks: [
      { at: BID_QUOTE, label: "bid_quote" },
      { at: 1, label: "quote_reserve" },
      { at: ASK_QUOTE, label: "ask_quote" },
    ],
  },
  curves: [
    {
      points: curve(),
      label: "The AMM curve, base reserve times quote reserve equals k",
    },
  ],
  markers: [
    { x: ASK_BASE, y: ASK_QUOTE, label: "Ask price", guides: true },
    { x: 1, y: 1, label: "Reservation price", tone: "signal", guides: true },
    { x: BID_BASE, y: BID_QUOTE, label: "Bid price", guides: true },
  ],
};
