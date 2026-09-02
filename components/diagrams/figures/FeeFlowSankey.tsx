"use client";

import { Diagram } from "../Diagram";
import { Sankey } from "../Sankey";
import { feeFlowSpec } from "./fee-flow.data";

export function FeeFlowSankey() {
  return (
    <Diagram
      title="Where a taker fee goes"
      caption="Shows how one taker fee is divided, as a percentage of the gross fee. Source: FeeStructure::perps_default in the program, not a target model. The insurance fund and AMM legs are drawn at 0% because amm_fee_numerator and if_fee_numerator are both 0 at launch, so the protocol receives the whole remainder; both are admin-settable and can be raised. The referrer and referee legs are the configured schedule, and neither pays out while builder codes are disabled, which they are at launch."
    >
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
