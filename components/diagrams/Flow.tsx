"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { layoutFlow, type FlowSpec, type PlacedFlowEdge, type PlacedFlowNode } from "./layout/flow";

export type FlowProps = {
  spec: FlowSpec;
  /** Minimum drawn width. The figure grows to fill a wider container and scrolls below this. */
  width?: number;
  /** Box width per node. Labels are single lines, so this is what bounds them. */
  nodeWidth?: number;
  describedBy?: string;
  ariaLabel: string;
};

/** Line box for one row of node text, matching the layout's own. */
const LINE = 16;
/** Cap-height half for a 13px label, so a text block sits optically centred. */
const CAP_HALF = 4;

/**
 * A layered flow: which part calls which part, from left to right. It uses the
 * same tokens and the same draw-in as {@link Sankey}. A flow carries no
 * magnitude, so every edge has one stroke weight. The figure shows structure.
 * {@link Sankey} shows size.
 */
export function Flow({ spec, width: minWidth = 640, nodeWidth = 176, describedBy, ariaLabel }: FlowProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [hostWidth, setHostWidth] = useState(0);

  useLayoutEffect(() => {
    const el = hostRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => setHostWidth(Math.floor(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Server and first client render use the minimum; the observer widens it before paint.
  const width = Math.max(minWidth, hostWidth);
  const { nodes, edges, height } = layoutFlow(spec, { width, nodeWidth });

  return (
    <div ref={hostRef} className="dg-host">
      <svg
        className="dg-svg"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={ariaLabel}
        aria-describedby={describedBy}
      >
        <defs>
          {(["default", "out", "signal"] as const).map((tone) => (
            <marker
              key={tone}
              id={`dg-arrow-${tone}`}
              className="dg-arrow"
              data-tone={tone}
              viewBox="0 0 8 8"
              refX="7"
              refY="4"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L8,4 L0,8 z" />
            </marker>
          ))}
        </defs>
        <g>
          {edges.map((e) => (
            <Edge key={`${e.from}->${e.to}`} edge={e} />
          ))}
        </g>
        <g>
          {nodes.map((n) => (
            <Node key={n.id} node={n} />
          ))}
        </g>
      </svg>
    </div>
  );
}

function Edge({ edge }: { edge: PlacedFlowEdge }) {
  const tone = edge.tone ?? "default";
  return (
    <g
      className="dg-edge"
      data-tone={tone}
      data-path={`${edge.from}->${edge.to}`}
      style={{ ["--dg-col" as string]: edge.column } as React.CSSProperties}
    >
      <path
        className="dg-edge-line"
        d={edge.path}
        pathLength={1}
        data-dashed={edge.dashed ? "" : undefined}
        markerEnd={`url(#dg-arrow-${tone})`}
      >
        <title>{edge.label ?? `${edge.from} to ${edge.to}`}</title>
      </path>
      {edge.label ? (
        <text className="dg-edge-label" x={edge.labelX} y={edge.labelY - 7} textAnchor="middle">
          {edge.label}
        </text>
      ) : null}
    </g>
  );
}

function Node({ node }: { node: PlacedFlowNode }) {
  const cx = (node.x0 + node.x1) / 2;
  const top = (node.y0 + node.y1) / 2 - ((node.lines.length - 1) * LINE) / 2 + CAP_HALF;
  return (
    <g
      className="dg-box"
      data-tone={node.tone ?? "default"}
      data-kind={node.kind ?? "onchain"}
      data-node={node.id}
      style={{ ["--dg-col" as string]: node.column } as React.CSSProperties}
    >
      <rect
        className="dg-box-rect"
        x={node.x0}
        y={node.y0}
        width={node.x1 - node.x0}
        height={node.y1 - node.y0}
      />
      <text x={cx} y={top} textAnchor="middle">
        <tspan className="dg-label">{node.label}</tspan>
        {node.note ? (
          <tspan className="dg-note" x={cx} dy={LINE}>
            {node.note}
          </tspan>
        ) : null}
        {node.value ? (
          <tspan className="dg-value" x={cx} dy={LINE}>
            {node.value}
          </tspan>
        ) : null}
      </text>
    </g>
  );
}
