"use client";

import { Diagram } from "../Diagram";
import { Sankey } from "../Sankey";
import { feeFlowSpec } from "./fee-flow.data";

const CAPTION =
  "Target allocation of a perp taker fee, as a share of the gross fee. The filler and maker legs vary by fill and are drawn at their midpoints. The Insurance Fund, vAMM, and protocol shares are admin-set numerators and are 0/0/100 on-chain today.";

export function FeeFlowSankey() {
  return (
    <Diagram title="Where a taker fee goes" caption={CAPTION}>
      {({ captionId }) => (
        <Sankey
          spec={feeFlowSpec}
          ariaLabel="Sankey diagram of the perp taker fee split"
          describedBy={captionId}
          width={600}
          height={380}
          labelWidth={{ left: 170, right: 114 }}
        />
      )}
    </Diagram>
  );
}
