/** Greedy word wrap, which is optimal for line count at a given width. */
export function wrapText(text: string, maxWidth: number, measure: (s: string) => number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];
  const lines: string[] = [];
  let line = words[0];
  for (const word of words.slice(1)) {
    const next = `${line} ${word}`;
    if (measure(next) <= maxWidth) line = next;
    else {
      lines.push(line);
      line = word;
    }
  }
  lines.push(line);
  return lines;
}
