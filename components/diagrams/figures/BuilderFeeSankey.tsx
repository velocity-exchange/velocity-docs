"use client";

import { Diagram } from "../Diagram";
import { Sankey } from "../Sankey";
import { builderFeeSpec } from "./builder-fee.data";

export function BuilderFeeSankey() {
  return (
    <Diagram
      title="How the builder fee sits on top of the taker fee"
      caption="Shows the builder fee as a separate charge added on top of the taker fee, not a cut taken from it. Source: the prose on this page. fee_tenth_bps varies per order, so the widths are illustrative, not to scale. The builder fee is waived on a fill where the taker does not clear initial margin or a required oracle is invalid; the fill itself still happens."
    >
      {({ captionId }) => (
        <Sankey
          spec={builderFeeSpec}
          ariaLabel="Sankey diagram of the builder fee charged on top of the taker fee, "
          describedBy={captionId}
          width={620}
          height={260}
          labelWidth={{ left: 150, right: 150 }}
        />
      )}
    </Diagram>
  );
}
