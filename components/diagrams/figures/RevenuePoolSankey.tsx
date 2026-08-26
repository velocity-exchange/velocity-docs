"use client";

import { Diagram } from "../Diagram";
import { Sankey } from "../Sankey";
import { revenuePoolSpec } from "./revenue-pool.data";

export function RevenuePoolSankey() {
  return (
    <Diagram
      title="Where protocol fees go: revenue pool versus protocol fee pool"
      caption="Shows the two destinations for protocol fees and what each one funds downstream. Source: the prose on this page. The page names the three fee sources and both destinations but does not publish a split percentage between the Insurance Fund's cut and the protocol's cut, or between vault settlement and AMM draws, so the widths here are illustrative, not to scale."
    >
      {({ captionId }) => (
        <Sankey
          spec={revenuePoolSpec}
          ariaLabel="Sankey diagram of protocol fees splitting between the revenue pool and the protocol fee pool"
          describedBy={captionId}
          width={600}
          height={340}
          labelWidth={{ left: 150, right: 150 }}
        />
      )}
    </Diagram>
  );
}
