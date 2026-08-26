import type { SankeySpec } from "../layout/sankey";

// Source: content/developers/vault-managers/trusted-vaults.mdx ("Borrow" paragraph).
// This page describes a lifecycle (borrow, repay, mark-to-market) rather than a
// proportional split, and gives no borrow amount or vault size, so this figure only
// captures the one accounting fact the page states: manager-borrowed value keeps
// counting toward vault equity even though the tokens themselves have left the
// vault. The 50/50 split is illustrative only; a real vault's borrowed share varies
// per vault and per borrow.
export const trustedVaultSpec: SankeySpec = {
  nodes: [
    { id: "equity", label: "Vault equity", note: "share price basis", column: 0 },
    { id: "custody", label: "Held in vault", column: 1 },
    { id: "borrowed", label: "Borrowed by manager", note: "left vault custody", column: 1, tone: "signal" },
  ],
  links: [
    {
      from: "equity",
      to: "custody",
      value: 50,
      label: "Assets still held in the vault",
    },
    {
      from: "equity",
      to: "borrowed",
      value: 50,
      tone: "signal",
      label: "Manager-borrowed value: tokens have left the vault, but the value still counts toward equity for depositor share price until repaid",
    },
  ],
};
