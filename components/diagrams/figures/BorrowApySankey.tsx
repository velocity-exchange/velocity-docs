"use client";

import { Diagram } from "../Diagram";
import { Sankey } from "../Sankey";
import { borrowApySpec } from "./borrow-apy.data";

export function BorrowApySankey() {
  return (
    <Diagram
      title="Where borrow interest goes"
      caption="Shows the two cuts taken off borrow interest before the rest reaches lenders. Source: the prose on this page and the Borrow Interest Rate page. Neither page publishes the live split between the two cuts, an admin-set per-market parameter, so the split shown is illustrative, not to scale."
    >
      {({ captionId }) => (
        <Sankey
          spec={borrowApySpec}
          ariaLabel="Sankey diagram of borrow interest splitting between the Insurance Fund, the protocol fee pool, and lenders"
          describedBy={captionId}
          width={560}
          height={280}
          labelWidth={{ left: 140, right: 160 }}
        />
      )}
    </Diagram>
  );
}
