"use client";

import { useOnChainData } from "../../hooks/useOnChainData";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

function StatusRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan}>{message}</TableCell>
    </TableRow>
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
    <Table className="min-w-[680px]">
      <TableHeader>
        <TableRow>
          {headings.map((heading) => (
            <TableHead key={heading}>{heading}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {!data ? (
          <StatusRow
            colSpan={headings.length}
            message={
              isError ? "Failed to load on-chain data." : "Loading..."
            }
          />
        ) : (
          data.perpMargin.map((row) => (
            <TableRow key={row.index}>
              <TableCell>{row.index}</TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.initial}</TableCell>
              <TableCell>{row.maintenance}</TableCell>
              <TableCell>{row.imfFactor}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
