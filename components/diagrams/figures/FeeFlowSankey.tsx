"use client";

import { Diagram } from "../Diagram";
import { Sankey } from "../Sankey";
import { feeFlowSpec } from "./fee-flow.data";

export function FeeFlowSankey() {
  return (
    <Diagram
      title="Where a taker fee goes"
      caption="Shows how one taker fee is divided, as a percentage of the gross fee. The remainder split drawn here is mainnet's live configuration, an AMM and insurance share of 15% each against a residual 70% to the protocol, not the program's compiled defaults. Both shares are admin-settable, so the split table below this figure reads them from the chain and is the authority if the two ever disagree. Spot fills route nothing to the AMM. The referrer and referee legs pay out only while the BuilderCodes bit of FeatureBitFlags is set on State.featureBitFlags; read the live State account for that bit."
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
