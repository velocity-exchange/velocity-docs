import { layoutSankey, type PlacedLink, type PlacedNode, type SankeySpec } from "./layout/sankey";

export type SankeyProps = {
  spec: SankeySpec;
  width?: number;
  height?: number;
  /** Horizontal room reserved on each side for outside labels. */
  labelWidth?: number;
  describedBy?: string;
  ariaLabel: string;
};

export function Sankey({ spec, width = 760, height = 360, labelWidth = 150, describedBy, ariaLabel }: SankeyProps) {
  const maxCol = Math.max(...spec.nodes.map((n) => n.column));
  const { nodes, links } = layoutSankey(spec, {
    width,
    height,
    nodeWidth: 12,
    nodeGap: 18,
    marginX: labelWidth,
    marginY: 8,
  });

  return (
    <svg
      className="dg-svg"
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
          <Node key={n.id} node={n} side={n.column === 0 ? "left" : n.column === maxCol ? "right" : "above"} />
        ))}
      </g>
    </svg>
  );
}

function colOf(nodes: PlacedNode[], id: string) {
  return nodes.find((n) => n.id === id)?.column ?? 0;
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
      tabIndex={0}
    >
      <title>{title}</title>
    </path>
  );
}

function Node({ node, side }: { node: PlacedNode; side: "left" | "right" | "above" }) {
  const h = node.y1 - node.y0;
  const cy = node.y0 + h / 2;
  const pad = 10;
  const anchor = side === "left" ? "end" : "start";
  const x = side === "left" ? node.x0 - pad : side === "right" ? node.x1 + pad : node.x1 + pad;
  const y = cy;
  const hasNote = Boolean(node.note);
  const labelDy = hasNote ? -3 : 4;

  return (
    <g
      className="dg-node"
      data-tone={node.tone ?? "default"}
      data-node={node.id}
      style={{ ["--dg-col" as string]: node.column } as React.CSSProperties}
    >
      <rect className="dg-node-rect" x={node.x0} y={node.y0} width={node.x1 - node.x0} height={Math.max(2, h)} />
      <text x={x} y={y} textAnchor={anchor}>
        <tspan className="dg-label" dy={labelDy}>
          {node.label}
        </tspan>
        {node.value ? (
          <tspan className="dg-value" dx={6}>
            {node.value}
          </tspan>
        ) : null}
        {hasNote ? (
          <tspan className="dg-note" x={x} dy={15}>
            {node.note}
          </tspan>
        ) : null}
      </text>
    </g>
  );
}
