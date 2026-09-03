import type { SankeySpec } from "../layout/sankey";

// Source: programs/velocity/src/state/state.rs, FeeStructure::perps_default.
// Values are % of the gross taker fee.
//
// This spec previously came from a private Notion document and drew the
// remainder as 15% insurance fund, 15% vAMM, 70% protocol. The program sets
// amm_fee_numerator: 0 and if_fee_numerator: 0, so the protocol receives the
// entire remainder, which is what the prose beside the figure already said.
// Both numerators are admin-settable, so this is the launch configuration
// rather than a fixed property.
//
// The referrer reward and referee discount both apply only while
// FeatureBitFlags::BuilderCodes is set, and it is clear at initialize, so at
// launch neither leg carries value. They are drawn because they are the
// configured schedule, and the caption says so.
const REFEREE = 5;   // referee_fee_numerator: 5% of the gross taker fee
const REFERRER = 10; // referrer_reward_numerator: 10%
const FILLER = 10;   // filler reward, size leg, capped by a time leg
const NET = 100 - REFEREE - REFERRER - FILLER;

export const feeFlowSpec: SankeySpec = {
  nodes: [
    { id: "gross", label: "Taker fee", value: "100%", note: "gross, after tier and add-on", column: 0 },
    { id: "referee", label: "Referee discount", value: "5%", column: 1, tone: "out" },
    { id: "referrer", label: "Referrer reward", value: "10%", column: 1, tone: "out" },
    { id: "filler", label: "Filler reward", value: "10%", column: 1, tone: "out" },
    // Labelled below: the protocol ribbon rises across the space above it.
    { id: "net", label: "Remainder", value: "75%", column: 1, labelSide: "below" },
    { id: "if", label: "Insurance fund", value: "0%", note: "if_fee_numerator, 0 at launch", column: 2, tone: "out" },
    { id: "vamm", label: "AMM", value: "0%", note: "amm_fee_numerator, 0 at launch", column: 2, tone: "out" },
    { id: "protocol", label: "Protocol", value: "75%", note: "the whole remainder", column: 2, tone: "signal" },
  ],
  links: [
    { from: "gross", to: "referee", value: REFEREE, tone: "out", label: "Referee discount: 5% of the gross taker fee, never collected. Applies only while builder codes are enabled" },
    { from: "gross", to: "referrer", value: REFERRER, tone: "out", label: "Referrer reward: 10% of the gross taker fee, accrued to the referee's escrow. Applies only while builder codes are enabled" },
    { from: "gross", to: "filler", value: FILLER, tone: "out", label: "Filler reward: 10% of the fee by size, capped by a time leg that starts at one cent" },
    { from: "gross", to: "net", value: NET, label: "The remainder after the rebate and reward legs are carved off" },
    { from: "net", to: "protocol", value: NET, tone: "signal", label: "The protocol receives the entire remainder, because both the insurance fund and AMM numerators are 0 at launch" },
  ],
};
