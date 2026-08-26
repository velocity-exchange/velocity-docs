import type { FlowSpec } from "../layout/flow";
import type { SankeySpec } from "../layout/sankey";

// Source: velocity-v1 `programs/velocity/src/controller/orders.rs`
// (`fulfill_perp_order_router_pass`), `math/router.rs`, and the quoter wire in
// `crates/quoter-spec`.
//
// Node text is one line of SVG. It does not wrap and it does not clip. At the
// 150px node width of these figures, the room is about 19 label characters, 22
// note characters, and 18 mono value characters. A forward edge label has only
// the column gap, which is about 9 characters. A longer label belongs on a
// return edge, which crosses the figure, or in the caption.
// `router-fill.data.test.ts` checks each of these limits.

/** The liquidity sources in one perp fill, and the program that holds each one. */
export const fillTopologySpec: FlowSpec = {
  nodes: [
    { id: "taker", label: "Taker order", note: "resting or signed", column: 0 },
    { id: "filler", label: "Filler", note: "off-chain", kind: "offchain", column: 0 },

    { id: "router", label: "Router pass", note: "Velocity", value: "one per fill", column: 1, tone: "signal" },

    { id: "vamm", label: "vAMM", note: "curve, no orders", column: 2 },
    { id: "dlob", label: "DLOB makers", note: "User.orders", column: 2 },
    { id: "clob", label: "CLOB book", note: "market account", value: "quote/execute", column: 2 },
    { id: "custom", label: "Quoter programs", note: "quoter accounts", value: "quote/execute", column: 2 },

    { id: "settle", label: "Settlement", note: "Velocity", value: "margin checked", column: 3 },
  ],
  edges: [
    { from: "taker", to: "router" },
    { from: "filler", to: "router", dashed: true },
    { from: "router", to: "vamm" },
    { from: "router", to: "dlob" },
    { from: "router", to: "clob", tone: "signal" },
    { from: "router", to: "custom", tone: "signal" },
    { from: "vamm", to: "settle" },
    { from: "dlob", to: "settle" },
    { from: "clob", to: "settle" },
    { from: "custom", to: "settle" },
  ],
};

/**
 * Example values, not a measurement. Tiers fill in order, from the lowest
 * number. Sources in one tier divide a price level in proportion to their
 * depth. The size that no source has depth for stays unfilled.
 *
 * Withheld depth is deliberately absent. It takes no part of the division, so a
 * leg for it here would state the opposite.
 */
export const splitSpec: SankeySpec = {
  nodes: [
    { id: "size", label: "Taker size", value: "100", note: "unfilled, step-aligned", column: 0 },

    { id: "t0", label: "Tier 0 — vAMM", value: "40", column: 1 },
    { id: "t10", label: "Tier 10 — books", value: "45", column: 1 },
    { id: "t20", label: "Tier 20 — quoters", value: "10", column: 1 },
    { id: "short", label: "No depth", value: "5", note: "stays unfilled", column: 1, tone: "out", labelSide: "below" },

    { id: "vamm", label: "vAMM", value: "40", column: 2 },
    { id: "clob", label: "CLOB book", value: "25", column: 2 },
    { id: "dlob", label: "DLOB maker", value: "20", column: 2 },
    { id: "quoter", label: "Quoter", value: "10", column: 2 },
  ],
  links: [
    { from: "size", to: "t0", value: 40 },
    { from: "size", to: "t10", value: 45 },
    { from: "size", to: "t20", value: 10 },
    { from: "size", to: "short", value: 5, tone: "out" },
    { from: "t0", to: "vamm", value: 40 },
    // One tier, two sources at the same price: pro rata by depth.
    { from: "t10", to: "clob", value: 25 },
    { from: "t10", to: "dlob", value: 20 },
    { from: "t20", to: "quoter", value: 10 },
  ],
};

/** The key that Velocity signs each CPI call with, and the callee of that call. */
export const signingSpec: FlowSpec = {
  nodes: [
    { id: "vault", label: "velocity_signer", note: "vault + protocol User", value: '["velocity_signer"]', column: 0, tone: "out" },
    { id: "clobauth", label: "clob_authority", note: "every place_authority", value: '["clob_authority"]', column: 0, tone: "signal" },
    { id: "qsigner", label: "quoter_signer", note: "one per entry", value: '["quoter_signer", entry]', column: 0 },

    { id: "token", label: "Token program", note: "vaults", column: 1 },
    { id: "book", label: "CLOB program", note: "place, cancel, execute", column: 1 },
    { id: "quoter", label: "Quoter program", note: "quote, execute", column: 1 },
  ],
  edges: [
    { from: "vault", to: "token", label: "signs", tone: "out" },
    { from: "clobauth", to: "book", label: "signs", tone: "signal" },
    { from: "qsigner", to: "quoter", label: "signs" },
  ],
};

/** The states of one order, and the program that holds each fact about it. */
export const orderLifecycleSpec: FlowSpec = {
  nodes: [
    { id: "place", label: "place_clob_order", note: "margin gate", value: "reserves margin", column: 0 },
    { id: "resting", label: "On the book", note: "clob: one record", value: "margin reserved", column: 1, tone: "signal" },
    { id: "fill", label: "Filled", note: "execute consumed", column: 2 },
    { id: "cull", label: "Culled", note: "remainder too small", column: 2 },
    { id: "removed", label: "Removed", note: "cancel/evict/expire", column: 2 },
    { id: "unwind", label: "Release margin", note: "same instruction", value: "no extra step", column: 3 },
  ],
  edges: [
    { from: "place", to: "resting" },
    { from: "resting", to: "fill" },
    { from: "resting", to: "cull" },
    { from: "resting", to: "removed" },
    { from: "fill", to: "unwind" },
    { from: "cull", to: "unwind" },
    { from: "removed", to: "unwind" },
  ],
};

/** How Velocity finds work that has no operator, and how that work lands. */
export const relayLoopSpec: FlowSpec = {
  nodes: [
    { id: "state", label: "Condition block", note: "on the account", value: "wake + resolver", column: 0, tone: "signal" },
    { id: "turner", label: "Turner", note: "off-chain", kind: "offchain", column: 1 },
    { id: "resolver", label: "Resolver", note: "simulated only", value: "stages the work", column: 2 },
    { id: "executor", label: "Executor", note: "lands on chain", value: "no signer", column: 3 },
  ],
  edges: [
    { from: "state", to: "turner", label: "wakes", tone: "signal" },
    { from: "turner", to: "resolver", dashed: true },
    { from: "resolver", to: "executor" },
    { from: "executor", to: "state", label: "pays the sender and moves the wake" },
  ],
};
