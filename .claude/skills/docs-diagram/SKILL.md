---
name: docs-diagram
description: Add or edit an explanatory diagram (Sankey, flowchart, sequence, price ramp) in velocity-docs using the shared diagram system in components/diagrams. Use when a docs page explains a flow, split, or sequence that prose struggles to hold, or when asked for a diagram, chart, figure, or visual in the docs.
---

# Docs diagrams

Diagrams in these docs are data specs rendered by shared primitives. You write a spec
and place a figure component in MDX. You do not write SVG, pick colors, or add libraries.

## When a diagram earns its place

Yes: a flow of value or messages (Sankey, sequence), a split with proportions, a
lifecycle with states. No: anything a table or a short list holds as well. One
diagram per concept; the prose stays the source of truth and the diagram is the picture.

## Files

- Tokens and styles: `components/diagrams/tokens.css` (do not add colors here without
  updating DESIGN.md section 7).
- Frame: `components/diagrams/Diagram.tsx` (`title?`, `caption?`, render-prop children).
- Renderers: `components/diagrams/Sankey.tsx` (props: `spec`, `ariaLabel`, `describedBy`, `width`, `height`, `labelWidth`). `width` is the minimum drawn width: the figure fills a wider container at the same label size and scrolls below it. `labelWidth` is the room reserved outside the first and last columns: one number for both sides, or `{ left, right }` when the two sides need different room.
- Layout: `components/diagrams/layout/sankey.ts` (`SankeySpec`, `layoutSankey`). Pure; tested in `sankey.test.ts`.
- Other renderers, each a pure tested layout in `components/diagrams/layout/<type>.ts` plus a renderer and its own `<type>.css` (imported in `app/layout.tsx`):
  `Flowchart.tsx` (`spec`, `ariaLabel`, `describedBy`, `width`, `height`), `Sequence.tsx` (`spec`, `ariaLabel`, `describedBy`, `width`), `PriceRamp.tsx` (`spec`, `ariaLabel`, `describedBy`, `width`, `height`, `margin`). `width` is always the minimum drawn width: the figure fills a wider container and the frame scrolls below it.
- Figures: `components/diagrams/figures/<name>.data.ts` (the spec) + `<Name>.tsx` (composes Diagram + renderer).
- Registration: add the figure to `mdx-components.tsx`, then use `<Name />` in MDX.

## Writing a Sankey spec

```ts
import type { SankeySpec } from "../layout/sankey";
export const spec: SankeySpec = {
  nodes: [{ id, label, column, value?, note?, tone?, labelSide? }],
  links: [{ from, to, value, label?, tone? }],
};
```

- `column` is fixed: 0 is the source, increasing left to right. Vertical order is spec order.
- `value` on links is the flow size (use consistent units, usually % of the source).
- `tone`: `default` (neutral), `out` (leaves the system: rebates, rewards), `signal`
  (the one leg that matters, green). At most one `signal` per diagram.
- `labelSide` (`left` | `right` | `above` | `below`) overrides where a label sits; the default
  is outside for the first and last columns and above for the middle ones. Reach for it when
  the default side is not clear, typically a pass-through middle node whose own ribbons rise
  through the space above it, which wants `below`.
- Ranges: draw the midpoint, put the range in `value` ("2–10%"), and explain in the caption.
- Every link needs a `label`; it becomes the hover `<title>` (the figure itself is named by `ariaLabel` and described by the caption).

## Writing a Flowchart spec

```ts
import type { FlowchartSpec } from "../layout/flowchart";
export const spec: FlowchartSpec = {
  nodes: [{ id, label, col, row, kind?, note?, tone? }],
  edges: [{ from, to, label?, tone?, side? }],
};
```

- The grid is authored, never solved: `col` is the lane (left to right) and `row` is the
  step (top to bottom). Flow reads downward. Skipping a column leaves an empty lane, so
  gaps are a placement tool.
- Two nodes may not share a cell, and an unknown id, a self edge, or a fractional
  `col`/`row` throws at layout time.
- `kind`: `step` (default, the tonal card), `decision` (same card, heavier outline), and
  `terminal` (the card drawn as a pill, for the entry and exit of the flow). Decisions are
  boxes, not diamonds: a diamond fits about half the text of its bounding box.
- `tone`: `default`, `out` (leaves the flow: a rejection, a dead end), `signal` (the one
  path the reader should follow, green). At most one `signal` run per diagram.
- Nodes size themselves to their label and wrap it, then every node in a lane widens to
  the widest in that lane. Keep labels to a short phrase and put the qualifier in `note`.
- Connectors are orthogonal and land on box edges. Set `side` (`top` | `right` | `bottom`
  | `left`) only when the default route would cross a box.
- Label the branches out of every decision ("yes", "no"). An edge label becomes the
  hover `<title>`; keep labels to a word or three.

## Writing a Sequence spec

```ts
import type { SequenceSpec } from "../layout/sequence";
export const spec: SequenceSpec = {
  actors: [{ id, label, note? }],
  steps: [
    { kind: "message", from, to, label, dashed?, tone? },
    { kind: "note", actor?, label },
    { kind: "phase", label, steps: [...] },
  ],
};
```

- `actors` are lanes left to right, in spec order, each with a header box and a lifeline.
  `note` is the 12px second line, e.g. "off-chain".
- `steps` run top to bottom. `from === to` draws a small self loop.
- `dashed` is for replies, events, and anything asynchronous. `tone` as above; at most one
  `signal` per diagram.
- `note` is a standalone box of prose for the thing the arrows cannot say.
- `phase` brackets consecutive steps under a label ("Auction window"). Phases never nest.
- Message labels sit above the arrow and wrap to two lines. Keep them to two or three words;
  longer labels widen the whole figure. Five actors fit the 600px minimum.
- Every message needs a `label`; it becomes the hover `<title>`.

## Writing a PriceRamp spec

```ts
import type { PriceRampSpec } from "../layout/price-ramp";
export const spec: PriceRampSpec = {
  x: { label, min, max, ticks? },
  y: { label, min, max, ticks? },
  segments: [{ from: { x, y }, to: { x, y }, label?, dashed?, tone? }],
  references?: [{ y, label, dashed? }],
  spans?: [{ from, to, label }],
  markers?: [{ x, y, label, tone?, place? }],
};
```

- Price over slots, drawn as straight segments. Both ranges are authored; anything outside
  `min`/`max` throws rather than silently rescaling.
- `ticks` default to about four round numbers per axis. Author them as numbers or as
  `{ at, label }` to name a slot ("Placed", "Expiry").
- `segments`: the ramp. `dashed` for a continuation past the auction, `tone: "out"` for a leg
  that is no longer the auction, `tone: "signal"` for the one line to follow. A segment's
  `label` is its hover `<title>`, not drawn.
- `references` are horizontal price lines (oracle, limit), labelled outside the plot on the
  right; widen `margin.right` for long labels. `spans` shade an x range. `markers` sit on the
  line; `place` (`above` | `below`) overrides the label side on collision.
- Slot counts are wall-clock only at today's slot time. State that in the caption and link
  `/developers/concepts/slot-duration` in the prose.

## Caption rules

Add a caption whenever the diagram carries an assumption the surrounding prose does not (target versus live values, midpoints for ranges, a data source). When present it must say: what is shown, the data source and date, and
every assumption (midpoints, target vs live values). Plain language, no em dashes.

## Color and motion rules

Gray tokens only, plus `--vlc-brand` for the single signal leg. Never info/warn/danger
hues, gradients, or shadows. Motion is the built-in draw-in; do not add more. Default
state is fully drawn; reduced-motion users never see animation.

## Finish checklist

1. `bun run test` passes (add a layout test if you changed layout code).
2. `bun run build` passes.
3. Check the page in light and dark, at 1280px and 375px, and with
   `prefers-reduced-motion: reduce`.
4. Run `node ~/.claude/skills/impeccable/scripts/detect.mjs --json components/diagrams`
   and fix findings.
