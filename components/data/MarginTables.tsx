"use client";

import { useOnChainData } from "../../hooks/useOnChainData";

function StatusRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan}>{message}</td>
    </tr>
  );
}

export function PerpMarginTable() {
  const { data, isError } = useOnChainData();
  const headings = [
    "Index",
    "Perpetuals",
    "Initial Margin (Ratio / Leverage)",
    "Maintenance Margin (Ratio / Leverage)",
    "IMF Factor",
  ];

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
        {!data ? (
          <StatusRow
            colSpan={headings.length}
            message={
              isError ? "Failed to load on-chain data." : "Loading..."
            }
          />
        ) : (
          data.perpMargin.map((row) => (
            <tr key={row.index}>
              <td>{row.index}</td>
              <td>{row.name}</td>
              <td>{row.initial}</td>
              <td>{row.maintenance}</td>
              <td>{row.imfFactor}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
