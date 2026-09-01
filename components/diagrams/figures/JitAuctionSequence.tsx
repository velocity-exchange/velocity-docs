"use client";

import { Diagram } from "../Diagram";
import { Sequence } from "../Sequence";
import { jitAuctionSpec } from "./jit-auction.data";

export function JitAuctionSequence() {
  return (
    <Diagram
      title="One taker order through a JIT auction"
      caption="Shows the order of events for a single taker order, from placement to a maker fill or to the fallback after the auction. Sources: the JIT FAQ, JIT Auctions, and Matching Engine pages in these docs. The event feed is the on-chain event emitter that makers subscribe to. The auction price ramps from the taker's best price toward their limit as slots pass, so filling early costs a maker more. Durations are counted in Solana slots, not seconds, and a limit order still open when its auction ends rests on the DLOB, where it can then fill as a maker."
    >
      {({ captionId }) => (
        <Sequence
          spec={jitAuctionSpec}
          ariaLabel="Sequence diagram of a taker order moving through a JIT auction, from placement to a maker fill or a fallback fill"
          describedBy={captionId}
          width={600}
        />
      )}
    </Diagram>
  );
}
