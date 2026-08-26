"use client";

import { Diagram } from "../Diagram";
import { Sankey } from "../Sankey";
import { feeFlowSpec } from "./fee-flow.data";

export function FeeFlowSankey() {
  return (
    <Diagram title="Where a taker fee goes">
      {({ captionId }) => (
        <Sankey
          spec={feeFlowSpec}
          ariaLabel="Sankey diagram of the perp taker fee split"
          describedBy={captionId}
          width={600}
          height={360}
          labelWidth={{ left: 170, right: 114 }}
        />
      )}
    </Diagram>
  );
}
