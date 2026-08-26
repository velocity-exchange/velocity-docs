import type { Tone } from "./sankey";
import { wrapText } from "./text";

export type SequenceActor = {
  id: string;
  label: string;
  /** Secondary line under the actor name, e.g. "off-chain". */
  note?: string;
};

export type SequenceMessage = {
  kind: "message";
  from: string;
  to: string;
  label: string;
  /** Replies, async signals, and anything not a direct call. */
  dashed?: boolean;
  tone?: Tone;
};

/** A standalone row of prose. Centred on `actor` when given, on the figure when not. */
export type SequenceNote = { kind: "note"; actor?: string; label: string };

/** A labelled bracket around consecutive steps. Phases never nest. */
export type SequencePhase = { kind: "phase"; label: string; steps: SequenceInnerStep[] };

export type SequenceInnerStep = SequenceMessage | SequenceNote;
export type SequenceStep = SequenceInnerStep | SequencePhase;

export type SequenceSpec = { actors: SequenceActor[]; steps: SequenceStep[] };

/** Only the minimum width is given: the layout returns the width it actually needed. */
export type SequenceLayoutOptions = { width: number };

export type PlacedActor = SequenceActor & {
  /** Lifeline x, and the centre of the header box. */
  x: number;
  boxX: number;
  boxY: number;
  boxWidth: number;
  boxHeight: number;
  labelY: number;
  /** Baseline of the secondary line, absent when the actor has no note. */
  noteY?: number;
  lifelineY0: number;
  lifelineY1: number;
};

export type PlacedMessage = {
  kind: "message";
  /** Row order across the whole figure, phases included. Drives the draw-in stagger. */
  index: number;
  from: string;
  to: string;
  lines: string[];
  dashed: boolean;
  tone: Tone;
  /** Accessible text for the row's <title>. */
  title: string;
  direction: "right" | "left" | "self";
  path: string;
  x0: number;
  x1: number;
  /** Arrow baseline, or the top of the loop for a self message. */
  y: number;
  labelX: number;
  /** Baseline of the first label line. */
  labelY: number;
  labelAnchor: "middle" | "start" | "end";
};

export type PlacedNote = {
  kind: "note";
  index: number;
  lines: string[];
  x: number;
  y: number;
  width: number;
  height: number;
  textX: number;
  textY: number;
};

export type PlacedPhase = {
  label: string;
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  labelX: number;
  labelY: number;
};

export type PlacedRow = PlacedMessage | PlacedNote;

export type SequenceLayout = {
  width: number;
  height: number;
  actors: PlacedActor[];
  rows: PlacedRow[];
  phases: PlacedPhase[];
};

const FONT_LABEL = 13;
const FONT_NOTE = 12;
/** Leading for 13px label lines, and for 12px note lines. Renderers stack tspans on these. */
export const LABEL_LINE = 16;
export const NOTE_LINE = 15;

const HEADER_PAD_X = 14;
const HEADER_MIN_WIDTH = 92;
/** Clear space between two header boxes, so lanes read as separate. */
const HEADER_GAP = 20;
const HEADER_H = 34;
const HEADER_H_NOTE = 52;
/** Room between the header boxes and the first row. */
const LIFELINE_GAP = 18;
const FOOT = 10;

/** Clear space between a message label and the lifeline it stops at. */
const LABEL_PAD = 10;
/** Between the label block and the arrow it belongs to. */
const LABEL_GAP = 6;
const ROW_BOTTOM = 22;
/** Cap height offset for a 13px baseline sitting under a given top edge. */
const CAP = 12;

const LOOP_W = 30;
const LOOP_H = 28;
const LOOP_R = 6;
/** Gap either side of a self message's label: loop to label, label to neighbour. */
const SELF_PAD = 8;
const SELF_TOP = 10;
const SELF_BOTTOM = 18;

const NOTE_PAD_X = 12;
const NOTE_PAD_Y = 9;
const NOTE_MAX_WIDTH = 340;
const NOTE_ROW_GAP = 18;

const PHASE_PAD_TOP = 26;
const PHASE_PAD_BOTTOM = 14;
const PHASE_GAP = 10;
const PHASE_INSET_MAX = 48;
const EDGE_PAD = 4;

/** Message labels wrap to two lines; past that the layout widens the lanes instead. */
const MAX_LABEL_LINES = 2;

/**
 * Per-character advance in em, tuned for the body sans at 500 and the 12px
 * secondary text. Layout stays pure, so it cannot measure the real font: the
 * estimate runs a little wide, which errs towards more room, not less.
 */
function charEm(ch: string): number {
  if (ch === " ") return 0.28;
  if ("ijlItfr.,:;'!|()[]{}".includes(ch)) return 0.32;
  if ("mwMW%@".includes(ch)) return 0.92;
  if (ch >= "A" && ch <= "Z") return 0.66;
  if (ch >= "0" && ch <= "9") return 0.58;
  return 0.545;
}

export function estimateTextWidth(text: string, fontSize: number): number {
  let em = 0;
  for (const ch of text) em += charEm(ch);
  return em * fontSize;
}

/** The narrowest box the text fits in within MAX_LABEL_LINES lines. */
function labelBoxWidth(text: string, fontSize: number): number {
  const words = text.split(/\s+/).filter(Boolean);
  const full = estimateTextWidth(text, fontSize);
  if (words.length < 2) return full;
  let best = full;
  for (let k = 1; k < words.length; k++) {
    const head = estimateTextWidth(words.slice(0, k).join(" "), fontSize);
    const tail = estimateTextWidth(words.slice(k).join(" "), fontSize);
    best = Math.min(best, Math.max(head, tail));
  }
  return best;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function innerSteps(spec: SequenceSpec): SequenceInnerStep[] {
  return spec.steps.flatMap((s) => (s.kind === "phase" ? s.steps : [s]));
}

function validate(spec: SequenceSpec): Map<string, number> {
  if (spec.actors.length === 0) throw new Error("Sequence needs at least one actor");
  const index = new Map<string, number>();
  for (const [i, actor] of spec.actors.entries()) {
    if (!actor.id) throw new Error("Sequence actor needs an id");
    if (index.has(actor.id)) throw new Error(`Sequence has a duplicate actor id "${actor.id}"`);
    index.set(actor.id, i);
  }
  for (const step of spec.steps) {
    if (step.kind === "phase") {
      if (step.steps.length === 0) throw new Error(`Sequence phase "${step.label}" has no steps`);
      for (const inner of step.steps) {
        if ((inner as SequenceStep).kind === "phase") throw new Error(`Sequence phase "${step.label}" cannot contain another phase`);
      }
    }
  }
  for (const step of innerSteps(spec)) {
    if (step.kind === "message") {
      if (!index.has(step.from)) throw new Error(`Sequence message references unknown actor "${step.from}"`);
      if (!index.has(step.to)) throw new Error(`Sequence message references unknown actor "${step.to}"`);
    } else if (step.actor !== undefined && !index.has(step.actor)) {
      throw new Error(`Sequence note references unknown actor "${step.actor}"`);
    }
  }
  return index;
}

/**
 * Lanes are evenly pitched and the header boxes size to their own text, so the
 * pitch is whatever the widest thing on a lane needs: a header, a message label
 * across its span, or a self message's loop plus label.
 */
function requiredPitch(spec: SequenceSpec, index: Map<string, number>): number {
  const count = spec.actors.length;
  let pitch = 0;

  for (const actor of spec.actors) {
    pitch = Math.max(pitch, headerWidth(actor) + HEADER_GAP);
  }

  for (const step of innerSteps(spec)) {
    if (step.kind !== "message") continue;
    const from = index.get(step.from)!;
    const to = index.get(step.to)!;
    const box = labelBoxWidth(step.label, FONT_LABEL);
    if (from === to) {
      // The label sits beside the loop, in the gap to the next lifeline, or in
      // half a pitch of margin when the actor has no neighbour on that side.
      const lonely = count === 1;
      pitch = Math.max(pitch, (box + LOOP_W + SELF_PAD * 2) * (lonely ? 2 : 1));
    } else {
      pitch = Math.max(pitch, (box + LABEL_PAD * 2) / Math.abs(to - from));
    }
  }

  return pitch;
}

function headerWidth(actor: SequenceActor): number {
  const text = Math.max(estimateTextWidth(actor.label, FONT_LABEL), actor.note ? estimateTextWidth(actor.note, FONT_NOTE) : 0);
  return Math.max(HEADER_MIN_WIDTH, Math.ceil(text) + HEADER_PAD_X * 2);
}

/**
 * Pure layout: actors are lanes across the width, steps are rows down it.
 * `width` is a minimum, the returned width is what the labels actually needed.
 */
export function layoutSequence(spec: SequenceSpec, opts: SequenceLayoutOptions): SequenceLayout {
  const index = validate(spec);
  const count = spec.actors.length;

  const width = Math.round(Math.max(opts.width / count, requiredPitch(spec, index)) * count);
  const pitch = width / count;
  const centre = (i: number) => Math.round(pitch * (i + 0.5));

  const headerH = spec.actors.some((a) => a.note) ? HEADER_H_NOTE : HEADER_H;

  const rows: PlacedRow[] = [];
  const phases: PlacedPhase[] = [];
  const phaseInset = Math.min(pitch / 2 - EDGE_PAD, PHASE_INSET_MAX);
  const phaseX = centre(0) - phaseInset;
  const phaseWidth = centre(count - 1) + phaseInset - phaseX;

  let y = headerH + LIFELINE_GAP;

  for (const step of spec.steps) {
    if (step.kind !== "phase") {
      y = placeRow(step, y);
      continue;
    }
    const top = y + PHASE_GAP;
    y = top + PHASE_PAD_TOP;
    const firstIndex = rows.length;
    for (const inner of step.steps) y = placeRow(inner, y);
    y += PHASE_PAD_BOTTOM;
    phases.push({
      label: step.label,
      index: firstIndex,
      x: round(phaseX),
      y: round(top),
      width: round(phaseWidth),
      height: round(y - top),
      labelX: round(phaseX + NOTE_PAD_X),
      labelY: round(top + 18),
    });
    y += PHASE_GAP;
  }

  const height = Math.round(y + FOOT);
  const actors: PlacedActor[] = spec.actors.map((actor, i) => {
    const boxWidth = headerWidth(actor);
    const x = centre(i);
    return {
      ...actor,
      x,
      boxX: round(x - boxWidth / 2),
      boxY: 0,
      boxWidth,
      boxHeight: headerH,
      labelY: actor.note ? 21 : Math.round(headerH / 2) + 4,
      noteY: actor.note ? 38 : undefined,
      lifelineY0: headerH,
      lifelineY1: height - EDGE_PAD,
    };
  });

  return { width, height, actors, rows, phases };

  function placeRow(step: SequenceInnerStep, top: number): number {
    if (step.kind === "note") {
      const note = placeNote(step, top);
      rows.push(note);
      return top + note.height + NOTE_ROW_GAP;
    }
    const placed = placeMessage(step, top);
    rows.push(placed);
    return top + messageHeight(placed);
  }

  function placeNote(step: SequenceNote, top: number): PlacedNote {
    const maxWidth = Math.min(NOTE_MAX_WIDTH, width - EDGE_PAD * 2);
    const lines = wrapText(step.label, maxWidth - NOTE_PAD_X * 2, (t) => estimateTextWidth(t, FONT_NOTE));
    const textWidth = Math.max(...lines.map((l) => estimateTextWidth(l, FONT_NOTE)));
    const boxWidth = Math.min(maxWidth, Math.ceil(textWidth) + NOTE_PAD_X * 2);
    const boxHeight = lines.length * NOTE_LINE + NOTE_PAD_Y * 2;
    const anchor = step.actor ? centre(index.get(step.actor)!) : width / 2;
    const x = Math.min(Math.max(anchor - boxWidth / 2, EDGE_PAD), width - EDGE_PAD - boxWidth);
    return {
      kind: "note",
      index: rows.length,
      lines,
      x: round(x),
      y: round(top),
      width: round(boxWidth),
      height: round(boxHeight),
      textX: round(x + NOTE_PAD_X),
      textY: round(top + NOTE_PAD_Y + 11),
    };
  }

  function placeMessage(step: SequenceMessage, top: number): PlacedMessage {
    const from = index.get(step.from)!;
    const to = index.get(step.to)!;
    const tone = step.tone ?? "default";
    const dashed = step.dashed ?? false;
    const fromLabel = spec.actors[from].label;
    const toLabel = spec.actors[to].label;
    const common = { kind: "message" as const, index: rows.length, from: step.from, to: step.to, dashed, tone };

    if (from === to) {
      const side = from === count - 1 && count > 1 ? -1 : 1;
      const room = (count === 1 ? pitch / 2 : pitch) - LOOP_W - SELF_PAD * 2;
      const lines = wrapText(step.label, room, (t) => estimateTextWidth(t, FONT_LABEL)).slice(0, MAX_LABEL_LINES);
      const x = centre(from);
      const loopTop = top + SELF_TOP;
      return {
        ...common,
        lines,
        title: `${fromLabel} to itself: ${step.label}`,
        direction: "self",
        path: loopPath(x, loopTop, side),
        x0: x,
        x1: round(x + LOOP_W * side),
        y: round(loopTop),
        labelX: round(x + (LOOP_W + SELF_PAD) * side),
        labelY: round(loopTop + LOOP_H / 2 - ((lines.length - 1) * LABEL_LINE) / 2 + 4.5),
        labelAnchor: side === 1 ? "start" : "end",
      };
    }

    const x0 = centre(from);
    const x1 = centre(to);
    const room = Math.abs(x1 - x0) - LABEL_PAD * 2;
    const lines = wrapText(step.label, room, (t) => estimateTextWidth(t, FONT_LABEL)).slice(0, MAX_LABEL_LINES);
    const arrowY = round(top + lines.length * LABEL_LINE + LABEL_GAP);
    return {
      ...common,
      lines,
      title: `${fromLabel} to ${toLabel}: ${step.label}`,
      direction: to > from ? "right" : "left",
      path: `M ${x0} ${arrowY} H ${x1}`,
      x0,
      x1,
      y: arrowY,
      labelX: round((x0 + x1) / 2),
      labelY: round(top + CAP),
      labelAnchor: "middle",
    };
  }
}

function messageHeight(msg: PlacedMessage): number {
  if (msg.direction === "self") return Math.max(SELF_TOP + LOOP_H + SELF_BOTTOM, msg.lines.length * LABEL_LINE + SELF_TOP * 2);
  return msg.lines.length * LABEL_LINE + LABEL_GAP + ROW_BOTTOM;
}

/** Out from the lifeline, down, and back to it, with the arrow tip at the lifeline. */
function loopPath(x: number, top: number, side: number): string {
  const out = x + LOOP_W * side;
  const r = LOOP_R * side;
  const bottom = top + LOOP_H;
  return [
    `M ${x} ${top}`,
    `H ${round(out - r)}`,
    `Q ${out} ${top} ${out} ${top + LOOP_R}`,
    `V ${bottom - LOOP_R}`,
    `Q ${out} ${bottom} ${round(out - r)} ${bottom}`,
    `H ${round(x + side)}`,
  ].join(" ");
}
