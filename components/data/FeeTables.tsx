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

// Per-market taker fees at every volume tier, plus the maker rebate. The rates
// are the effective ones: the route folds each market's own taker add-on and
// fee adjustment into them, so a market priced above the published schedule
// shows the higher number here rather than the schedule's.
export function PerpFeeTable() {
  const { data, isError } = useOnChainData();

  // Tier columns come from the same read as the cells, so a schedule with a
  // fourth tier widens the table instead of silently dropping it.
  const tiers = data?.perpFeeTiers ?? [];
  const headings = ["Market", ...tiers, "Maker rebate"];

  return (
    <Table className="min-w-[560px]">
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
            message={isError ? "Failed to load on-chain data." : "Loading..."}
          />
        ) : (
          data.perpFees.map((row) => (
            <TableRow key={row.index}>
              <TableCell>{row.name}</TableCell>
              {row.takerFees.map((fee, i) => (
                <TableCell key={tiers[i] ?? i}>{fee}</TableCell>
              ))}
              <TableCell>{row.makerRebate}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

// How the taker-fee remainder is divided once the rebate and reward legs are
// off. Global to perps rather than per-market: it reads State.perpFeeStructure.
export function PerpFeeSplitTable() {
  const { data, isError } = useOnChainData();
  const headings = ["Claimant", "Share of the remainder"];
  const split = data?.perpFeeSplit;

  return (
    <Table className="min-w-[360px]">
      <TableHeader>
        <TableRow>
          {headings.map((heading) => (
            <TableHead key={heading}>{heading}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {!split ? (
          <StatusRow
            colSpan={headings.length}
            message={isError ? "Failed to load on-chain data." : "Loading..."}
          />
        ) : (
          <>
            <TableRow>
              <TableCell>AMM</TableCell>
              <TableCell>{split.amm}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Insurance fund</TableCell>
              <TableCell>{split.insuranceFund}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Protocol fee pool</TableCell>
              <TableCell>{split.protocol}</TableCell>
            </TableRow>
          </>
        )}
      </TableBody>
    </Table>
  );
}
