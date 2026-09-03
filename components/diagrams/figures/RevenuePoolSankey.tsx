"use client";

import { Diagram } from "../Diagram";
import { Sankey } from "../Sankey";
import { revenuePoolSpec } from "./revenue-pool.data";

export function RevenuePoolSankey() {
  return (
    <Diagram
      title="Where protocol fees go: revenue pool versus protocol fee pool"
      caption="Shows where protocol fees go and what the insurance fund funds downstream. Source: programs/velocity/src, not the prose. The split numerators between the insurance fund's cut and the protocol's cut are admin-set per market and are 0 at launch, so every leg is drawn at equal width: this figure shows the routes, not the proportions. The draw into a perp market comes from the insurance fund vault, not the revenue pool, and covers a P&L deficit rather than funding."
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
