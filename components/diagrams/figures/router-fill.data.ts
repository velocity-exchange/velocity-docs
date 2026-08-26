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

/** The two routers, the four kinds of quoter, and the program that holds each one. */
export const fillTopologySpec: FlowSpec = {
  nodes: [
    { id: "offchain", label: "Off-chain router", note: "quotes every quoter", value: "picks a subset", kind: "offchain", column: 0 },
    { id: "taker", label: "Taker order", note: "size and limit price", column: 0 },

    { id: "router", label: "Router pass", note: "Velocity", value: "quotes the subset", column: 1, tone: "signal" },

    { id: "vamm", label: "vAMM", note: "curve, no orders", column: 2 },
    { id: "dlob", label: "DLOB makers", note: "User.orders", column: 2 },
    { id: "clob", label: "CLOB book", note: "market account", value: "quote/execute", column: 2 },
    { id: "custom", label: "Quoter programs", note: "quoter accounts", value: "quote/execute", column: 2 },

    { id: "settle", label: "Settlement", note: "Velocity", value: "margin checked", column: 3 },
  ],
  edges: [
    { from: "offchain", to: "router", label: "a subset", dashed: true },
    { from: "taker", to: "router" },
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
    { id: "t20", label: "Tier 20 — custom", value: "10", column: 1 },
    { id: "short", label: "No depth", value: "5", note: "stays unfilled", column: 1, tone: "out", labelSide: "below" },

    { id: "vamm", label: "vAMM", value: "40", column: 2 },
    { id: "clob", label: "CLOB book", value: "25", column: 2 },
    { id: "dlob", label: "DLOB maker", value: "20", column: 2 },
    { id: "quoter", label: "Custom quoter", value: "10", column: 2 },
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

/**
 * Who builds the transaction, and what the chain then checks. Both paths read
 * the same router answer. A signed order reaches the chain through a filler, so
 * the chain holds that filler to the route the taker named. A taker that signs
 * the transaction chose its own account list, so the chain checks nothing more.
 *
 * Source: velocity-v1 `rust/swift/src/route.rs` (the `/route` answer),
 * `instructions/keeper.rs` (`require_signed_route`), and `math/router.rs`
 * (`withheld_obligation`).
 */
export const routingLanesSpec: FlowSpec = {
  nodes: [
    { id: "taker", label: "Taker", note: "wants size at a price", column: 0 },
    { id: "router", label: "Router", note: "off-chain", value: "GET /route", kind: "offchain", column: 1, tone: "signal" },
    { id: "filler", label: "Filler", note: "any operator", value: "signed order", kind: "offchain", column: 2 },
    { id: "client", label: "The taker's client", note: "no third party", value: "own transaction", kind: "offchain", column: 2 },
    { id: "fill", label: "Router pass", note: "Velocity", value: "checks the route", column: 3, tone: "signal" },
  ],
  edges: [
    { from: "taker", to: "router", label: "the order", dashed: true },
    { from: "router", to: "taker", label: "the split, the CLOB makers in order, and the quoter entries", dashed: true },
    { from: "router", to: "filler", label: "broadcast", dashed: true, tone: "signal" },
    { from: "router", to: "client", dashed: true },
    { from: "filler", to: "fill", tone: "signal" },
    { from: "client", to: "fill" },
  ],
};

/**
 * One leg of a quoter call. Velocity writes the arguments, calls the program,
 * and reads the response out of the quoter's own account.
 *
 * The response does not come back as return data. Return data holds 1024 bytes
 * and a ladder is larger, so the return holds a `ResponsePointerV0` and the
 * records stay in the account. Velocity reads them where they lie: velocity's
 * heap is 32 KB and never reclaims, and one fill calls every quoter twice.
 *
 * Source: velocity-v1 `crates/quoter-spec/src/lib.rs` and
 * `state/prop_amm.rs` (`invoke_quoter`).
 */
export const quoterCallSpec: FlowSpec = {
  nodes: [
    { id: "velocity", label: "Velocity", note: "writes the arguments", value: "disc ++ args", column: 0 },
    { id: "quoter", label: "The quoter", note: "one CPI call", value: "quote or execute", column: 1, tone: "signal" },
    { id: "region", label: "Response account", note: "the quoter's own", value: "fixed-width", column: 2 },
    { id: "read", label: "Router pass", note: "reads it in place", value: "no decode step", column: 3 },
  ],
  edges: [
    { from: "velocity", to: "quoter", label: "the args", tone: "signal" },
    { from: "quoter", to: "region", label: "writes" },
    { from: "region", to: "read", label: "the bytes" },
    { from: "quoter", to: "velocity", label: "return data: the offset and the length of the response" },
  ],
};


/**
 * Why two routers exist. The off-chain router reads the whole market; a
 * transaction locks at most 64 accounts, so it carries a part of it.
 *
 * The values are an example, and they meet `splitSpec`: the 95 carried here is
 * the depth that the 100 of taker size in that figure divides across, which is
 * why 5 of it finds no depth.
 *
 * Source: velocity-v1 `rust/swift/src/route.rs` and `math/router.rs`
 * (`TX_ACCOUNT_LOCK_CEILING`, `MAKER_ACCOUNT_COST`).
 */
export const routerReachSpec: SankeySpec = {
  nodes: [
    { id: "seen", label: "On the market", value: "135", note: "every quoter, every maker", column: 0 },

    { id: "carried", label: "In the transaction", value: "95", note: "best price first", column: 1, tone: "signal" },
    { id: "worse", label: "Worse than the limit", value: "25", column: 1, tone: "out" },
    { id: "noroom", label: "No account room", value: "15", column: 1, tone: "out", labelSide: "below" },
  ],
  links: [
    { from: "seen", to: "carried", value: 95, tone: "signal", label: "Depth the transaction carries, taken best price first" },
    { from: "seen", to: "worse", value: 25, tone: "out", label: "Depth priced worse than the taker's limit price" },
    { from: "seen", to: "noroom", value: 15, tone: "out", label: "Depth the taker would accept, left out because the transaction has no account room for its owner" },
  ],
};
