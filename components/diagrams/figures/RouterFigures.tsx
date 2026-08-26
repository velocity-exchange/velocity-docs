"use client";

import { Diagram } from "../Diagram";
import { Flow } from "../Flow";
import { Sankey } from "../Sankey";
import {
  fillTopologySpec,
  orderLifecycleSpec,
  relayLoopSpec,
  signingSpec,
  splitSpec,
} from "./router-fill.data";

/** `router-fill.data.test.ts` checks that the text fits these widths. */
const FLOW_WIDTH = 790;
const FLOW_NODE = 150;

export function FillTopologyFlow() {
  return (
    <Diagram
      title="The four liquidity sources in one fill"
      caption="The green lines are the calls that leave the Velocity program. A book and a quoter program answer on the same interface. Velocity applies its limits when each call returns. The filler is off-chain and has no privilege. The filler assembles the account list and pays the transaction fee. The filler cannot select prices."
    >
      {({ captionId }) => (
        <Flow
          spec={fillTopologySpec}
          ariaLabel="Flow diagram of a perp fill. A taker order and an off-chain filler reach the router pass. The router quotes the vAMM, DLOB makers, the CLOB book, and registered quoter programs, then settles."
          describedBy={captionId}
          width={FLOW_WIDTH}
          nodeWidth={FLOW_NODE}
        />
      )}
    </Diagram>
  );
}

export function SplitSankey() {
  return (
    <Diagram
      title="How Velocity divides the taker size"
      caption="The values are an example. They are not a measurement. Tiers fill in order, from the lowest number. Sources in one tier divide a price level in proportion to their depth. Withheld depth is liquidity for a user account that the transaction does not include. It competes for the taker size, and Velocity then discards it."
    >
      {({ captionId }) => (
        <Sankey
          spec={splitSpec}
          ariaLabel="Sankey diagram of the taker size divided across priority tiers and then across each source"
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

export function RelayLoopFlow() {
  return (
    <Diagram
      title="How Velocity does unattended work"
      caption="The condition is on the account that it describes, so the condition cannot become stale while that account changes. The resolver runs only in a simulation. It decides if there is work and names the accounts for that work. The executor is the instruction that lands on chain. It has no signer. The crank reservoir of the market pays the sender, and the protocol treasury refills the reservoir."
    >
      {({ captionId }) => (
        <Flow
          spec={relayLoopSpec}
          ariaLabel="The relay loop. A condition block wakes an off-chain turner. The turner simulates a resolver. The resolver stages an executor. The executor lands, pays the sender, and moves the wake."
          describedBy={captionId}
          width={FLOW_WIDTH}
          nodeWidth={FLOW_NODE}
        />
      )}
    </Diagram>
  );
}
