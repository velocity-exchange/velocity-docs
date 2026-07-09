"use client";

import { useQuery } from "@tanstack/react-query";
import type { OnChainData } from "../types/onchain-data";

export type {
  AssetWeightRow,
  LTVRow,
  OnChainData,
  PerpMarginRow,
} from "../types/onchain-data";

async function fetchOnChainData(): Promise<OnChainData> {
  const res = await fetch("/api/onchain-data");
  if (!res.ok) {
    throw new Error("Failed to fetch on-chain data");
  }
  return res.json();
}

export function useOnChainData() {
  return useQuery({
    queryKey: ["onchain-data"],
    queryFn: fetchOnChainData,
  });
}
