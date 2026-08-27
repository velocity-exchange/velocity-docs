"use client";

import {
  layoutPriceRamp,
  type PlacedAxis,
  type PlacedMarker,
  type PlacedSegment,
  type PriceRampSpec,
} from "./layout/price-ramp";
import { useHostWidth } from "./useHostWidth";

export type PriceRampProps = {
  spec: PriceRampSpec;
  /** Minimum drawn width. The figure grows to fill a wider container and scrolls below this. */
  width?: number;
  /** Height at the minimum width. Grows by HEIGHT_GROWTH of any extra width. */
  height?: number;
  /**
   * Room reserved outside the plot for text: axis title and tick labels on the
   * left and below, reference labels on the right, span labels above.
   */
  margin?: { left?: number; right?: number; top?: number; bottom?: number };
  describedBy?: string;
  ariaLabel: string;
};

/** Extra height per extra pixel of width, so a wide figure does not go flat. */
const HEIGHT_GROWTH = 0.08;
const MARKER_RADIUS = 4;

export function PriceRamp({
  spec,
  width: minWidth = 640,
  height: baseHeight = 340,
  margin,
  describedBy,
  ariaLabel,
}: PriceRampProps) {
  const [hostRef, width] = useHostWidth(minWidth);
  const height = Math.round(baseHeight + (width - minWidth) * HEIGHT_GROWTH);
  const layout = layoutPriceRamp(spec, {
    width,
    height,
    marginLeft: margin?.left,
    marginRight: margin?.right,
    marginTop: margin?.top,
    marginBottom: margin?.bottom,
  });

  return (
    <div ref={hostRef} className="dg-host">
      <svg
        className="dg-svg dg-pr"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={ariaLabel}
        aria-describedby={describedBy}
      >
        <g>
          {layout.spans.map((s, i) => (
            <g key={i}>
              <rect className="dg-pr-span" x={s.x} y={s.y} width={s.width} height={s.height} />
              <text className="dg-note dg-pr-span-label" x={s.labelX} y={s.labelY} textAnchor="middle">
                {s.label}
              </text>
            </g>
          ))}
        </g>
        <Axis axis={layout.x} orient="x" />
        <Axis axis={layout.y} orient="y" />
        <g>
          {layout.references.map((ref, i) => (
            <g key={i}>
              <path className="dg-pr-ref" d={ref.path} data-dashed={ref.dashed ? "" : undefined} />
              <text className="dg-note" x={ref.labelX} y={ref.labelY} textAnchor="start">
                {ref.label}
              </text>
            </g>
          ))}
        </g>
        <g>
          {layout.segments.map((segment, i) => (
            <Segment key={`${segment.x1},${segment.y1}-${segment.x2},${segment.y2}`} segment={segment} col={i + 1} />
          ))}
        </g>
        <g>
          {layout.markers.map((marker, i) => (
            <Marker key={i} marker={marker} col={layout.segments.length + 1} />
          ))}
        </g>
      </svg>
    </div>
  );
}

/**
 * Ticks carry no grid: the reference lines are the only horizontals, so they
 * stay the thing the eye follows across the plot.
 */
function Axis({ axis, orient }: { axis: PlacedAxis; orient: "x" | "y" }) {
  const across = orient === "x";
  return (
    <g className="dg-pr-axis">
      <line className="dg-pr-rule" x1={axis.x1} y1={axis.y1} x2={axis.x2} y2={axis.y2} />
      {axis.ticks.map((tick, i) => (
        <g key={i}>
          <line className="dg-pr-rule" x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2} />
          <text className="dg-value" x={tick.labelX} y={tick.labelY} textAnchor={across ? "middle" : "end"}>
            {tick.label}
          </text>
        </g>
      ))}
      <text
        className="dg-pr-axis-label"
        x={axis.labelX}
        y={axis.labelY}
        textAnchor="middle"
        transform={across ? undefined : `rotate(-90 ${axis.labelX} ${axis.labelY})`}
      >
        {axis.label}
      </text>
    </g>
  );
}

/**
 * pathLength rescales stroke-dasharray into fractions of the line, which is what
 * makes the draw-in exact but leaves no unit for a real dash pattern. A dashed
 * segment keeps its own units and fades in instead.
 */
function Segment({ segment, col }: { segment: PlacedSegment; col: number }) {
  return (
    <path
      className="dg-pr-line"
      d={segment.path}
      pathLength={segment.dashed ? undefined : 1}
      data-tone={segment.tone}
      data-dashed={segment.dashed ? "" : undefined}
      style={{ ["--dg-col" as string]: col } as React.CSSProperties}
    >
      {segment.label ? <title>{segment.label}</title> : null}
    </path>
  );
}

function Marker({ marker, col }: { marker: PlacedMarker; col: number }) {
  return (
    <g
      className="dg-pr-marker"
      data-tone={marker.tone}
      style={{ ["--dg-col" as string]: col } as React.CSSProperties}
    >
      <title>{marker.label}</title>
      <circle className="dg-pr-dot" cx={marker.cx} cy={marker.cy} r={MARKER_RADIUS} />
      <text className="dg-label" x={marker.labelX} y={marker.labelY} textAnchor={marker.labelAnchor}>
        {marker.label}
      </text>
    </g>
  );
}
