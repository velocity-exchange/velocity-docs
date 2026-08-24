// Shared route-mapping and exclusion helpers for the machine-readability
// build scripts (llms.txt and the per-page markdown mirror).
//
// Source of truth for grouping/section titles and for excluding hidden/WIP
// pages is app/_meta.global.tsx (the sidebar). Legal/regulatory content is
// excluded on purpose (out of scope for LLM-facing output).

import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, "..", "..");
export const CONTENT_DIR = path.join(ROOT, "content");
export const META_FILE = path.join(ROOT, "app", "_meta.global.tsx");

// Directories excluded outright, regardless of what the sidebar says.
export const EXCLUDED_DIRS = new Set(["protocol/legal-and-regulations"]);

export function loadSiteUrl() {
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
  return siteUrl;
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
  const script = new vm.Script(`${src}\nmodule.exports = META;`);
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

export function isHidden(contentRelPath) {
  // contentRelPath looks like "developers/velocity-sdk/autogen/foo"
  const parts = contentRelPath.split("/");
  for (let i = 1; i <= parts.length; i++) {
    if (hiddenPaths.has(parts.slice(0, i).join("/"))) return true;
  }
  return false;
}

export function isExcludedDir(contentRelPath) {
  for (const excluded of EXCLUDED_DIRS) {
    if (contentRelPath === excluded || contentRelPath.startsWith(`${excluded}/`)) {
      return true;
    }
  }
  return false;
}

export function isIncluded(contentRelPath) {
  return !isExcludedDir(contentRelPath) && !isHidden(contentRelPath);
}

export function titleCase(slug) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Section header for a page: the human title of its second-level ancestor
// (e.g. "protocol/trading/margin/index" -> "Trading"), falling back to the
// top-level title, falling back to a title-cased folder name.
export function sectionFor(contentRelPath) {
  const parts = contentRelPath.split("/");
  const top = parts[0];
  const second = parts.length > 1 ? parts[1] : null;
  if (second && second !== "index") {
    return titleByPath.get(`${top}/${second}`) ?? titleCase(second);
  }
  return titleByPath.get(top) ?? titleCase(top);
}

// --- Walk content/**/*.mdx ---------------------------------------------------
export function findMdxFiles(dir = CONTENT_DIR) {
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

export function stripFrontmatter(text) {
  if (text.startsWith("---\n") || text.startsWith("---\r\n")) {
    const end = text.indexOf("\n---", 4);
    if (end !== -1) {
      const afterMarker = text.indexOf("\n", end + 1);
      return text.slice(afterMarker === -1 ? text.length : afterMarker + 1);
    }
  }
  return text;
}

// contentRelPath ("protocol/trading/margin"), route ("/protocol/trading/margin")
export function toRoute(mdxFile) {
  const rel = path
    .relative(CONTENT_DIR, mdxFile)
    .replace(/\\/g, "/")
    .replace(/\.mdx$/, "");
  const withoutIndex = rel.replace(/\/index$/, "").replace(/^index$/, "");
  return { relPath: rel.replace(/\/index$/, ""), route: `/${withoutIndex}` };
}
