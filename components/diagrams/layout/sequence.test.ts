import { describe, expect, it } from "vitest";
import { estimateTextWidth, layoutSequence, type PlacedMessage, type SequenceSpec } from "./sequence";

const spec: SequenceSpec = {
  actors: [
    { id: "taker", label: "Taker" },
    { id: "swift", label: "Swift", note: "off-chain" },
    { id: "maker", label: "Maker" },
    { id: "program", label: "Program" },
  ],
  steps: [
    { kind: "message", from: "taker", to: "swift", label: "signed order" },
    { kind: "note", actor: "swift", label: "The order is published to every maker at once." },
    {
      kind: "phase",
      label: "Auction",
      steps: [
        { kind: "message", from: "swift", to: "maker", label: "order event", dashed: true },
        { kind: "message", from: "maker", to: "maker", label: "quote" },
        { kind: "message", from: "maker", to: "program", label: "fill", tone: "signal" },
      ],
    },
    { kind: "message", from: "program", to: "taker", label: "settled", dashed: true },
  ],
};

const opts = { width: 600 };

function messages(rows: { kind: string }[]): PlacedMessage[] {
  return rows.filter((r): r is PlacedMessage => r.kind === "message");
}

describe("layoutSequence", () => {
  it("spreads actors evenly across the width", () => {
    const { actors, width } = layoutSequence(spec, opts);
    expect(actors.map((a) => a.id)).toEqual(["taker", "swift", "maker", "program"]);
    const xs = actors.map((a) => a.x);
    for (let i = 1; i < xs.length; i++) expect(xs[i]).toBeGreaterThan(xs[i - 1]);
    const gaps = xs.slice(1).map((x, i) => x - xs[i]);
    for (const gap of gaps) expect(gap).toBeCloseTo(gaps[0], 0);
    expect(xs[0]).toBeCloseTo(width - xs[xs.length - 1], 0);
  });

  it("sizes header boxes to their text and never lets two touch", () => {
    const { actors, width } = layoutSequence(spec, opts);
    for (const actor of actors) {
      expect(actor.boxWidth).toBeGreaterThanOrEqual(estimateTextWidth(actor.label, 13));
      expect(actor.boxX).toBeGreaterThanOrEqual(0);
      expect(actor.boxX + actor.boxWidth).toBeLessThanOrEqual(width);
    }
    for (let i = 1; i < actors.length; i++) {
      expect(actors[i].boxX).toBeGreaterThan(actors[i - 1].boxX + actors[i - 1].boxWidth);
    }
  });

  it("gives actors with a note a taller header and a second baseline", () => {
    const { actors } = layoutSequence(spec, opts);
    expect(actors.every((a) => a.boxHeight === actors[0].boxHeight)).toBe(true);
    expect(actors[1].noteY).toBeGreaterThan(actors[1].labelY);
    expect(actors[0].noteY).toBeUndefined();
  });

  it("runs lifelines from the header to the bottom of the figure", () => {
    const { actors, height } = layoutSequence(spec, opts);
    for (const actor of actors) {
      expect(actor.lifelineY0).toBe(actor.boxHeight);
      expect(actor.lifelineY1).toBeLessThan(height);
      expect(actor.lifelineY1).toBeGreaterThan(actor.lifelineY0);
    }
  });

  it("orders rows down the page and indexes them in spec order", () => {
    const { rows, height } = layoutSequence(spec, opts);
    expect(rows.map((r) => r.index)).toEqual([0, 1, 2, 3, 4, 5]);
    const tops = rows.map((r) => (r.kind === "message" ? r.y : r.y));
    for (let i = 1; i < tops.length; i++) expect(tops[i]).toBeGreaterThan(tops[i - 1]);
    expect(tops[tops.length - 1]).toBeLessThan(height);
  });

  it("points each message at its target and titles it for screen readers", () => {
    const { actors, rows } = layoutSequence(spec, opts);
    const x = Object.fromEntries(actors.map((a) => [a.id, a.x]));
    const [first, , , fill, settled] = messages(rows);
    expect(first.direction).toBe("right");
    expect(first.x0).toBe(x.taker);
    expect(first.x1).toBe(x.swift);
    expect(first.title).toBe("Taker to Swift: signed order");
    expect(fill.tone).toBe("signal");
    expect(settled.direction).toBe("left");
    expect(settled.dashed).toBe(true);
    expect(settled.x0).toBeGreaterThan(settled.x1);
    for (const message of messages(rows)) expect(message.path.startsWith("M ")).toBe(true);
  });

  it("centres a message label above its arrow, inside the lanes it spans", () => {
    const { rows } = layoutSequence(spec, opts);
    for (const message of messages(rows)) {
      if (message.direction === "self") continue;
      expect(message.labelAnchor).toBe("middle");
      expect(message.labelX).toBeCloseTo((message.x0 + message.x1) / 2, 0);
      expect(message.labelY).toBeLessThan(message.y);
      expect(message.lines.length).toBeLessThanOrEqual(2);
      const widest = Math.max(...message.lines.map((l) => estimateTextWidth(l, 13)));
      expect(widest).toBeLessThanOrEqual(Math.abs(message.x1 - message.x0) - 20);
    }
  });

  it("draws a self message as a loop beside its own lifeline", () => {
    const { rows } = layoutSequence(spec, opts);
    const self = messages(rows).find((m) => m.direction === "self")!;
    expect(self.from).toBe(self.to);
    expect(self.x1).toBeGreaterThan(self.x0);
    expect(self.labelAnchor).toBe("start");
    expect(self.labelX).toBeGreaterThan(self.x1);
    expect(self.title).toBe("Maker to itself: quote");
  });

  it("mirrors a self message on the last actor so it stays inside the figure", () => {
    const { rows, width } = layoutSequence(
      { actors: spec.actors, steps: [{ kind: "message", from: "program", to: "program", label: "settle" }] },
      opts,
    );
    const self = messages(rows)[0];
    expect(self.x1).toBeLessThan(self.x0);
    expect(self.labelAnchor).toBe("end");
    expect(self.labelX).toBeLessThan(self.x1);
    expect(self.labelX).toBeLessThan(width);
  });

  it("brackets a phase around exactly its own steps", () => {
    const { rows, phases } = layoutSequence(spec, opts);
    expect(phases).toHaveLength(1);
    const [phase] = phases;
    expect(phase.label).toBe("Auction");
    expect(phase.index).toBe(2);
    const inside = rows.slice(2, 5);
    const outside = [rows[1], rows[5]];
    for (const row of inside) {
      expect(row.y).toBeGreaterThan(phase.y);
      expect(row.y).toBeLessThan(phase.y + phase.height);
    }
    for (const row of outside) {
      expect(row.y > phase.y && row.y < phase.y + phase.height).toBe(false);
    }
    expect(phase.labelY).toBeGreaterThan(phase.y);
    expect(phase.labelY).toBeLessThan(rows[2].y);
  });

  it("keeps note boxes inside the figure", () => {
    const { rows, width } = layoutSequence(spec, opts);
    const note = rows.find((r) => r.kind === "note")!;
    expect(note.kind).toBe("note");
    if (note.kind !== "note") return;
    expect(note.x).toBeGreaterThanOrEqual(0);
    expect(note.x + note.width).toBeLessThanOrEqual(width);
    expect(note.textY).toBeGreaterThan(note.y);
    expect(note.textY).toBeLessThan(note.y + note.height);
    expect(note.lines.join(" ")).toBe("The order is published to every maker at once.");
  });

  it("widens the figure when a label cannot fit the requested width", () => {
    const wordy: SequenceSpec = {
      actors: spec.actors,
      steps: [{ kind: "message", from: "taker", to: "swift", label: "cancel and replace the resting maker order immediately" }],
    };
    const { width, rows } = layoutSequence(wordy, opts);
    expect(width).toBeGreaterThan(600);
    expect(messages(rows)[0].lines).toHaveLength(2);
  });

  it("holds the requested width when nothing needs more room", () => {
    const { width } = layoutSequence(spec, opts);
    expect(width).toBe(600);
  });

  it("fits five actors at the minimum width", () => {
    const five: SequenceSpec = {
      actors: [
        { id: "taker", label: "Taker" },
        { id: "swift", label: "Swift" },
        { id: "maker", label: "Maker" },
        { id: "keeper", label: "Keeper" },
        { id: "program", label: "Program" },
      ],
      steps: [{ kind: "message", from: "taker", to: "program", label: "place order" }],
    };
    const { width, actors, rows } = layoutSequence(five, opts);
    expect(width).toBe(600);
    for (let i = 1; i < actors.length; i++) {
      expect(actors[i].boxX).toBeGreaterThan(actors[i - 1].boxX + actors[i - 1].boxWidth);
    }
    expect(messages(rows)[0].lines).toEqual(["place order"]);
  });

  it("is deterministic", () => {
    expect(layoutSequence(spec, opts)).toEqual(layoutSequence(spec, opts));
  });

  it("rejects a spec it cannot draw", () => {
    expect(() => layoutSequence({ actors: [], steps: [] }, opts)).toThrow(/at least one actor/i);
    expect(() =>
      layoutSequence({ actors: [{ id: "a", label: "A" }, { id: "a", label: "A again" }], steps: [] }, opts),
    ).toThrow(/duplicate actor id/i);
    expect(() =>
      layoutSequence({ ...spec, steps: [{ kind: "message", from: "taker", to: "nope", label: "x" }] }, opts),
    ).toThrow(/unknown actor "nope"/);
    expect(() => layoutSequence({ ...spec, steps: [{ kind: "note", actor: "nope", label: "x" }] }, opts)).toThrow(
      /unknown actor "nope"/,
    );
    expect(() => layoutSequence({ ...spec, steps: [{ kind: "phase", label: "Empty", steps: [] }] }, opts)).toThrow(
      /has no steps/i,
    );
  });
});
