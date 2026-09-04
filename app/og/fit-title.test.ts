import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  fitTitle,
  MAX_LINES,
  MAX_WIDTH,
  measure,
  SIZE_STEPS,
} from "./fit-title";

/**
 * The share banner draws the page title at a fixed left edge with the artwork
 * panel starting at x=716. The title does not clip, so a title too wide for the
 * space would spill across the artwork. Whether it fits is arithmetic, so it is
 * pinned here against every title the site actually ships.
 *
 * This runs over content/ rather than a fixed list, so adding a page with a
 * title that breaks the card fails the build instead of shipping a broken card.
 */

const CONTENT = join(process.cwd(), "content");

function mdxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return mdxFiles(path);
    return entry.endsWith(".mdx") || entry.endsWith(".md") ? [path] : [];
  });
}

function frontmatterTitle(path: string): string | undefined {
  const source = readFileSync(path, "utf8");
  const block = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source);
  if (!block) return undefined;
  const line = /^title:\s*(.+?)\s*$/m.exec(block[1]);
  if (!line) return undefined;
  const value = line[1].trim();
  const quoted =
    value.length >= 2 && value[0] === value.at(-1) && /["']/.test(value[0]);
  return quoted ? value.slice(1, -1) : value;
}

const titles = [
  ...new Set(
    mdxFiles(CONTENT)
      .map(frontmatterTitle)
      .filter((title): title is string => Boolean(title)),
  ),
].sort();

describe("every shipped doc title fits the banner", () => {
  it("finds the titles to check", () => {
    expect(titles.length).toBeGreaterThan(100);
  });

  it.each(titles)("%s", (title) => {
    const { fontSize, lines } = fitTitle(title);
    expect(SIZE_STEPS).toContain(fontSize);
    expect(lines.length).toBeLessThanOrEqual(MAX_LINES);
    for (const line of lines) {
      expect(measure(line, fontSize)).toBeLessThanOrEqual(MAX_WIDTH);
    }
    expect(lines.join(" ")).toBe(title.trim().replace(/\s+/g, " "));
  });
});

describe("the size ladder", () => {
  it("leaves a short title exactly where the Figma layer sits", () => {
    // 100px on one line is the current card. Anything else moves the baseline.
    for (const title of ["Introduction", "Overview", "Vaults", "Fees"]) {
      expect(fitTitle(title)).toEqual({ fontSize: 100, lines: [title] });
    }
  });

  it("steps down for a long single word rather than overflowing", () => {
    // 15 characters, so a character count would leave this at 100px, where it
    // measures 739px against the 640px it has.
    expect(measure("Troubleshooting", 100)).toBeGreaterThan(MAX_WIDTH);
    expect(fitTitle("Troubleshooting")).toEqual({
      fontSize: 76,
      lines: ["Troubleshooting"],
    });
  });

  it("uses the smallest step only for the longest titles", () => {
    const smallest = titles.filter(
      (title) => fitTitle(title).fontSize === SIZE_STEPS.at(-1),
    );
    expect(smallest).toEqual([
      "Collateral and margin requirements",
      "DLOB (Decentralized Limit Order Book)",
    ]);
  });

  it("keeps most of the site at full size", () => {
    const full = titles.filter((title) => fitTitle(title).fontSize === 100);
    expect(full.length / titles.length).toBeGreaterThan(0.75);
  });

  it("collapses whitespace so a stray newline cannot add a line", () => {
    expect(fitTitle("  Order   types  ")).toEqual({
      fontSize: 100,
      lines: ["Order types"],
    });
  });
});
