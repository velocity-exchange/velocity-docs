"use client";

import { Diagram } from "../Diagram";
import { Sankey } from "../Sankey";
import { builderFeeSpec } from "./builder-fee.data";

export function BuilderFeeSankey() {
  return (
    <Diagram
      title="How the builder fee sits on top of the taker fee"
      caption="Shows the builder fee as an extra charge on top of the taker fee, and where it ends up. Source: this page's prose. The taker fee and builder fee are two separate charges added together for this figure, not a split of one pool, and fee_tenth_bps varies per order, so the widths are illustrative, not to scale."
    >
      {({ captionId }) => (
        <Sankey
          spec={builderFeeSpec}
          ariaLabel="Sankey diagram of the builder fee charged on top of the taker fee, ending in a payout or a waiver"
          describedBy={captionId}
          width={620}
          height={340}
          labelWidth={{ left: 150, right: 150 }}
        />
      )}
    </Diagram>
  );
}
