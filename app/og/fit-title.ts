/**
 * Title fitting for the docs share banner.
 *
 * The banner reproduces Figma frame 400:4647 of "Velocity Logo & Branding"
 * (Nehp9rbiJ5zEFjY78Z9VBr). Its title layer 400:4649 sits at x=60 with its
 * bottom edge at y=591, set in Cal Sans SemiBold 100px on a 110px line.
 *
 * A long title has to shrink and wrap, so the size is picked by measuring the
 * string rather than counting its characters. Counting characters gets this
 * wrong: "Troubleshooting" is only 15 characters and still needs 739px at
 * 100px, which would run into the artwork, while the 24-character "AI Agent
 * Migration Guide" fits on two lines at 100px with room to spare.
 *
 * ADVANCES is generated from app/og/CalSans-SemiBold.ttf. Regenerate it rather
 * than hand-editing it if the font file is ever replaced.
 */

/** The clear run from the title's left edge to the artwork panel at x=716. */
export const MAX_WIDTH = 640;

/** Cal Sans SemiBold advance widths for ASCII 32..126, in units per em. */
const UNITS_PER_EM = 1000;
const FIRST_CODE_POINT = 32;
const ADVANCES = [
  166, 236, 347, 718, 574, 700, 700, 174, 310, 309, 362, 595,
  243, 336, 243, 686, 642, 374, 550, 557, 612, 535, 551, 469,
  536, 551, 243, 243, 595, 595, 595, 498, 837, 667, 584, 678,
  692, 511, 507, 714, 684, 231, 394, 591, 484, 904, 729, 802,
  562, 796, 579, 561, 576, 662, 668, 1057, 619, 566, 602, 271,
  686, 271, 436, 534, 546, 520, 620, 529, 619, 579, 314, 611,
  568, 206, 206, 558, 207, 924, 570, 600, 622, 621, 334, 438,
  322, 560, 533, 794, 537, 531, 458, 377, 221, 377, 595,
];

/**
 * Anything outside ASCII falls back to the widest ASCII advance, so an unknown
 * character can only ever make the title measure wider and step the size down.
 * It cannot cause an overflow.
 */
const FALLBACK_ADVANCE = Math.max(...ADVANCES);

/** The three sizes the design steps through, largest first. */
export const SIZE_STEPS = [100, 76, 60];

/** Figma's 110px line on a 100px size. */
export const LINE_HEIGHT_RATIO = 1.1;

/** How many lines a title may wrap to before it steps down a size. */
export const MAX_LINES = 2;

/** Width of `text` in px when set in Cal Sans SemiBold at `fontSize`. */
export function measure(text: string, fontSize: number): number {
  let units = 0;
  for (const char of text) {
    const index = char.codePointAt(0)! - FIRST_CODE_POINT;
    const advance = ADVANCES[index];
    units += advance === undefined ? FALLBACK_ADVANCE : advance;
  }
  return (units / UNITS_PER_EM) * fontSize;
}

/** Break `text` on spaces into lines that each fit `maxWidth`. */
export function wrapTitle(
  text: string,
  fontSize: number,
  maxWidth: number = MAX_WIDTH,
): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const candidate = line ? `${line} ${word}` : word;
    if (!line || measure(candidate, fontSize) <= maxWidth) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Pick the largest size at which `text` fits in MAX_LINES lines, and return the
 * lines to draw. A title short enough for one line at 100px renders exactly
 * where the Figma layer sits, so the common card is unchanged.
 *
 * If a title will not fit even at the smallest step it keeps that step and
 * wraps to as many lines as it needs. The block grows upward from its fixed
 * bottom edge, and at 60px it would take six lines to reach the lockup, so
 * this degrades rather than colliding.
 */
export function fitTitle(text: string): { fontSize: number; lines: string[] } {
  const title = text.trim().replace(/\s+/g, " ");
  for (const fontSize of SIZE_STEPS) {
    const lines = wrapTitle(title, fontSize);
    const fits = lines.every((line) => measure(line, fontSize) <= MAX_WIDTH);
    if (lines.length <= MAX_LINES && fits) return { fontSize, lines };
  }
  const fontSize = SIZE_STEPS[SIZE_STEPS.length - 1];
  return { fontSize, lines: wrapTitle(title, fontSize) };
}
