"use client";

import { Diagram } from "../Diagram";
import { Flowchart } from "../Flowchart";
import { auctionSanitizationSpec } from "./auction-sanitization.data";

export function AuctionSanitizationFlow() {
  return (
    <Diagram
      title="How the program rewrites your auction params"
      caption="Shows the order the program applies these rules in, on every perp order placement. Source: the rules listed in this section. The steps follow the order the section lists them, and the prose does not settle whether the limit clamp runs before or after the market start price is picked. Signed message (swift) orders are the only ones given a tolerance, and the section does not describe oracle offset auctions separately."
    >
      {({ captionId }) => (
        <Flowchart
          spec={auctionSanitizationSpec}
          ariaLabel="Flowchart of the auction parameter rules the program applies, from filling in missing prices to storing the longer duration"
          describedBy={captionId}
          width={420}
        />
      )}
    </Diagram>
  );
}
