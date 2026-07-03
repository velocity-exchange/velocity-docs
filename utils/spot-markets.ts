import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Connection } from "@solana/web3.js";
import {
  DelistedMarketSetting,
  VelocityCore,
  VelocityProgram,
  WebSocketVelocityClientAccountSubscriber,
} from "@velocity-exchange/sdk";

export const getSpotMarketAccountSusbcriber = async () => {
  return new WebSocketVelocityClientAccountSubscriber(
    getVelocityProgram(),
    [],
    [],
    [],
    true,
    DelistedMarketSetting.Unsubscribe,
    undefined,
    "confirmed"
  );
};

const getVelocityProgram = (): VelocityProgram => {
  const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL!);
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
