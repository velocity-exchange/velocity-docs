"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import {
  LABEL_LINE,
  NOTE_LINE,
  layoutSequence,
  type PlacedActor,
  type PlacedMessage,
  type PlacedNote,
  type PlacedPhase,
  type SequenceSpec,
} from "./layout/sequence";
import type { Tone } from "./layout/sankey";

export type SequenceProps = {
  spec: SequenceSpec;
  /** Minimum drawn width. The figure grows to fill a wider container and scrolls below this. */
  width?: number;
  describedBy?: string;
  ariaLabel: string;
};

/** Rows past this share the last delay, so a long sequence still finishes promptly. */
const MAX_STAGGER_STEPS = 8;

export function Sequence({ spec, width: minWidth = 600, describedBy, ariaLabel }: SequenceProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [hostWidth, setHostWidth] = useState(0);
  const uid = useId().replace(/:/g, "");

  useLayoutEffect(() => {
    const el = hostRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => setHostWidth(Math.floor(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Server and first client render use the minimum; the observer widens it before paint.
  // The layout may return more than it was asked for when a label needs the room.
  const { width, height, actors, rows, phases } = layoutSequence(spec, { width: Math.max(minWidth, hostWidth) });
  const tones = new Set(rows.flatMap((r) => (r.kind === "message" ? [r.tone] : [])));

  return (
    <div ref={hostRef} className="dg-host">
      <svg
        className="dg-svg dg-sq"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={ariaLabel}
        aria-describedby={describedBy}
      >
        <defs>
          {[...tones].map((tone) => (
            <marker
              key={tone}
              id={arrowId(uid, tone)}
              markerWidth={8}
              markerHeight={6}
              refX={7.5}
              refY={3}
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path className="dg-sq-head" data-tone={tone} d="M 0 0 L 8 3 L 0 6 Z" />
            </marker>
          ))}
        </defs>
        <g>
          {actors.map((actor) => (
            <Actor key={actor.id} actor={actor} />
          ))}
        </g>
        <g>
          {phases.map((phase) => (
            <Phase key={`${phase.label}-${phase.index}`} phase={phase} />
          ))}
        </g>
        <g>
          {rows.map((row) =>
            row.kind === "message" ? (
              <Message key={row.index} message={row} uid={uid} />
            ) : (
              <Note key={row.index} note={row} />
            ),
          )}
        </g>
      </svg>
    </div>
  );
}

function arrowId(uid: string, tone: Tone) {
  return `${uid}-arrow-${tone}`;
}

/** Rows enter in order, so the reader's eye lands where the story starts. */
function step(index: number) {
  return { ["--dg-step" as string]: Math.min(index, MAX_STAGGER_STEPS) } as React.CSSProperties;
}

function Actor({ actor }: { actor: PlacedActor }) {
  return (
    <g className="dg-sq-actor">
      <line className="dg-sq-lifeline" x1={actor.x} y1={actor.lifelineY0} x2={actor.x} y2={actor.lifelineY1} />
      <rect
        className="dg-sq-actor-box"
        x={actor.boxX}
        y={actor.boxY}
        width={actor.boxWidth}
        height={actor.boxHeight}
      />
      <text className="dg-label" x={actor.x} y={actor.labelY} textAnchor="middle">
        {actor.label}
      </text>
      {actor.note ? (
        <text className="dg-note" x={actor.x} y={actor.noteY} textAnchor="middle">
          {actor.note}
        </text>
      ) : null}
    </g>
  );
}

function Message({ message, uid }: { message: PlacedMessage; uid: string }) {
  return (
    <g className="dg-sq-row" data-tone={message.tone} data-message={`${message.from}->${message.to}`} style={step(message.index)}>
      <title>{message.title}</title>
      <path
        className="dg-sq-line"
        d={message.path}
        data-dashed={message.dashed ? "" : undefined}
        markerEnd={`url(#${arrowId(uid, message.tone)})`}
      />
      <text className="dg-label" x={message.labelX} y={message.labelY} textAnchor={message.labelAnchor}>
        {message.lines.map((line, i) => (
          <tspan key={`${i}-${line}`} x={message.labelX} dy={i === 0 ? 0 : LABEL_LINE}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}

function Note({ note }: { note: PlacedNote }) {
  return (
    <g className="dg-sq-row" style={step(note.index)}>
      <rect className="dg-sq-note-box" x={note.x} y={note.y} width={note.width} height={note.height} />
      <text className="dg-note" x={note.textX} y={note.textY}>
        {note.lines.map((line, i) => (
          <tspan key={`${i}-${line}`} x={note.textX} dy={i === 0 ? 0 : NOTE_LINE}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}

function Phase({ phase }: { phase: PlacedPhase }) {
  return (
    <g className="dg-sq-phase" style={step(phase.index)}>
      <rect className="dg-sq-phase-box" x={phase.x} y={phase.y} width={phase.width} height={phase.height} />
      <text className="dg-note dg-sq-phase-label" x={phase.labelX} y={phase.labelY}>
        {phase.label}
      </text>
    </g>
  );
}
