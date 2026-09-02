"use client";

import { Diagram } from "../Diagram";
import { Sankey } from "../Sankey";
import { feeFlowSpec } from "./fee-flow.data";

export function FeeFlowSankey() {
  return (
    <Diagram
      title="Where a taker fee goes"
      caption="Shows how one taker fee is divided, as a percentage of the gross fee. Source: FeeStructure::perps_default in the program, not a target model. The insurance fund and AMM legs are drawn at equal width with the remainder because amm_fee_numerator and if_fee_numerator are both admin-settable per market; read the live PerpMarket account for the split in force. The referrer and referee legs pay out only while the BuilderCodes bit of FeatureBitFlags is set on State.featureBitFlags; read the live State account for that bit."
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
