// Shared route-mapping and exclusion helpers for the machine-readability
// build scripts (llms.txt and the per-page markdown mirror).
//
// Source of truth for grouping and section titles is the Fumadocs meta.json
// tree under content/, with page titles read from each file's frontmatter.
// Legal content is excluded on purpose, being out of scope for LLM output.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, "..", "..");
export const CONTENT_DIR = path.join(ROOT, "content");

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

// --- Load the sidebar structure out of the Fumadocs meta.json tree ---------
// Each content folder carries a meta.json with { title, pages }. Reading those
// keeps section titles and ordering in sync with the real sidebar instead of
// being hand-duplicated here. Nothing is hidden any more: the nextra-era
// "display: hidden" flag has no Fumadocs equivalent, and the pages that used
// it have been deleted.
const hiddenPaths = new Set();
const titleByPath = new Map();

function loadMetaTree(dir, segments) {
  const metaFile = path.join(dir, "meta.json");
  let meta;
  try {
    meta = JSON.parse(readFileSync(metaFile, "utf8"));
  } catch {
    return;
  }
  if (typeof meta.title === "string" && segments.length) {
    titleByPath.set(segments.join("/"), meta.title);
  }
  for (const entry of meta.pages ?? []) {
    if (typeof entry !== "string" || entry.startsWith("---")) continue;
    const child = path.join(dir, entry);
    if (existsSync(child) && statSync(child).isDirectory()) {
      loadMetaTree(child, [...segments, entry]);
    }
  }
}

for (const top of readdirSync(CONTENT_DIR, { withFileTypes: true })) {
  if (top.isDirectory()) loadMetaTree(path.join(CONTENT_DIR, top.name), [top.name]);
}

// Page titles come from each file's frontmatter.
function titleFromFrontmatter(file) {
  const text = readFileSync(file, "utf8");
  if (!text.startsWith("---")) return null;
  const end = text.indexOf("\n---", 3);
  if (end === -1) return null;
  const m = text.slice(3, end).match(/^title:\s*(.+)$/m);
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
}

for (const file of findMdxFiles()) {
  const rel = path.relative(CONTENT_DIR, file).replace(/\.mdx$/, "");
  const key = rel.endsWith("/index") ? rel.slice(0, -"/index".length) : rel;
  const title = titleFromFrontmatter(file);
  if (title && !titleByPath.has(key)) titleByPath.set(key, title);
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

// Titles moved from a leading H1 into frontmatter when the site migrated to
// Fumadocs, which renders the title itself. These scripts read it from there.
export function frontmatterTitle(text) {
  if (!text.startsWith("---")) return null;
  const end = text.indexOf("\n---", 3);
  if (end === -1) return null;
  const m = text.slice(3, end).match(/^title:\s*(.+)$/m);
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
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
