import type { SequenceSpec } from "../layout/sequence";

// Sources, all pages in this repo:
//   content/protocol/how-it-works/jit-faq.mdx (event emitter, first come first
//     served fills, partial fills, makers are their own fillers)
//   content/developers/market-makers/jit-auctions.mdx ("Auction lifecycle")
//   content/protocol/how-it-works/matching-engine.mdx (who submits a fill, and
//     that resting liquidity and the AMM are matched by price, not in a fixed order)
//   content/protocol/how-it-works/keepers/index.mdx (what keepers do)
export const jitAuctionSpec: SequenceSpec = {
  actors: [
    { id: "taker", label: "Taker", note: "off-chain" },
    { id: "program", label: "Program", note: "on-chain" },
    // The docs call this the event emitter; "feed" keeps the lane narrow enough
    // to fit the docs column without scrolling, and the caption names it.
    { id: "emitter", label: "Event feed", note: "on-chain" },
    { id: "makers", label: "JIT makers", note: "off-chain" },
    { id: "keeper", label: "Keeper", note: "off-chain" },
  ],
  steps: [
    {
      kind: "phase",
      label: "Auction opens",
      steps: [
        { kind: "message", from: "taker", to: "program", label: "Order with auction params" },
        { kind: "message", from: "program", to: "emitter", label: "Taker order event", dashed: true },
        { kind: "message", from: "emitter", to: "makers", label: "New auction", dashed: true },
      ],
    },
    {
      kind: "phase",
      label: "Auction window",
      steps: [
        { kind: "message", from: "makers", to: "makers", label: "Price at this slot" },
        { kind: "message", from: "makers", to: "program", label: "Place and make fill", tone: "signal" },
        { kind: "message", from: "program", to: "taker", label: "Filled at auction price", dashed: true },
        {
          kind: "note",
          label: "Any maker can fill any part of the order, first come first served, so partial fills are normal.",
        },
      ],
    },
    {
      kind: "phase",
      label: "Auction ends unfilled",
      steps: [
        { kind: "message", from: "keeper", to: "program", label: "Fill from DLOB or AMM" },
        {
          kind: "note",
          label:
            "Resting orders and the AMM are matched by price at each level, not in a fixed order. The taker can submit this fill themselves instead.",
        },
        { kind: "message", from: "program", to: "taker", label: "Fill, or the order expires", dashed: true },
      ],
    },
  ],
};
