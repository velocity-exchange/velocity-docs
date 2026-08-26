---
name: Velocity Exchange Docs
description: On-chain, cross-margined perpetual futures docs — a quiet, technical shell where one signal green is the only color that ever speaks.
colors:
  velocity-green: "oklch(0.560 0.170 148)"
  velocity-green-dark: "oklch(0.740 0.170 146)"
  velocity-green-hover: "oklch(0.44 0.145 150)"
  info-blue: "oklch(0.520 0.170 252)"
  warn-amber: "oklch(0.585 0.135 68)"
  danger-red: "oklch(0.540 0.200 27)"
  ink: "oklch(0.180 0.013 150)"
  ink-dark: "oklch(1 0 150)"
  gray-50: "oklch(0.972 0.006 150)"
  gray-200: "oklch(0.918 0.010 150)"
  gray-400: "oklch(0.660 0.016 150)"
  gray-600: "oklch(0.420 0.018 150)"
  surface-light: "#F2F6F3"
  surface-dark: "#060907"
typography:
  title:
    fontFamily: "inherit (nextra-theme-docs default sans)"
    fontSize: "clamp(1.5rem, 7vw, 2rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  body:
    fontFamily: "inherit (nextra-theme-docs default sans)"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    letterSpacing: "0.02em"
rounded:
  sm: "3px"
  md: "8px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.velocity-green}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "0 1.25rem"
    height: "2.875rem"
  button-primary-hover:
    backgroundColor: "{colors.velocity-green-hover}"
  callout-important:
    backgroundColor: "{colors.velocity-green}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
---

# Design System: Velocity Exchange Docs

## 1. Overview

**Creative North Star: "The Signal Green"**

The docs are a near-monochrome technical surface — a light near-white or near-black neutral, tinted a whisper toward the brand's own green hue so it never reads as generic gray. Against that quiet field, exactly one color is allowed to mean something: Velocity Green. It marks the logo, the primary action, the active nav tab, and the "important" callout — the four places a reader needs a signal, not decoration. Everything else (body copy, borders, table rows) stays in ink and neutral so the green never competes with itself.

This system explicitly rejects hype-driven marketing chrome: no gradients, no countdown timers, no glassmorphism, no oversized hero stats. Even the 404 page — the one screen designed to soften a dead end — uses a single icon, one sentence, and one button, not a campaign moment. The docs are a tool; every screen inside them, including edge cases, should feel like part of that tool.

**Key Characteristics:**
- One accent color (Velocity Green) carries all signal; neutrals carry everything else.
- Callouts use accent-as-border-and-icon, not accent-as-background-wash, so body text always clears AA.
- Flat by default — the only shadow in the system is a soft green glow under the mark icon on empty-state screens.
- Motion is a rise-and-fade on load, staggered by ~60ms per element, never more.

## 2. Colors

Two tinted neutrals (light near-white, dark near-black) carry the surface; one green plus three semantic hues carry every signal in the system.

### Primary
- **Velocity Green** (`oklch(0.560 0.170 148)` light / `oklch(0.740 0.170 146)` dark, ≈`#08AA18` in the logo mark): the brand mark, the primary button, the active nav tab underline, the "important" callout accent, and body links. This is the only color a reader should ever associate with "click me" or "this matters."
- **Velocity Green — hover** (`oklch(0.44 0.145 150)`): darkens on press/hover for the primary button; the dark theme's hover state instead brightens via `--vlc-action` staying fixed against the near-black surface.

### Secondary (semantic callouts only)
- **Info Blue** (`oklch(0.520 0.170 252)` light / `oklch(0.740 0.140 252)` dark): informational callouts only.
- **Warn Amber** (`oklch(0.585 0.135 68)` light / `oklch(0.800 0.130 78)` dark): warning callouts only.
- **Danger Red** (`oklch(0.540 0.200 27)` light / `oklch(0.700 0.180 27)` dark): error callouts only.

### Neutral
- **Ink** (`oklch(0.180 0.013 150)` light / `oklch(1 0 150)` dark): primary body text, headings.
- **Gray-600** (`oklch(0.420 0.018 150)` light / `oklch(0.955 0.006 150)` dark): secondary text, captions, muted labels — chosen specifically because it still clears AA on the surface, unlike a lighter gray-400.
- **Gray-400 / Gray-200 / Gray-50**: borders, dividers, table striping, disabled states — decreasing in visual weight in that order.
- **Surface** (`#F2F6F3` light / `#060907` dark): the page background itself, tinted a hair toward the brand's green hue rather than a neutral gray or warm cream.

### Named Rules
**The One Signal Rule.** Velocity Green appears in exactly one semantic role per screen: the thing the reader should act on. It is never used decoratively (no green section dividers, no green background washes on cards) — if green shows up, it means "click" or "this is the important one."

**The Ink-Not-Wash Rule.** Callout body copy is always set in ink, never in the accent hue. The accent carries the border and the leading icon only; this is why every callout clears WCAG AA even at 12% tint.

## 3. Typography

**Body Font:** inherited from `nextra-theme-docs`'s default sans stack — this project does not override it with a custom `next/font` declaration.
**Label/Mono Font:** `ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace` — used for error codes, technical captions, and any inline code.

**Character:** Restrained and technical. Weight and size carry hierarchy, not color or decoration; the only intentional flourish is `letter-spacing: -0.02em` on titles to keep large text from feeling loose.

### Hierarchy
- **Title** (700, `clamp(1.5rem, 7vw, 2rem)`, line-height 1.15, letter-spacing -0.02em): page-level headings and dead-end/empty-state titles. Uses `text-wrap: balance` so it never breaks into a lonely orphan word.
- **Body** (400, 1rem, line-height 1.6): all prose copy. Capped near 30rem/65-75ch measure, uses `text-wrap: pretty`.
- **Label** (400, 0.8125rem, letter-spacing 0.02em, mono): error codes, small captions under a heading.

### Named Rules
**The No-Overflow Rule.** Any large clamp-scaled heading must be tested against its actual copy at the narrowest supported width; if it overflows, shrink the clamp max before rewriting the copy.

## 4. Elevation

Flat by default — surfaces have no resting shadow, no elevated card layers. Depth is conveyed through `color-mix` tonal layering (a callout's background is a percentage mix of its accent into the page background, not a separate elevated surface) rather than shadows. The one exception is a soft ambient glow used purely on empty-state icon marks (404, and now the coming-soon gate) to give the mark presence without introducing a full elevation system.

### Shadow Vocabulary
- **mark-glow** (`filter: drop-shadow(0 6px 20px color-mix(in oklab, #08AA18 35%, transparent))`): reserved for the single centered brand mark icon on dead-end/empty-state screens. Not used on buttons, cards, or nav.

### Named Rules
**The Flat-by-Default Rule.** Nothing gets a shadow just because it's a container. Shadows are earned by exactly one component role (the empty-state mark), never applied broadly for "depth."

## 5. Components

### Buttons
- **Shape:** rounded, 8px radius, 2.875rem fixed height.
- **Primary:** `background: var(--vlc-action)` (Velocity Green), white text, `padding-inline: 1.25rem`, 600 weight, 0.9375rem size.
- **Hover / Focus:** background shifts to `--vlc-action-hover` on hover; `transform: translateY(1px)` on active (a tactile press, not a lift); `outline: 2px solid var(--vlc-action)` with 2px offset on focus-visible.
- **Icon buttons:** an inline SVG arrow that nudges `translateX(-3px)` on hover — motion reinforces direction (back / forward), not decoration.

### Callouts
- **Style:** background is `color-mix(in oklab, accent 12% light / 20% dark, page-bg)`; border is `color-mix(in oklab, accent 60%, transparent)`; body copy stays ink.
- **Variant mapping:** Nextra's purple → Velocity Green ("important"), blue → Info Blue, yellow → Warn Amber, red → Danger Red.
- **Icon:** the leading icon is the only element allowed the full accent hue.

### Tables
- **Corner Style:** 8px radius on the header row's first/last cell only.
- **Header:** `background: color-mix(in oklab, gray-600 10%, transparent)`.
- **Rows:** transparent background, 1px bottom border at `color-mix(in oklab, gray-600 10%, transparent)`, no border on the last row.

### Empty-state / dead-end screens (signature pattern)
Centered column, max-width 34rem: brand mark (with mark-glow) → mono label (error code or status) → title → body copy → primary action → secondary text links separated by a middot. Every element uses a staggered rise-and-fade entrance (`translateY(10px)→0`, opacity 0→1, ~60ms stagger, `cubic-bezier(0.22, 1, 0.36, 1)`), fully visible by default and skipped entirely under `prefers-reduced-motion: reduce`. This is the pattern to reuse for the coming-soon gate rather than inventing a new layout.

## 6. Do's and Don'ts

### Do:
- **Do** keep Velocity Green to one semantic role per screen — the primary action or the one thing that matters.
- **Do** set callout and empty-state body copy in ink, never in the accent hue.
- **Do** reuse the empty-state pattern (mark → label → title → body → one action → secondary links) for the coming-soon gate.
- **Do** gate every animation behind `prefers-reduced-motion: no-preference`, with a fully-visible default state.

### Don't:
- **Don't** use marketing-campaign styling — no gradients, no countdown timers, no hero stat rows, no email-capture forms — per PRODUCT.md's anti-references.
- **Don't** use `background-clip: text` gradient headlines; emphasis comes from weight and size only.
- **Don't** apply glassmorphism or decorative blur; the system is flat by design.
- **Don't** introduce a second accent color for "variety" — every non-green hue in this system is semantic (info/warn/danger) and callout-only.
- **Don't** let large clamp-scaled titles overflow on narrow viewports; test the actual copy at the smallest supported width.

## 7. Diagrams

Diagrams are part of the docs' tool-like register: quiet, flat, and legible, drawn from
the same tokens as the rest of the page. They live in `components/diagrams` and are
authored as data specs, never as hand-drawn SVG.

### Tokens
- Ink and labels: `--dg-ink` (gray-900), `--dg-muted` (gray-600, values and captions).
- Structure: `--dg-rule` (gray-600 at 18%), `--dg-node` (gray-600 at 12%), the same tonal card as tables.
- Flows: `--dg-flow` (gray-400 at 55%), `--dg-flow-out` (gray-400 at 30%, value leaving the system), `--dg-flow-signal` (Velocity Green at 55%).
- Type: labels in the body sans at 13px/500; values in the mono label stack at 12px.
- Motion: `--dg-ease` (`cubic-bezier(0.22, 1, 0.36, 1)`), `--dg-draw` 900ms, `--dg-stagger` 120ms per column.

### Named Rules
**The One Signal Leg Rule.** A diagram may color at most one flow in Velocity Green: the leg the reader is meant to follow. Everything else is neutral. Info, warn, and danger hues never appear in diagrams; they stay callout-only.

**The Caption Is the Contract.** Every diagram carries a caption that states what is shown, where the numbers come from, and every simplifying assumption (midpoints for ranges, target versus live values). A diagram without that caption is not finished.

**Drawn by Default.** Diagrams render fully drawn with no JavaScript and under reduced motion. The single allowed animation is a one-time draw-in when the figure scrolls into view, staggered by column, using the same ease and rise-and-fade as the rest of the site.

**Scroll, Don't Shrink.** Below about 560px the figure scrolls horizontally rather than scaling text below legibility.
