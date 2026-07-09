import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Connection } from "@solana/web3.js";
import { VelocityCore, VelocityProgram } from "@velocity-exchange/sdk";

// Server-side (no signer) Velocity program/connection builder. Used by
// app/api/onchain-data/route.ts to read on-chain account data directly via
// RPC, rather than subscribing over a websocket.
export const getVelocityProgram = (rpcUrl: string): VelocityProgram => {
  const connection = new Connection(rpcUrl);
  const provider = new AnchorProvider(
    connection,
    // @ts-ignore
    null, // we won't sign any tx so this should be fine
    {
      commitment: "confirmed",
    }
  );
  // Use the SDK's bundled IDL (address is embedded in the IDL itself) rather
  // than a locally vendored copy, so this always tracks the installed
  // @velocity-exchange/sdk version.
  return new Program(
    VelocityCore.defaultIdl(),
    provider
  ) as unknown as VelocityProgram;
};
