/** Neutral, leaving the system, and the one leg the reader is meant to follow. */
export type RampTone = "default" | "out" | "signal";

/** A bare number takes a derived label; the object form authors its own. */
export type RampTick = number | { at: number; label: string };

export type RampAxis = {
  /** Axis title, e.g. "Slots since the order is placed". */
  label: string;
  min: number;
  max: number;
  /** Authored ticks. Omitted, the axis picks about four round values. */
  ticks?: RampTick[];
};

export type RampPoint = { x: number; y: number };

export type RampSegment = {
  from: RampPoint;
  to: RampPoint;
  /** Accessible name of the line. Read out as its title, never drawn. */
  label?: string;
  dashed?: boolean;
  tone?: RampTone;
};

/** A sampled curve drawn as one polyline, e.g. a constant product reserve curve. */
export type RampCurve = {
  /** At least two points, in drawing order. */
  points: RampPoint[];
  /** Accessible name of the curve. Read out as its title, never drawn. */
  label?: string;
  tone?: RampTone;
};

/** A horizontal line at one price, e.g. the oracle or the order's limit. */
export type RampReference = { y: number; label: string; dashed?: boolean };

/** A shaded range of x, e.g. the auction versus the expiry extension. */
export type RampSpan = { from: number; to: number; label: string };

export type RampMarker = {
  x: number;
  y: number;
  label: string;
  tone?: RampTone;
  /** Which side of the point the label sits on. Default is the side the line is not climbing into. */
  place?: "above" | "below";
  /** Dashed drops from the point to both axes, so its coordinates can be read off the ticks. */
  guides?: boolean;
};

export type PriceRampSpec = {
  x: RampAxis;
  y: RampAxis;
  /** Straight lines. A spec needs at least one segment or one curve. */
  segments?: RampSegment[];
  curves?: RampCurve[];
  references?: RampReference[];
  spans?: RampSpan[];
  markers?: RampMarker[];
};

export type PriceRampOptions = {
  width: number;
  height: number;
  /** Room outside the plot: axis title and tick labels left and below, reference labels right. */
  marginLeft?: number;
  marginRight?: number;
  marginTop?: number;
  marginBottom?: number;
  /** Target tick count for an axis that authors none. */
  tickCount?: number;
};

export type PlacedTick = {
  value: number;
  label: string;
  /** The tick mark, a short line off the axis rule. */
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  labelX: number;
  labelY: number;
};

export type PlacedAxis = {
  label: string;
  /** The axis rule. */
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  ticks: PlacedTick[];
  /** The y axis title is drawn rotated -90 degrees about this point. */
  labelX: number;
  labelY: number;
};

export type PlacedSegment = {
  label?: string;
  dashed: boolean;
  tone: RampTone;
  /** A two-point line, so `pathLength={1}` makes the dash draw-in exact. */
  path: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type PlacedCurve = {
  label?: string;
  tone: RampTone;
  path: string;
};

export type PlacedReference = {
  value: number;
  label: string;
  dashed: boolean;
  path: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  labelX: number;
  labelY: number;
};

export type PlacedSpan = {
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  labelX: number;
  labelY: number;
};

export type PlacedMarker = {
  label: string;
  tone: RampTone;
  cx: number;
  cy: number;
  labelX: number;
  labelY: number;
  /** Flips to "end" when the point sits too near the right edge to label outward. */
  labelAnchor: "start" | "end";
  /** Dashed guide paths to the x axis and the y axis. Empty without `guides`. */
  guides: string[];
};

export type PriceRampLayout = {
  plot: { x0: number; y0: number; x1: number; y1: number };
  x: PlacedAxis;
  y: PlacedAxis;
  segments: PlacedSegment[];
  curves: PlacedCurve[];
  references: PlacedReference[];
  spans: PlacedSpan[];
  markers: PlacedMarker[];
};

/** Comparisons on authored decimals, so 100.1 still counts as inside 0 to 100.1. */
const EPS = 1e-9;
const TICK_LEN = 4;
const TICK_GAP = 8;
/** Half the cap height of a 12px label, so it sits on its tick rather than under it. */
const CAP_HALF = 4;
const X_TICK_LABEL_DROP = 18;
const X_TITLE_DROP = 38;
/** Distance from the left edge to the rotated y axis title's centre line. */
const Y_TITLE_INSET = 13;
const SPAN_LABEL_LIFT = 8;
const MARKER_GAP = 8;
const MARKER_LABEL_LIFT = 10;
const MARKER_LABEL_DROP = 18;
/** Room a marker label needs to its right before it flips to the other side. */
const MARKER_LABEL_ROOM = 96;

/**
 * Pure layout for a price-over-slots chart: linear scales on both axes, one
 * straight path per segment, and an anchor for every piece of text. Ranges are
 * authored, never inferred, so a figure cannot silently rescale when its data
 * changes; anything outside the authored range throws instead.
 */
export function layoutPriceRamp(spec: PriceRampSpec, opts: PriceRampOptions): PriceRampLayout {
  const {
    width,
    height,
    marginLeft = 76,
    marginRight = 128,
    marginTop = 26,
    marginBottom = 46,
    tickCount = 4,
  } = opts;

  checkAxis(spec.x, "x");
  checkAxis(spec.y, "y");
  const specSegments = spec.segments ?? [];
  const specCurves = spec.curves ?? [];
  if (specSegments.length === 0 && specCurves.length === 0) {
    throw new Error("PriceRamp needs at least one segment or curve");
  }

  const plot = {
    x0: marginLeft,
    y0: marginTop,
    x1: width - marginRight,
    y1: height - marginBottom,
  };
  if (plot.x1 <= plot.x0 || plot.y1 <= plot.y0) {
    throw new Error(`PriceRamp has no room to draw at ${width} by ${height} after margins`);
  }

  const sx = (v: number) => plot.x0 + ((v - spec.x.min) / (spec.x.max - spec.x.min)) * (plot.x1 - plot.x0);
  const sy = (v: number) => plot.y1 - ((v - spec.y.min) / (spec.y.max - spec.y.min)) * (plot.y1 - plot.y0);

  const segments: PlacedSegment[] = specSegments.map((s, i) => {
    const where = `segment ${i}${s.label ? ` (${s.label})` : ""}`;
    checkIn(s.from.x, spec.x, "x", `${where} start`);
    checkIn(s.from.y, spec.y, "y", `${where} start`);
    checkIn(s.to.x, spec.x, "x", `${where} end`);
    checkIn(s.to.y, spec.y, "y", `${where} end`);
    const x1 = sx(s.from.x);
    const y1 = sy(s.from.y);
    const x2 = sx(s.to.x);
    const y2 = sy(s.to.y);
    return {
      label: s.label,
      dashed: s.dashed ?? false,
      tone: s.tone ?? "default",
      path: `M ${r(x1)} ${r(y1)} L ${r(x2)} ${r(y2)}`,
      x1: r(x1),
      y1: r(y1),
      x2: r(x2),
      y2: r(y2),
    };
  });

  const curves: PlacedCurve[] = specCurves.map((c, i) => {
    const where = `curve ${i}${c.label ? ` (${c.label})` : ""}`;
    if (c.points.length < 2) throw new Error(`PriceRamp ${where} needs at least two points`);
    const path = c.points
      .map((p, j) => {
        checkIn(p.x, spec.x, "x", `${where} point ${j}`);
        checkIn(p.y, spec.y, "y", `${where} point ${j}`);
        return `${j === 0 ? "M" : "L"} ${r(sx(p.x))} ${r(sy(p.y))}`;
      })
      .join(" ");
    return { label: c.label, tone: c.tone ?? "default", path };
  });

  const references: PlacedReference[] = (spec.references ?? []).map((ref, i) => {
    checkIn(ref.y, spec.y, "y", `reference ${i} (${ref.label})`);
    const y = r(sy(ref.y));
    return {
      value: ref.y,
      label: ref.label,
      dashed: ref.dashed ?? true,
      path: `M ${r(plot.x0)} ${y} L ${r(plot.x1)} ${y}`,
      x1: r(plot.x0),
      y1: y,
      x2: r(plot.x1),
      y2: y,
      labelX: r(plot.x1 + TICK_GAP),
      labelY: y + CAP_HALF,
    };
  });

  const spans: PlacedSpan[] = (spec.spans ?? []).map((span, i) => {
    const where = `span ${i} (${span.label})`;
    checkIn(span.from, spec.x, "x", `${where} start`);
    checkIn(span.to, spec.x, "x", `${where} end`);
    if (span.to <= span.from) throw new Error(`PriceRamp ${where} ends at or before it starts`);
    const x = r(sx(span.from));
    const x1 = r(sx(span.to));
    return {
      label: span.label,
      x,
      y: r(plot.y0),
      width: r(x1 - x),
      height: r(plot.y1 - plot.y0),
      labelX: r((x + x1) / 2),
      labelY: r(plot.y0 - SPAN_LABEL_LIFT),
    };
  });

  const markers: PlacedMarker[] = (spec.markers ?? []).map((m, i) => {
    const where = `marker ${i} (${m.label})`;
    checkIn(m.x, spec.x, "x", where);
    checkIn(m.y, spec.y, "y", where);
    const cx = r(sx(m.x));
    const cy = r(sy(m.y));
    const anchor: "start" | "end" = cx + MARKER_LABEL_ROOM > plot.x1 ? "end" : "start";
    return {
      label: m.label,
      tone: m.tone ?? "default",
      cx,
      cy,
      labelX: anchor === "end" ? cx - MARKER_GAP : cx + MARKER_GAP,
      labelY: below(m, cy, spec, plot) ? cy + MARKER_LABEL_DROP : cy - MARKER_LABEL_LIFT,
      labelAnchor: anchor,
      guides: m.guides ? [`M ${cx} ${cy} L ${cx} ${r(plot.y1)}`, `M ${cx} ${cy} L ${r(plot.x0)} ${cy}`] : [],
    };
  });

  return {
    plot,
    x: {
      label: spec.x.label,
      x1: r(plot.x0),
      y1: r(plot.y1),
      x2: r(plot.x1),
      y2: r(plot.y1),
      ticks: ticksFor(spec.x, tickCount).map(({ value, label }) => {
        const x = r(sx(value));
        return {
          value,
          label,
          x1: x,
          y1: r(plot.y1),
          x2: x,
          y2: r(plot.y1 + TICK_LEN),
          labelX: x,
          labelY: r(plot.y1 + X_TICK_LABEL_DROP),
        };
      }),
      labelX: r((plot.x0 + plot.x1) / 2),
      labelY: r(plot.y1 + X_TITLE_DROP),
    },
    y: {
      label: spec.y.label,
      x1: r(plot.x0),
      y1: r(plot.y0),
      x2: r(plot.x0),
      y2: r(plot.y1),
      ticks: ticksFor(spec.y, tickCount).map(({ value, label }) => {
        const y = r(sy(value));
        return {
          value,
          label,
          x1: r(plot.x0 - TICK_LEN),
          y1: y,
          x2: r(plot.x0),
          y2: y,
          labelX: r(plot.x0 - TICK_GAP),
          labelY: y + CAP_HALF,
        };
      }),
      labelX: Y_TITLE_INSET,
      labelY: r((plot.y0 + plot.y1) / 2),
    },
    segments,
    curves,
    references,
    spans,
    markers,
  };
}

/**
 * A marker sits on the line, so the free side is the one the line is not
 * climbing into: a rising price leaves room underneath, a falling one above.
 * Either rail overrules that, since a label past it lands in the tick labels.
 */
function below(
  marker: RampMarker,
  cy: number,
  spec: PriceRampSpec,
  plot: { y0: number; y1: number },
): boolean {
  const rising = risingAt(marker.x, spec);
  const want = marker.place ? marker.place === "below" : rising;
  if (want && cy + MARKER_LABEL_DROP > plot.y1) return false;
  if (!want && cy - MARKER_LABEL_LIFT - CAP_HALF * 2 < plot.y0) return true;
  return want;
}

/** Whether the segment or curve leg under x climbs to the right. False when nothing is under it. */
function risingAt(x: number, spec: PriceRampSpec): boolean {
  const legs: RampSegment[] = [...(spec.segments ?? [])];
  for (const curve of spec.curves ?? []) {
    for (let i = 1; i < curve.points.length; i++) legs.push({ from: curve.points[i - 1], to: curve.points[i] });
  }
  const under = legs.find(
    (s) => x >= Math.min(s.from.x, s.to.x) - EPS && x <= Math.max(s.from.x, s.to.x) + EPS,
  );
  return under ? under.to.y > under.from.y : false;
}

function checkAxis(axis: RampAxis, name: "x" | "y") {
  if (!Number.isFinite(axis.min) || !Number.isFinite(axis.max)) {
    throw new Error(`PriceRamp ${name} axis needs finite min and max`);
  }
  if (axis.max <= axis.min) {
    throw new Error(`PriceRamp ${name} axis max (${axis.max}) must be greater than min (${axis.min})`);
  }
  for (const tick of axis.ticks ?? []) {
    const at = typeof tick === "number" ? tick : tick.at;
    checkIn(at, axis, name, `${name} axis tick`);
  }
}

function checkIn(value: number, axis: RampAxis, name: "x" | "y", where: string) {
  if (!Number.isFinite(value) || value < axis.min - EPS || value > axis.max + EPS) {
    throw new Error(`PriceRamp ${where}: ${name}=${value} is outside the ${name} range ${axis.min} to ${axis.max}`);
  }
}

function ticksFor(axis: RampAxis, count: number): { value: number; label: string }[] {
  const authored = axis.ticks;
  if (authored && authored.length > 0) {
    const values = authored.map((t) => (typeof t === "number" ? t : t.at));
    const places = decimalsFor(values);
    return authored.map((t) =>
      typeof t === "number" ? { value: t, label: t.toFixed(places) } : { value: t.at, label: t.label },
    );
  }
  const values = autoTicks(axis.min, axis.max, count);
  const places = decimalsFor(values);
  return values.map((value) => ({ value, label: value.toFixed(places) }));
}

/**
 * Round values inside the range, spaced 1, 2, 5, or 10 times a power of ten.
 * The step rounds to the nearest of those rather than up, so the axis lands
 * near the requested count instead of always under it.
 */
function autoTicks(min: number, max: number, count: number): number[] {
  const raw = (max - min) / Math.max(1, count);
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
  const error = raw / magnitude;
  const factor = error >= Math.sqrt(50) ? 10 : error >= Math.sqrt(10) ? 5 : error >= Math.sqrt(2) ? 2 : 1;
  const step = factor * magnitude;
  const out: number[] = [];
  for (let i = Math.ceil(min / step - EPS); i * step <= max + step * EPS; i++) out.push(round(i * step));
  return out;
}

/** The fewest decimals that print every value exactly, so one tick's precision sets them all. */
function decimalsFor(values: number[]): number {
  let places = 0;
  for (const value of values) {
    let needed = 6;
    for (let i = 0; i <= 6; i++) {
      if (Math.abs(value - Number(value.toFixed(i))) < EPS) {
        needed = i;
        break;
      }
    }
    places = Math.max(places, needed);
  }
  return places;
}

/** Clears the float dust that `i * step` leaves on values like 0.30000000000000004. */
function round(v: number) {
  return Number(v.toFixed(10));
}

/** Sub-pixel geometry only widens the SVG payload; a tenth is finer than any screen. */
function r(v: number) {
  return Math.round(v * 10) / 10;
}
