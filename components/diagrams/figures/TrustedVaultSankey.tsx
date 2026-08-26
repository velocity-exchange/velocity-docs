"use client";

import { Diagram } from "../Diagram";
import { Sankey } from "../Sankey";
import { trustedVaultSpec } from "./trusted-vault.data";

export function TrustedVaultSankey() {
  return (
    <Diagram
      title="Vault equity counts borrowed value that has left custody"
      caption="Shows why depositor share price does not fall when the manager borrows: the borrowed value keeps counting toward vault equity even though the tokens are no longer in the vault. Source: this page's prose. The page gives no borrow amount or vault size, so the 50/50 split is illustrative only, not to scale, and it does not represent repay or mark-to-market, which happen later and change this split over time."
    >
      {({ captionId }) => (
        <Sankey
          spec={trustedVaultSpec}
          ariaLabel="Sankey diagram of vault equity split between assets held in the vault and value borrowed by the manager"
          describedBy={captionId}
          width={500}
          height={240}
          labelWidth={{ left: 140, right: 160 }}
        />
      )}
    </Diagram>
  );
}
