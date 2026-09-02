// Generates one clean, plain-markdown mirror per included docs page under
// public/, following the llmstxt.org convention of serving `<route>.md`
// alongside the HTML page (e.g. /protocol/trading/margin -> public/protocol/
// trading/margin.md). llms.txt (scripts/generateLlmsTxt.mjs) links to these
// files.
//
// Route mapping and page inclusion (hidden/WIP pages, the legal-and-
// regulations tree) are identical to llms.txt - both come from
// scripts/lib/docsMeta.mjs, which is the single source of truth for that
// logic so the two outputs never diverge.
//
// The transform below turns MDX into plain markdown conservatively: code
// fences and inline code spans are stashed untouched before anything else
// runs (so nothing inside them - including a literal "import" in a sample -
// is ever touched), then imports/exports and JSX comments are dropped, a
// short list of known Nextra components is unwrapped into markdown, and any
// other JSX-looking tag (PascalCase, e.g. <SDKDoc>, <AssetWeightsTable />)
// is stripped while its children's text is left in place. Ordinary lowercase
// HTML tags (<table>, <img>, <a>, <br>, ...) are left alone since they are
// already valid to embed in markdown.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import {
  ROOT,
  isExcludedDir,
  isHidden,
  findMdxFiles,
  frontmatterTitle,
  stripFrontmatter,
  toRoute,
  loadSiteUrl,
} from "./lib/docsMeta.mjs";

const PUBLIC_DIR = path.join(ROOT, "public");
const siteUrl = loadSiteUrl();

// --- Stash fenced code blocks and inline code spans -------------------------
// Returns the text with each span replaced by a printable, collision-safe
// placeholder, plus the store to restore them from. Fences are stashed
// before inline spans so a fence's own backticks can't be mistaken for
// inline code. The sentinel is plain ASCII (not a NUL byte or other control
// character) so the generated script and its output stay ordinary text -
// a NUL byte makes git and other tooling treat the file as binary.
const STASH_SENTINEL = "MDSTASH-7f3a";

function stashCode(text) {
  const store = [];
  const stash = (s) => {
    const i = store.push(s) - 1;
    return `@@${STASH_SENTINEL}-${i}@@`;
  };
  let out = text.replace(/(```|~~~)[^\n]*\n[\s\S]*?\1/g, stash);
  out = out.replace(/`[^`\n]*`/g, stash);
  return { text: out, store };
}

function restoreCode(text, store) {
  const placeholder = new RegExp(`@@${STASH_SENTINEL}-(\\d+)@@`, "g");
  return text.replace(placeholder, (_, i) => store[Number(i)]);
}

// --- Unwrap known Nextra components into plain markdown ---------------------
// The bold type label goes on its own blockquote line, followed by a blank
// blockquote line, then the Callout's content lines each prefixed with
// "> " - with each line's own leading indentation and any heading markers
// left intact, so a heading or a nested sub-list inside a Callout survives
// instead of being glued onto the label or flattened to one level.
function transformCallout(text) {
  return text.replace(/<Callout([^>]*)>([\s\S]*?)<\/Callout>/g, (_, attrs, inner) => {
    const typeMatch = attrs.match(/type=["']?([\w-]+)["']?/);
    const type = typeMatch ? typeMatch[1] : "note";
    const label = type.charAt(0).toUpperCase() + type.slice(1);

    const rawLines = inner.replace(/^\n+/, "").replace(/\n+$/, "").split(/\r?\n/);
    if (rawLines.length === 0 || (rawLines.length === 1 && rawLines[0].trim() === "")) {
      return "";
    }

    const quoted = rawLines.map((l) => (l.trim() ? `> ${l}` : ">"));
    return `${[`> **${label}:**`, ">", ...quoted].join("\n")}\n`;
  });
}

function transformCards(text) {
  return text.replace(/<Cards>([\s\S]*?)<\/Cards>/g, (_, inner) => {
    const cardRe = /<Cards\.Card\b([^>]*)\/?>/g;
    const items = [];
    let m;
    while ((m = cardRe.exec(inner))) {
      const attrs = m[1];
      const titleMatch = attrs.match(/title=["']([^"']*)["']/);
      const hrefMatch = attrs.match(/href=["']([^"']*)["']/);
      if (titleMatch && hrefMatch) {
        items.push(`- [${titleMatch[1]}](${hrefMatch[1]})`);
      }
    }
    return items.length ? `${items.join("\n")}\n` : "";
  });
}

function transformTabs(text) {
  let out = text.replace(/<Tabs\.Tab\b([^>]*)>/g, (_, attrs) => {
    const titleMatch = attrs.match(/title=["']([^"']*)["']/);
    return titleMatch ? `\n**${titleMatch[1]}**\n\n` : "\n";
  });
  out = out.replace(/<\/Tabs\.Tab>/g, "");
  out = out.replace(/<Tabs\b[^>]*>/g, "");
  out = out.replace(/<\/Tabs>/g, "");
  return out;
}

function transformSteps(text) {
  return text.replace(/<\/?Steps\b[^>]*>/g, "");
}

function transformImages(text) {
  return text.replace(/<img\b([^>]*?)\/?>(\s*<\/img>)?/g, (_, attrs) => {
    const srcMatch = attrs.match(/src=["']([^"']*)["']/);
    const altMatch = attrs.match(/alt=["']([^"']*)["']/);
    if (!srcMatch) return "";
    return `![${altMatch ? altMatch[1] : ""}](${srcMatch[1]})`;
  });
}

// Any remaining PascalCase JSX tag (custom component) that survived the
// specific transforms above: strip the tag markup only, so whatever text
// sits between an opening and closing tag (e.g. a stashed code-fence
// placeholder) is left exactly where it was.
function stripUnknownComponents(text) {
  return text.replace(/<\/?[A-Z][A-Za-z0-9.]*(?:\s[^<>]*)?\/?>/g, "");
}

function dropImportsAndExports(text) {
  return text
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      return !(trimmed.startsWith("import ") || trimmed.startsWith("export "));
    })
    .join("\n");
}

function dropJsxComments(text) {
  return text.replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
}

function collapseBlankLines(text) {
  return text.replace(/\n{3,}/g, "\n\n");
}

function transformBody(rawBody) {
  const { text: stashed, store } = stashCode(rawBody);

  let out = stashed;
  out = dropJsxComments(out);
  out = dropImportsAndExports(out);
  out = transformCallout(out);
  out = transformCards(out);
  out = transformSteps(out);
  out = transformTabs(out);
  out = transformImages(out);
  out = stripUnknownComponents(out);
  out = collapseBlankLines(out);

  return restoreCode(out, store).trim();
}

// Insert the canonical-URL line right after the H1. Titles live in
// frontmatter now, so the H1 is synthesised from it when the body has none.
function withCanonical(body, route, title) {
  const lines = body.split(/\r?\n/);
  let h1Idx = lines.findIndex((l) => /^#\s+\S/.test(l));
  if (h1Idx === -1) {
    if (!title) return null;
    lines.unshift(`# ${title}`, "");
    h1Idx = 0;
  }

  const canonicalLine = `> Canonical: ${siteUrl}${route}`;
  const before = lines.slice(0, h1Idx + 1);
  const after = lines.slice(h1Idx + 1);
  // Skip a leading blank line in `after` so we don't end up with two blanks.
  while (after.length && after[0].trim() === "") after.shift();

  return [...before, "", canonicalLine, "", ...after].join("\n").trimEnd() + "\n";
}

// --- Main --------------------------------------------------------------------
const files = findMdxFiles().sort();
let emitted = 0;
let skippedNoH1 = 0;

for (const file of files) {
  const { relPath, route } = toRoute(file);

  if (isExcludedDir(relPath)) continue;
  if (isHidden(relPath)) continue;

  const raw = readFileSync(file, "utf8");
  const body = transformBody(stripFrontmatter(raw));
  const finalText = withCanonical(body, route, frontmatterTitle(raw));
  if (finalText === null) {
    skippedNoH1++;
    continue;
  }

  const outFile = path.join(PUBLIC_DIR, `${route}.md`);
  mkdirSync(path.dirname(outFile), { recursive: true });
  writeFileSync(outFile, finalText, "utf8");
  emitted++;
}

console.log(
  `markdown pages: wrote ${emitted} files under ${path.relative(ROOT, PUBLIC_DIR)}` +
    (skippedNoH1 ? ` (skipped ${skippedNoH1} page(s) with no H1)` : ""),
);
