"use client";

import { Diagram } from "../Diagram";
import { Flow } from "../Flow";
import { Sankey } from "../Sankey";
import {
  fillTopologySpec,
  orderLifecycleSpec,
  quoterCallSpec,
  routerReachSpec,
  routingLanesSpec,
  signingSpec,
  splitSpec,
} from "./router-fill.data";

/** `router-fill.data.test.ts` checks that the text fits these widths. */
const FLOW_WIDTH = 790;
const FLOW_NODE = 150;
/** The topology flow has five columns, so its boxes are narrower. */
const WIDE_FLOW_NODE = 118;

export function FillTopologyFlow() {
  return (
    <Diagram
      title="The two routers and the four kinds of quoter"
      caption="Two routers do the same work, and they run in this order. The off-chain router quotes every quoter on the market and picks the ones that one transaction can carry. The router pass inside Velocity quotes only the quoters that arrived, and it holds each one to its own answer. DLOB makers are to be removed: an order will rest on the CLOB book instead of in the User account of its owner. The green lines are the calls that leave the Velocity program: a book and a custom quoter answer on the same interface, and Velocity applies its limits when each call returns. A filler or the taker signs and sends the transaction between the two routers, which the next figure shows."
    >
      {({ captionId }) => (
        <Flow
          spec={fillTopologySpec}
          ariaLabel="Flow diagram of a perp fill. A taker order reaches an off-chain router, which picks the subset of the market that one transaction can carry. The router pass in Velocity quotes that subset across the vAMM, DLOB makers, which are to be removed, the CLOB book, and custom quoter programs, then settles."
          describedBy={captionId}
          width={FLOW_WIDTH}
          nodeWidth={WIDE_FLOW_NODE}
        />
      )}
    </Diagram>
  );
}

export function SplitSankey() {
  return (
    <Diagram
      title="How Velocity divides the taker size"
      caption="The values are an example. They are not a measurement. Tiers fill in order, from the lowest number. Quoters in one tier divide a price level in proportion to their depth, which is what the two quoters in tier 10 show. The size that no quoter has depth for stays unfilled. Withheld depth is absent from this figure because it takes no part of the division."
    >
      {({ captionId }) => (
        <Sankey
          spec={splitSpec}
          ariaLabel="Sankey diagram of the taker size divided across priority tiers and then across each quoter"
          describedBy={captionId}
          width={620}
          height={340}
          labelWidth={{ left: 150, right: 150 }}
        />
      )}
    </Diagram>
  );
}

export function SigningFlow() {
  return (
    <Diagram
      title="The three signing keys and their callees"
      caption="Each key reaches one type of callee. A callee inherits signer privilege through a CPI call, so the separation is the security property. A quoter program receives the key of its own entry. That key authenticates at no book, at no other quoter program, and at no token vault."
    >
      {({ captionId }) => (
        <Flow
          spec={signingSpec}
          ariaLabel="Three PDAs and the program each one signs for. velocity_signer signs for the token program. clob_authority signs for the CLOB program. A per-entry quoter_signer signs for a quoter program."
          describedBy={captionId}
          width={640}
          nodeWidth={210}
        />
      )}
    </Diagram>
  );
}

export function OrderLifecycleFlow() {
  return (
    <Diagram
      title="One order in two programs"
      caption="The CLOB program holds the order. Velocity holds the margin for the order. Each way that an order leaves the book runs through a Velocity instruction. That instruction releases the margin in the same transaction. Velocity therefore needs no separate reconciliation step."
    >
      {({ captionId }) => (
        <Flow
          spec={orderLifecycleSpec}
          ariaLabel="The life of an order. Placement reserves margin. The order rests on the book. The order is then filled, culled, or removed, and Velocity releases the margin in the same instruction."
          describedBy={captionId}
          width={FLOW_WIDTH}
          nodeWidth={FLOW_NODE}
        />
      )}
    </Diagram>
  );
}

export function RoutingLanesFlow() {
  return (
    <Diagram
      title="Who builds the transaction"
      caption="A router simulates the whole fill and returns the account list that the fill needs: the split, the makers on each book in the order to carry them, and the registry entries. A router holds no key and selects no price. A signed order reaches the chain through a filler, so Velocity holds that filler to the route the taker named. A taker that signs its own transaction chose its own account list, and Velocity checks nothing more."
    >
      {({ captionId }) => (
        <Flow
          spec={routingLanesSpec}
          ariaLabel="Two paths to a fill. A taker asks an off-chain router for the split and the account list. A signed order goes to a filler, which builds and pays. A taker can also build its own transaction. Both reach the same router pass in Velocity."
          describedBy={captionId}
          width={FLOW_WIDTH}
          nodeWidth={FLOW_NODE}
        />
      )}
    </Diagram>
  );
}

export function QuoterCallFlow() {
  return (
    <Diagram
      title="One leg of a quoter call"
      caption="A quoter writes its response into its own account and returns the offset and the length of it. Return data holds 1024 bytes, and a ladder is larger. Velocity then reads the records where they lie: each record has a fixed width and a little-endian layout, so there is no decode step. Velocity has a 32 KB heap that it never reclaims, and one fill calls every registered quoter twice."
    >
      {({ captionId }) => (
        <Flow
          spec={quoterCallSpec}
          ariaLabel="One quoter call. Velocity writes the discriminator and the arguments, calls the quoter program, and the quoter writes fixed-width records into its response account. The quoter returns a pointer, and the router pass reads the records in place."
          describedBy={captionId}
          width={FLOW_WIDTH}
          nodeWidth={FLOW_NODE}
        />
      )}
    </Diagram>
  );
}

export function RouterReachSankey() {
  return (
    <Diagram
      title="What one transaction can carry"
      caption="The values are an example. They are not a measurement. A transaction locks at most 64 accounts, and one maker costs two of them, so a fill reaches part of a market and not all of it. The off-chain router chooses that part by price. The depth it carries here is the depth that the next figure divides the taker size across."
    >
      {({ captionId }) => (
        <Sankey
          spec={routerReachSpec}
          ariaLabel="Sankey diagram of the depth on a market, divided into the depth one transaction carries, the depth priced worse than the taker's limit, and the depth left out for want of account room"
          describedBy={captionId}
          width={620}
          height={260}
          labelWidth={{ left: 150, right: 170 }}
        />
      )}
    </Diagram>
  );
}
