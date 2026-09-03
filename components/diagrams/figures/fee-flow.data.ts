import type { SankeySpec } from "../layout/sankey";

// Values are % of the gross taker fee.
//
// The remainder split is the live mainnet configuration of
// State.perpFeeStructure, not FeeStructure::perps_default: amm_fee_numerator
// and if_fee_numerator are both 15, so the protocol keeps the residual 70. An
// earlier version of this spec drew both at 0 by reading the program's
// defaults, which mainnet has never run. Both numerators are admin-settable,
// so <PerpFeeSplitTable /> on the page beside this figure reads them live and
// is the authority; this figure only has to show the right shape.
//
// The referrer reward and referee discount both apply only while
// FeatureBitFlags::BuilderCodes is set. They are drawn because they are the
// configured schedule, and the caption says so.
const REFEREE = 5;   // referee_fee_numerator: 5% of the gross taker fee
const REFERRER = 10; // referrer_reward_numerator: 10%
const FILLER = 10;   // filler reward, size leg, capped by a time leg
const NET = 100 - REFEREE - REFERRER - FILLER;

// Shares of the remainder, over FEE_PERCENTAGE_DENOMINATOR (100), rendered
// back as a % of the gross fee so every value on the figure is in one unit.
const AMM_SHARE = 15;
const IF_SHARE = 15;
const PROTOCOL_SHARE = 100 - AMM_SHARE - IF_SHARE;

const ofGross = (share: number) => (NET * share) / 100;
const pct = (value: number) => `${+value.toFixed(2)}%`;

export const feeFlowSpec: SankeySpec = {
  nodes: [
    { id: "gross", label: "Taker fee", value: "100%", note: "gross, after tier and market rate", column: 0 },
    { id: "referee", label: "Referee discount", value: "5%", column: 1, tone: "out" },
    { id: "referrer", label: "Referrer reward", value: "10%", column: 1, tone: "out" },
    { id: "filler", label: "Filler reward", value: "10%", column: 1, tone: "out" },
    // Labelled below: the protocol ribbon rises across the space above it.
    { id: "net", label: "Remainder", value: "75%", column: 1, labelSide: "below" },
    { id: "if", label: "Insurance fund", value: pct(ofGross(IF_SHARE)), note: "15% of the remainder", column: 2, tone: "out" },
    { id: "vamm", label: "AMM", value: pct(ofGross(AMM_SHARE)), note: "15% of the remainder", column: 2, tone: "out" },
    { id: "protocol", label: "Protocol", value: pct(ofGross(PROTOCOL_SHARE)), note: "the residual 70%", column: 2, tone: "signal" },
  ],
  links: [
    { from: "gross", to: "referee", value: REFEREE, tone: "out", label: "Referee discount: 5% of the gross taker fee, never collected. Applies only while builder codes are enabled" },
    { from: "gross", to: "referrer", value: REFERRER, tone: "out", label: "Referrer reward: 10% of the gross taker fee, accrued to the referee's escrow. Applies only while builder codes are enabled" },
    { from: "gross", to: "filler", value: FILLER, tone: "out", label: "Filler reward: 10% of the fee by size, capped by a time leg that starts at one cent" },
    { from: "gross", to: "net", value: NET, label: "The remainder after the rebate and reward legs are carved off" },
    { from: "net", to: "if", value: ofGross(IF_SHARE), tone: "out", label: "The insurance fund's share of the remainder, admin-set and 15% on mainnet today" },
    { from: "net", to: "vamm", value: ofGross(AMM_SHARE), tone: "out", label: "The AMM's share of the remainder, admin-set and 15% on mainnet today. Spot fills route nothing here" },
    { from: "net", to: "protocol", value: ofGross(PROTOCOL_SHARE), tone: "signal", label: "The protocol keeps whatever the other two shares leave, the residual 70% of the remainder today" },
  ],
};
