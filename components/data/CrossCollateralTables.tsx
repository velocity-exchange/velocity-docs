"use client";

import { useMemo } from "react";
import { useOnChainData } from "../../hooks/useOnChainData";
import modStyles from "../../content/protocol/getting-started/getting-started.module.css";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

export function AssetWeightsTable({ poolId }: { poolId: number }) {
  const headings = [
    "Asset",
    "Initial Asset Weight",
    "Maintenance Asset Weight",
    "Initial Liability Weight",
    "Maintenance Liability Weight",
    "IMF Factor",
  ];

  const { data, isLoading, isError } = useOnChainData();

  const poolWeightData = useMemo(
    () => data?.assetWeights.filter((row) => row.poolId === poolId),
    [data, poolId]
  );

  return (
    <Table className="min-w-[760px]">
      <TableHeader>
        <TableRow>
          {headings.map((heading) => (
            <TableHead key={heading}>{heading}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {poolWeightData && poolWeightData.length > 0 ? (
          poolWeightData.map((row, i) => (
            <TableRow key={i}>
              <TableCell>{row.asset}</TableCell>
              <TableCell>{row.initialAssetWeight}</TableCell>
              <TableCell>{row.maintenanceAssetWeight}</TableCell>
              <TableCell>{row.initialLiabilityWeight}</TableCell>
              <TableCell>{row.maintenanceLiabilityWeight}</TableCell>
              <TableCell>{row.imfFactor}</TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={headings.length}>
              <div className={modStyles.loading}>
                {isError
                  ? "Failed to load on-chain data."
                  : isLoading
                    ? "Loading..."
                    : "No data available."}
              </div>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

export function LTVTable({ poolId }: { poolId: number }) {
  const headings = ["Asset", "Initial LTV", "Max LTV"];

  const { data, isLoading, isError } = useOnChainData();
  const poolLTVData = useMemo(
    () => data?.ltv.filter((row) => row.poolId === poolId),
    [data, poolId]
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {headings.map((heading) => (
            <TableHead key={heading}>{heading}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {poolLTVData && poolLTVData.length > 0 ? (
          poolLTVData.map((row, i) => (
            <TableRow key={i}>
              <TableCell>{row.asset}</TableCell>
              <TableCell>{row.initialLTV}</TableCell>
              <TableCell>{row.maxLTV}</TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={headings.length}>
              <div className={modStyles.loading}>
                {isError
                  ? "Failed to load on-chain data."
                  : isLoading
                    ? "Loading..."
                    : "No data available."}
              </div>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
