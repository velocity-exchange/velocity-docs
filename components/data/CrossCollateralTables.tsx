"use client";

import { useMemo } from "react";
import { useOnChainData } from "../../hooks/useOnChainData";
import modStyles from "../../content/protocol/getting-started/getting-started.module.css";

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
    <table>
      <thead>
        <tr>
          {headings.map((heading) => (
            <th key={heading}>{heading}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {poolWeightData && poolWeightData.length > 0 ? (
          poolWeightData.map((row, i) => (
            <tr key={i}>
              <td>{row.asset}</td>
              <td>{row.initialAssetWeight}</td>
              <td>{row.maintenanceAssetWeight}</td>
              <td>{row.initialLiabilityWeight}</td>
              <td>{row.maintenanceLiabilityWeight}</td>
              <td>{row.imfFactor}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={headings.length}>
              <div className={modStyles.loading}>
                {isError
                  ? "Failed to load on-chain data."
                  : isLoading
                    ? "Loading..."
                    : "No data available."}
              </div>
            </td>
          </tr>
        )}
      </tbody>
    </table>
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
    <table>
      <thead>
        <tr>
          {headings.map((heading) => (
            <th key={heading}>{heading}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {poolLTVData && poolLTVData.length > 0 ? (
          poolLTVData.map((row, i) => (
            <tr key={i}>
              <td>{row.asset}</td>
              <td>{row.initialLTV}</td>
              <td>{row.maxLTV}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={headings.length}>
              <div className={modStyles.loading}>
                {isError
                  ? "Failed to load on-chain data."
                  : isLoading
                    ? "Loading..."
                    : "No data available."}
              </div>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
