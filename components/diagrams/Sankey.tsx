import { layoutSankey, type LabelSide, type PlacedLink, type PlacedNode, type SankeySpec } from "./layout/sankey";

export type SankeyProps = {
  spec: SankeySpec;
  width?: number;
  height?: number;
  /** Horizontal room reserved outside the first and last columns for their labels. */
  labelWidth?: number | { left: number; right: number };
  describedBy?: string;
  ariaLabel: string;
};

/** Gap between a node and its label. */
const LABEL_PAD = 10;
/** Baseline offset for a label under a node, which needs no ascender room. */
const BELOW_PAD = 15;
const LINE = 15;
/** Half a 13px cap height, so a stacked label sits on the node's optical centre. */
const CAP_HALF = 4;
const NODE_GAP = 26;
/** Top and bottom room. The first middle-column label sits above its node. */
const MARGIN_Y = 24;

export function Sankey({ spec, width = 760, height = 360, labelWidth = 150, describedBy, ariaLabel }: SankeyProps) {
  const maxCol = Math.max(...spec.nodes.map((n) => n.column));
  const marginLeft = typeof labelWidth === "number" ? labelWidth : labelWidth.left;
  const marginRight = typeof labelWidth === "number" ? labelWidth : labelWidth.right;
  const { nodes, links } = layoutSankey(spec, {
    width,
    height,
    nodeWidth: 12,
    nodeGap: NODE_GAP,
    marginLeft,
    marginRight,
    marginY: MARGIN_Y,
  });

  return (
    <svg
      className="dg-svg"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={ariaLabel}
      aria-describedby={describedBy}
    >
      <g>
        {links.map((l) => (
          <Link key={`${l.from}->${l.to}`} link={l} col={colOf(nodes, l.from)} />
        ))}
      </g>
      <g>
        {nodes.map((n) => (
          <Node key={n.id} node={n} side={sideOf(n, maxCol)} />
        ))}
      </g>
    </svg>
  );
}

function colOf(nodes: PlacedNode[], id: string) {
  return nodes.find((n) => n.id === id)?.column ?? 0;
}

function sideOf(node: PlacedNode, maxCol: number): LabelSide {
  if (node.labelSide) return node.labelSide;
  if (node.column === 0) return "left";
  return node.column === maxCol ? "right" : "above";
}

function Link({ link, col }: { link: PlacedLink; col: number }) {
  const title = link.label ?? `${link.from} to ${link.to}: ${link.value}`;
  return (
    <path
      className="dg-link"
      d={link.path}
      strokeWidth={Math.max(1, link.width)}
      pathLength={1}
      data-tone={link.tone ?? "default"}
      data-path={`${link.from}->${link.to}`}
      style={{ ["--dg-col" as string]: col } as React.CSSProperties}
    >
      <title>{title}</title>
    </path>
  );
}

function Node({ node, side }: { node: PlacedNode; side: LabelSide }) {
  return (
    <g
      className="dg-node"
      data-tone={node.tone ?? "default"}
      data-node={node.id}
      style={{ ["--dg-col" as string]: node.column } as React.CSSProperties}
    >
      <rect
        className="dg-node-rect"
        x={node.x0}
        y={node.y0}
        width={node.x1 - node.x0}
        height={Math.max(2, node.y1 - node.y0)}
      />
      {side === "left" || side === "right" ? (
        <SideLabel node={node} side={side} />
      ) : (
        <EdgeLabel node={node} side={side} />
      )}
    </g>
  );
}

/**
 * Middle columns label off the top or bottom edge of the node: the band beside
 * them carries the ribbons that continue to the next column.
 */
function EdgeLabel({ node, side }: { node: PlacedNode; side: "above" | "below" }) {
  return (
    <text x={node.x0} y={side === "above" ? node.y0 - LABEL_PAD : node.y1 + BELOW_PAD} textAnchor="start">
      <tspan className="dg-label">{node.label}</tspan>
      {node.value ? (
        <tspan className="dg-value" dx={6}>
          {node.value}
        </tspan>
      ) : null}
      {node.note ? (
        <tspan className="dg-note" dx={6}>
          {node.note}
        </tspan>
      ) : null}
    </text>
  );
}

/** First and last columns label outside the diagram, one line per part. */
function SideLabel({ node, side }: { node: PlacedNode; side: "left" | "right" }) {
  const x = side === "left" ? node.x0 - LABEL_PAD : node.x1 + LABEL_PAD;
  const lines = 1 + (node.value ? 1 : 0) + (node.note ? 1 : 0);
  const y = (node.y0 + node.y1) / 2 - ((lines - 1) * LINE) / 2 + CAP_HALF;

  return (
    <text x={x} y={y} textAnchor={side === "left" ? "end" : "start"}>
      <tspan className="dg-label">{node.label}</tspan>
      {node.value ? (
        <tspan className="dg-value" x={x} dy={LINE}>
          {node.value}
        </tspan>
      ) : null}
      {node.note ? (
        <tspan className="dg-note" x={x} dy={LINE}>
          {node.note}
        </tspan>
      ) : null}
    </text>
  );
}
