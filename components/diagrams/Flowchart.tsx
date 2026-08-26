"use client";

import { useId, type CSSProperties } from "react";
import {
  layoutFlowchart,
  type FlowchartSpec,
  type PlacedFlowEdge,
  type PlacedFlowNode,
  type Tone,
} from "./layout/flowchart";
import { useHostWidth } from "./useHostWidth";

export type FlowchartProps = {
  spec: FlowchartSpec;
  /** Minimum drawn width. The figure grows to fill a wider container and scrolls below this. */
  width?: number;
  /** Minimum drawn height. The drawing sits centred in any extra room. */
  height?: number;
  describedBy?: string;
  ariaLabel: string;
};

const TONES: Tone[] = ["default", "out", "signal"];

export function Flowchart({ spec, width: minWidth = 560, height: minHeight, describedBy, ariaLabel }: FlowchartProps) {
  // React ids carry characters a url(#…) reference cannot hold.
  const markerId = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const [hostRef, hostWidth] = useHostWidth(minWidth);
  const { nodes, edges, width, height } = layoutFlowchart(spec, { width: hostWidth, height: minHeight });
  const labelOf = (id: string) => nodes.find((n) => n.id === id)!.label;

  return (
    <div ref={hostRef} className="dg-host">
      <svg
        className="dg-svg dg-fc"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={ariaLabel}
        aria-describedby={describedBy}
      >
        <defs>
          {TONES.map((tone) => (
            <marker
              key={tone}
              id={`${markerId}-${tone}`}
              className="dg-fc-marker"
              data-tone={tone}
              viewBox="0 0 8 8"
              refX={8}
              refY={4}
              markerWidth={8}
              markerHeight={8}
              markerUnits="userSpaceOnUse"
              orient="auto"
            >
              <path className="dg-fc-arrow" d="M0.5,0.5 L8,4 L0.5,7.5 Z" />
            </marker>
          ))}
        </defs>
        <g>
          {edges.map((edge, i) => (
            <Edge
              key={i}
              edge={edge}
              markerId={markerId}
              title={edge.label ?? `${labelOf(edge.from)} to ${labelOf(edge.to)}`}
            />
          ))}
        </g>
        <g>
          {nodes.map((node) => (
            <Node key={node.id} node={node} />
          ))}
        </g>
      </svg>
    </div>
  );
}

function Edge({ edge, markerId, title }: { edge: PlacedFlowEdge; markerId: string; title: string }) {
  const tone = edge.tone ?? "default";
  return (
    <g
      className="dg-fc-edge"
      data-tone={tone}
      data-edge={`${edge.from}->${edge.to}`}
      style={{ ["--dg-col" as string]: edge.step } as CSSProperties}
    >
      <title>{title}</title>
      {/* A 1.5px stroke is a hard hover target, so a wider invisible twin takes the pointer. */}
      <path className="dg-fc-edge-hit" d={edge.path} />
      <path className="dg-fc-edge-path" d={edge.path} pathLength={1} markerEnd={`url(#${markerId}-${tone})`} />
      {edge.label ? (
        <text className="dg-fc-edge-label" x={edge.labelX} y={edge.labelY} textAnchor={edge.labelAnchor}>
          {edge.label}
        </text>
      ) : null}
    </g>
  );
}

function Node({ node }: { node: PlacedFlowNode }) {
  return (
    <g
      className="dg-fc-node"
      data-kind={node.kind}
      data-tone={node.tone ?? "default"}
      data-node={node.id}
      style={{ ["--dg-col" as string]: node.step } as CSSProperties}
    >
      <rect
        className="dg-fc-box"
        x={node.x}
        y={node.y}
        width={node.width}
        height={node.height}
        rx={node.rx}
        ry={node.rx}
      />
      <text className="dg-fc-label" x={node.cx} y={node.labelBaseline} textAnchor="middle">
        {node.lines.map((line, i) => (
          <tspan key={`${i}-${line}`} x={node.cx} dy={i === 0 ? 0 : node.lineHeight}>
            {line}
          </tspan>
        ))}
      </text>
      {node.note ? (
        <text className="dg-fc-note" x={node.cx} y={node.noteBaseline} textAnchor="middle">
          {node.note}
        </text>
      ) : null}
    </g>
  );
}
