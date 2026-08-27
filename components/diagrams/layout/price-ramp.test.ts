import { describe, expect, it } from "vitest";
import { layoutPriceRamp, type PriceRampSpec } from "./price-ramp";

const spec: PriceRampSpec = {
  x: { label: "Slots", min: 0, max: 20, ticks: [0, 10, 20] },
  y: { label: "Price", min: 100, max: 100.1, ticks: [100, 100.05, 100.1] },
  segments: [
    { from: { x: 0, y: 100 }, to: { x: 10, y: 100.1 }, label: "Auction ramp" },
    { from: { x: 10, y: 100.1 }, to: { x: 20, y: 100.1 }, label: "Extension", dashed: true, tone: "out" },
  ],
  references: [{ y: 100, label: "Oracle price" }],
  spans: [{ from: 0, to: 10, label: "Auction" }],
  markers: [{ x: 5, y: 100.05, label: "Fill", tone: "signal" }],
};

// Round numbers, so a mapped value is exact rather than nearly right.
const opts = { width: 700, height: 400, marginLeft: 100, marginRight: 100, marginTop: 50, marginBottom: 50 };

describe("layoutPriceRamp", () => {
  it("maps the axis range onto the plot box", () => {
    const out = layoutPriceRamp(spec, opts);
    expect(out.plot).toEqual({ x0: 100, y0: 50, x1: 600, y1: 350 });
    const [ramp] = out.segments;
    // x rises left to right, y rises upward: the ramp starts bottom left.
    expect(ramp.x1).toBe(100);
    expect(ramp.y1).toBe(350);
    expect(ramp.x2).toBe(350);
    expect(ramp.y2).toBe(50);
    expect(ramp.path).toBe("M 100 350 L 350 50");
  });

  it("places a midpoint marker at the centre of the box", () => {
    const [marker] = layoutPriceRamp(spec, opts).markers;
    expect(marker.cx).toBe(225);
    expect(marker.cy).toBe(200);
    expect(marker.tone).toBe("signal");
    expect(marker.labelAnchor).toBe("start");
  });

  it("keeps a marker label off the line it sits on", () => {
    // The ramp rises through the marker, so the free side is underneath.
    const [marker] = layoutPriceRamp(spec, opts).markers;
    expect(marker.labelY).toBeGreaterThan(marker.cy);

    const forced: PriceRampSpec = { ...spec, markers: [{ x: 5, y: 100.05, label: "Fill", place: "above" }] };
    const [above] = layoutPriceRamp(forced, opts).markers;
    expect(above.labelY).toBeLessThan(above.cy);
  });

  it("flips a marker label off the top rail", () => {
    const falling: PriceRampSpec = {
      ...spec,
      segments: [{ from: { x: 0, y: 100.1 }, to: { x: 20, y: 100 } }],
      markers: [{ x: 0, y: 100.1, label: "Start" }],
    };
    const [marker] = layoutPriceRamp(falling, opts).markers;
    expect(marker.cy).toBe(50);
    expect(marker.labelY).toBeGreaterThan(marker.cy);
  });

  it("flips a marker label inward when the point nears the right edge", () => {
    const near: PriceRampSpec = { ...spec, markers: [{ x: 20, y: 100, label: "Expiry" }] };
    const [marker] = layoutPriceRamp(near, opts).markers;
    expect(marker.labelAnchor).toBe("end");
    expect(marker.labelX).toBeLessThan(marker.cx);
  });

  it("spans the shaded band over the plot height", () => {
    const [span] = layoutPriceRamp(spec, opts).spans;
    expect(span.x).toBe(100);
    expect(span.width).toBe(250);
    expect(span.y).toBe(50);
    expect(span.height).toBe(300);
    expect(span.labelX).toBe(225);
    expect(span.labelY).toBeLessThan(span.y);
  });

  it("draws a reference across the plot and labels it outside", () => {
    const [ref] = layoutPriceRamp(spec, opts).references;
    expect(ref.y1).toBe(350);
    expect(ref.y2).toBe(350);
    expect(ref.dashed).toBe(true);
    expect(ref.labelX).toBeGreaterThan(600);
  });

  it("carries authored tick labels through and derives the rest", () => {
    const out = layoutPriceRamp(spec, opts);
    expect(out.x.ticks.map((t) => t.label)).toEqual(["0", "10", "20"]);
    // One tick needing two decimals sets the precision for the whole axis.
    expect(out.y.ticks.map((t) => t.label)).toEqual(["100.00", "100.05", "100.10"]);
    expect(out.y.ticks.map((t) => t.y1)).toEqual([350, 200, 50]);
  });

  it("takes an authored label on a tick", () => {
    const labelled: PriceRampSpec = {
      ...spec,
      x: { label: "Slots", min: 0, max: 20, ticks: [{ at: 0, label: "Placed" }, { at: 20, label: "Expiry" }] },
    };
    expect(layoutPriceRamp(labelled, opts).x.ticks.map((t) => t.label)).toEqual(["Placed", "Expiry"]);
  });

  it("generates round ticks when an axis authors none", () => {
    const auto: PriceRampSpec = {
      ...spec,
      x: { label: "Slots", min: 0, max: 20 },
      y: { label: "Price", min: 100, max: 100.1 },
    };
    const out = layoutPriceRamp(auto, opts);
    expect(out.x.ticks.map((t) => t.value)).toEqual([0, 5, 10, 15, 20]);
    expect(out.y.ticks.map((t) => t.label)).toEqual([
      "100.00",
      "100.02",
      "100.04",
      "100.06",
      "100.08",
      "100.10",
    ]);
  });

  it("puts every generated tick inside the axis range", () => {
    const out = layoutPriceRamp(
      {
        x: { label: "Slots", min: 3, max: 47 },
        y: { label: "Price", min: 100, max: 100.1 },
        segments: [{ from: { x: 3, y: 100 }, to: { x: 47, y: 100.1 } }],
      },
      opts,
    );
    for (const tick of out.x.ticks) {
      expect(tick.value).toBeGreaterThanOrEqual(3);
      expect(tick.value).toBeLessThanOrEqual(47);
      expect(tick.x1).toBeGreaterThanOrEqual(100);
      expect(tick.x1).toBeLessThanOrEqual(600);
    }
    expect(out.x.ticks.length).toBeGreaterThan(1);
  });

  it("is deterministic", () => {
    expect(layoutPriceRamp(spec, opts)).toEqual(layoutPriceRamp(spec, opts));
  });

  it("throws on a segment point outside the axis range", () => {
    const bad: PriceRampSpec = {
      ...spec,
      segments: [{ from: { x: 0, y: 100 }, to: { x: 25, y: 100.1 }, label: "Too long" }],
    };
    expect(() => layoutPriceRamp(bad, opts)).toThrow(/segment 0 \(Too long\) end: x=25 is outside the x range 0 to 20/);
  });

  it("throws on a price outside the axis range", () => {
    const bad: PriceRampSpec = { ...spec, references: [{ y: 99, label: "Below" }] };
    expect(() => layoutPriceRamp(bad, opts)).toThrow(/outside the y range/);
  });

  it("throws on a marker or span outside the axis range", () => {
    expect(() => layoutPriceRamp({ ...spec, markers: [{ x: 21, y: 100, label: "Late" }] }, opts)).toThrow(
      /marker 0 \(Late\)/,
    );
    expect(() => layoutPriceRamp({ ...spec, spans: [{ from: 10, to: 30, label: "Wide" }] }, opts)).toThrow(
      /span 0 \(Wide\) end/,
    );
  });

  it("throws on a span that ends before it starts", () => {
    expect(() => layoutPriceRamp({ ...spec, spans: [{ from: 10, to: 5, label: "Back" }] }, opts)).toThrow(
      /ends at or before it starts/,
    );
  });

  it("throws on an inverted axis and on no segments", () => {
    expect(() => layoutPriceRamp({ ...spec, x: { label: "Slots", min: 20, max: 0 } }, opts)).toThrow(
      /x axis max \(0\) must be greater than min \(20\)/,
    );
    expect(() => layoutPriceRamp({ ...spec, segments: [] }, opts)).toThrow(/at least one segment/);
  });

  it("throws when the margins leave no room to draw", () => {
    expect(() => layoutPriceRamp(spec, { ...opts, width: 150 })).toThrow(/no room to draw/);
  });
});

describe("layoutPriceRamp curves and guides", () => {
  const curveSpec: PriceRampSpec = {
    x: { label: "Base", min: 0, max: 10, ticks: [2, 5] },
    y: { label: "Quote", min: 0, max: 10, ticks: [2, 5] },
    curves: [{ points: [{ x: 1, y: 10 }, { x: 2, y: 5 }, { x: 5, y: 2 }, { x: 10, y: 1 }], label: "k = 10" }],
    markers: [{ x: 5, y: 2, label: "Bid", guides: true }, { x: 2, y: 5, label: "Ask" }],
  };

  it("draws a curve as one polyline through every point", () => {
    const [curve] = layoutPriceRamp(curveSpec, opts).curves;
    expect(curve.path).toBe("M 150 50 L 200 200 L 350 290 L 600 320");
    expect(curve.label).toBe("k = 10");
  });

  it("drops guides from a marker to both axes only when asked", () => {
    const [bid, ask] = layoutPriceRamp(curveSpec, opts).markers;
    expect(bid.guides).toEqual(["M 350 290 L 350 350", "M 350 290 L 100 290"]);
    expect(ask.guides).toEqual([]);
  });

  it("labels a marker above a falling curve", () => {
    const [bid] = layoutPriceRamp(curveSpec, opts).markers;
    expect(bid.labelY).toBeLessThan(bid.cy);
  });

  it("accepts a spec with curves and no segments, and rejects one with neither", () => {
    expect(() => layoutPriceRamp(curveSpec, opts)).not.toThrow();
    expect(() => layoutPriceRamp({ ...curveSpec, curves: [] }, opts)).toThrow(/segment or curve/);
  });

  it("rejects a curve point outside the range", () => {
    const bad = { ...curveSpec, curves: [{ points: [{ x: 1, y: 10 }, { x: 11, y: 1 }] }] };
    expect(() => layoutPriceRamp(bad, opts)).toThrow(/curve 0 point 1/);
  });
});
