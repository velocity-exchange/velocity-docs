---
name: docs-diagram
description: Add or edit an explanatory diagram (Sankey flow, later other types) in velocity-docs using the shared diagram system in components/diagrams. Use when a docs page explains a flow, split, or sequence that prose struggles to hold, or when asked for a diagram, chart, figure, or visual in the docs.
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
- Every link needs a `label`; it becomes the accessible `<title>`.

## Caption rules

Add a caption whenever the diagram carries an assumption the surrounding prose does not (target versus live values, midpoints for ranges, a data source). When present it must say: what is shown, the data source and date, and
every assumption (midpoints, target vs live values). Plain language, no em dashes.

## Color and motion rules

Gray tokens only, plus `--vlc-brand` for the single signal leg. Never info/warn/danger
hues, gradients, or shadows. Motion is the built-in draw-in; do not add more. Default
state is fully drawn; reduced-motion users never see animation.

## Finish checklist

1. `pnpm test` passes (add a layout test if you changed layout code).
2. `pnpm build` passes.
3. Check the page in light and dark, at 1280px and 375px, and with
   `prefers-reduced-motion: reduce`.
4. Run `node ~/.claude/skills/impeccable/scripts/detect.mjs --json components/diagrams`
   and fix findings.
