// Generates public/llms.txt following the llmstxt.org convention:
// H1 site name, a blockquote summary, then H2 sections listing pages as
// markdown links with one-line descriptions.
//
// Source of truth for page titles/descriptions is the actual .mdx content
// (first H1 + first paragraph). Source of truth for grouping/section titles
// and for excluding hidden/WIP pages is app/_meta.global.tsx (the sidebar).
// Legal/regulatory content is excluded on purpose (out of scope for an
// LLM-facing index).

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CONTENT_DIR = path.join(ROOT, "content");
const META_FILE = path.join(ROOT, "app", "_meta.global.tsx");
const OUT_FILE = path.join(ROOT, "public", "llms.txt");

const SITE_NAME = "Velocity Protocol";
const SITE_SUMMARY =
  "Velocity is a decentralized, cross-margined perpetuals and spot trading protocol on Solana. These docs cover how to use the protocol, how it works under the hood, and how to build on it.";

// Directories excluded outright, regardless of what the sidebar says.
const EXCLUDED_DIRS = new Set(["protocol/legal-and-regulations"]);

let siteUrl = "https://docs.velocity.exchange";
try {
  const sitemapConfig = readFileSync(
    path.join(ROOT, "next-sitemap.config.js"),
    "utf8",
  );
  const match = sitemapConfig.match(/siteUrl:\s*['"]([^'"]+)['"]/);
  if (match) siteUrl = match[1].replace(/\/$/, "");
} catch {
  // fall back to the default above
}

// --- Load the sidebar structure out of app/_meta.global.tsx -----------------
// The file is plain JS (a nested object literal) with one TS-only bit: a type
// import and an `as MetaRecord` cast. Strip those and evaluate the rest so
// section titles/ordering/hidden-flags stay in sync with the real sidebar
// instead of being hand-duplicated here.
function loadMeta() {
  const src = readFileSync(META_FILE, "utf8")
    .replace(/^import\s+\{[^}]*\}\s+from\s+["']nextra["'];?\s*$/m, "")
    .replace(/\s+as\s+MetaRecord\b/, "")
    .replace(/^export\s+default\s+META;?\s*$/m, "");

  const context = { process, module: { exports: {} }, exports: {} };
  vm.createContext(context);
  const script = new vm.Script(
    `${src}\nmodule.exports = META;`,
  );
  script.runInContext(context);
  return context.module.exports;
}

// Force the same "hidden in production" semantics the live site uses, so a
// WIP page (e.g. the SDK autogen reference) is excluded here too.
process.env.NODE_ENV = "production";
const META = loadMeta();

// Walk the meta tree and collect: (a) which content paths are hidden, and
// (b) a title for every path that has one, for section-header lookups.
const hiddenPaths = new Set();
const titleByPath = new Map();

function walkMeta(node, segments) {
  if (node == null) return;
  if (typeof node === "string") return;
  if (typeof node !== "object") return;

  const currentPath = segments.join("/");
  if (node.display === "hidden") hiddenPaths.add(currentPath);
  if (typeof node.title === "string") titleByPath.set(currentPath, node.title);

  const items = node.items;
  if (items && typeof items === "object") {
    for (const [key, child] of Object.entries(items)) {
      if (key.startsWith("---")) continue; // separators, not real pages
      const childKey = key === "index" ? currentPath : [...segments, key].join("/");
      if (typeof child === "string") {
        if (child) titleByPath.set(childKey, child);
        continue;
      }
      walkMeta(child, key === "index" ? segments : [...segments, key]);
    }
  }
}

for (const [topKey, topNode] of Object.entries(META)) {
  walkMeta(topNode, [topKey]);
}

function isHidden(contentRelPath) {
  // contentRelPath looks like "developers/velocity-sdk/autogen/foo"
  const parts = contentRelPath.split("/");
  for (let i = 1; i <= parts.length; i++) {
    if (hiddenPaths.has(parts.slice(0, i).join("/"))) return true;
  }
  return false;
}

function isExcludedDir(contentRelPath) {
  for (const excluded of EXCLUDED_DIRS) {
    if (contentRelPath === excluded || contentRelPath.startsWith(`${excluded}/`)) {
      return true;
    }
  }
  return false;
}

// Section header for a page: the human title of its second-level ancestor
// (e.g. "protocol/trading/margin/index" -> "Trading"), falling back to the
// top-level title, falling back to a title-cased folder name.
function titleCase(slug) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function sectionFor(contentRelPath) {
  const parts = contentRelPath.split("/");
  const top = parts[0];
  const second = parts.length > 1 ? parts[1] : null;
  if (second && second !== "index") {
    return titleByPath.get(`${top}/${second}`) ?? titleCase(second);
  }
  return titleByPath.get(top) ?? titleCase(top);
}

// --- Walk content/**/*.mdx ---------------------------------------------------
function findMdxFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      out.push(...findMdxFiles(full));
    } else if (entry.endsWith(".mdx")) {
      out.push(full);
    }
  }
  return out;
}

function stripFrontmatter(text) {
  if (text.startsWith("---\n") || text.startsWith("---\r\n")) {
    const end = text.indexOf("\n---", 4);
    if (end !== -1) {
      const afterMarker = text.indexOf("\n", end + 1);
      return text.slice(afterMarker === -1 ? text.length : afterMarker + 1);
    }
  }
  return text;
}

// Turn "[**Perpetual Futures**](/protocol/trading)" style markdown into
// plain text for a one-line description.
function toPlainText(line) {
  return line
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "") // JSX comments, e.g. {/* HIDDEN: ... */}
    .replace(/\{\/[\s\S]*$/, "") // an unterminated JSX comment opener
    .replace(/`{1,3}([^`]*)`{1,3}/g, "$1")
    .replace(/\*\*([^*]*)\*\*/g, "$1")
    .replace(/\*([^*]*)\*/g, "$1")
    .replace(/_([^_]*)_/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitleAndDescription(raw) {
  const text = stripFrontmatter(raw);
  const lines = text.split(/\r?\n/);

  let title = null;
  let titleIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^#\s+(.+?)\s*$/);
    if (m) {
      title = toPlainText(m[1]);
      titleIdx = i;
      break;
    }
  }
  if (title === null) return null;

  let description = "";
  for (let i = titleIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === "") continue;
    if (line.startsWith("#")) break; // hit the next heading, no paragraph found
    if (line.startsWith("import ") || line.startsWith("<") || line.startsWith("export ")) {
      continue;
    }
    // Collect the paragraph (until a blank line or a JSX/heading boundary).
    const paragraph = [];
    let j = i;
    for (; j < lines.length; j++) {
      const l = lines[j];
      if (l.trim() === "") break;
      if (l.trim().startsWith("<") || l.trim().startsWith("#")) break;
      paragraph.push(l.trim());
    }
    const candidate = toPlainText(paragraph.join(" "));
    if (candidate) {
      description = candidate;
      break;
    }
    i = j; // paragraph stripped to nothing (e.g. a JSX comment) - try the next one
  }

  if (description.length > 220) {
    const cut = description.slice(0, 220);
    const lastSpace = cut.lastIndexOf(" ");
    description = `${cut.slice(0, lastSpace)}...`;
  }

  return { title, description };
}

function toRoute(mdxFile) {
  const rel = path
    .relative(CONTENT_DIR, mdxFile)
    .replace(/\\/g, "/")
    .replace(/\.mdx$/, "");
  const withoutIndex = rel.replace(/\/index$/, "").replace(/^index$/, "");
  return { relPath: rel.replace(/\/index$/, ""), route: `/${withoutIndex}` };
}

const files = findMdxFiles(CONTENT_DIR).sort();
const sections = new Map(); // sectionTitle -> [{route, title, description}]

for (const file of files) {
  const { relPath, route } = toRoute(file);

  if (isExcludedDir(relPath)) continue;
  if (isHidden(relPath)) continue;

  const raw = readFileSync(file, "utf8");
  const parsed = extractTitleAndDescription(raw);
  if (!parsed) continue; // no H1 found, skip rather than guess

  const section = sectionFor(relPath);
  if (!sections.has(section)) sections.set(section, []);
  sections.get(section).push({
    route,
    title: parsed.title,
    description: parsed.description,
  });
}

// --- Render llms.txt ---------------------------------------------------------
const lines = [`# ${SITE_NAME}`, "", `> ${SITE_SUMMARY}`, ""];

for (const [section, pages] of sections) {
  lines.push(`## ${section}`);
  for (const page of pages.sort((a, b) => a.route.localeCompare(b.route))) {
    const url = `${siteUrl}${page.route}`;
    const desc = page.description ? `: ${page.description}` : "";
    lines.push(`- [${page.title}](${url})${desc}`);
  }
  lines.push("");
}

if (!existsSync(path.join(ROOT, "public"))) {
  mkdirSync(path.join(ROOT, "public"), { recursive: true });
}
writeFileSync(OUT_FILE, `${lines.join("\n").trimEnd()}\n`, "utf8");

const pageCount = [...sections.values()].reduce((n, arr) => n + arr.length, 0);
console.log(`llms.txt: wrote ${pageCount} pages across ${sections.size} sections to ${path.relative(ROOT, OUT_FILE)}`);
