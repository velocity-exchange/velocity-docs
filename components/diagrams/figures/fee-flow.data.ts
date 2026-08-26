import type { SankeySpec } from "../layout/sankey";

// Source: Notion "Protocol Fee Structure" (2026-08-18), Brackets 1 and 2.
// Values are % of the gross taker fee. Ranged legs use their midpoint.
const NET = 100 - 5 - 10 - 6 - 9.4; // 69.6

export const feeFlowSpec: SankeySpec = {
  nodes: [
    { id: "gross", label: "Taker fee", value: "100%", note: "gross, after tier and add-on", column: 0 },
    { id: "referee", label: "Referee discount", value: "5%", column: 1, tone: "out" },
    { id: "referrer", label: "Referrer reward", value: "10%", column: 1, tone: "out" },
    { id: "filler", label: "Filler reward", value: "2–10%", column: 1, tone: "out" },
    { id: "maker", label: "Maker rebate", value: "6.3–12.5%", column: 1, tone: "out" },
    // Labelled below: the Insurance Fund and vAMM ribbons rise across the space above it.
    { id: "net", label: "Net taker fee", value: "≈70%", column: 1, labelSide: "below" },
    { id: "if", label: "Insurance Fund", value: "≈10%", note: "15% of net", column: 2 },
    { id: "vamm", label: "vAMM capital", value: "≈10%", note: "15% of net", column: 2 },
    { id: "protocol", label: "Protocol", value: "≈49%", note: "70% of net", column: 2, tone: "signal" },
  ],
  links: [
    { from: "gross", to: "referee", value: 5, tone: "out", label: "Referee discount: 5% of the gross taker fee, never collected" },
    { from: "gross", to: "referrer", value: 10, tone: "out", label: "Referrer reward: 10% of the gross taker fee" },
    { from: "gross", to: "filler", value: 6, tone: "out", label: "Filler reward: 2 to 10% of the gross taker fee, drawn at 6%" },
    { from: "gross", to: "maker", value: 9.4, tone: "out", label: "Maker rebate: 6.3 to 12.5% of the gross taker fee, drawn at 9.4%" },
    { from: "gross", to: "net", value: NET, label: "Net taker fee: about 70% of the gross taker fee" },
    { from: "net", to: "if", value: NET * 0.15, label: "Insurance Fund: 15% of the net taker fee" },
    { from: "net", to: "vamm", value: NET * 0.15, label: "vAMM capital: 15% of the net taker fee" },
    { from: "net", to: "protocol", value: NET * 0.7, tone: "signal", label: "Protocol: 70% of the net taker fee" },
  ],
};
