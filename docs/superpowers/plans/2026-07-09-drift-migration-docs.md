# Drift→Velocity Migration Docs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish two point-in-time migration documents in the velocity-docs site: an AI-agent migration instruction page and a human-readable Drift→Velocity changelog, with every factual claim verified against the velocity-v1 source tree.

**Architecture:** A three-phase pipeline: (1) parallel fact-extraction agents build a *verified fact sheet* from `velocity-v1/docs/DRIFT-TO-VELOCITY.md` cross-checked against actual code (SDK exports, error enum, IDL, fork-point git history); (2) two writer agents each produce one MDX page from the fact sheet only; (3) adversarial verifier agents re-check every concrete claim in the drafts against source before nav wiring and a site build.

**Tech Stack:** Nextra 4.6.1 (app router) MDX site; source of truth is `/Users/chestersim/Desktop/all-velocity/velocity-v1` (program + SDK monorepo, fork point `0ae3e3b1d`).

## Global Constraints

- Docs are **point-in-time**: state clearly they reflect `@velocity-exchange/sdk` **0.6.0** (verify against `velocity-v1/packages/sdk/package.json` at write time) as of July 2026. No CI staleness machinery.
- Scope is **TypeScript SDK only** (trading/MM + keeper paths). Rust (`velocity-rs`) and raw-ABI migration are explicitly out of scope; the changelog may *mention* them with a pointer to `docs/DRIFT-TO-VELOCITY.md` in the velocity-v1 repo.
- **Every concrete fact** (symbol name, program ID, error code, instruction name, version, PR number) must be verified against velocity-v1 source, not just copied from DRIFT-TO-VELOCITY.md. The doc is the map; the code is the territory.
- Old-Drift-side facts are verified against the fork point: `git -C velocity-v1 show 0ae3e3b1d:<path>` (old SDK lived at `sdk/src/`).
- The agent guide MUST include: ordered procedure, symbol mapping tables, removed-features grep audit list, a mandatory **behavioral-divergences STOP list** (compile-invisible changes the agent must surface to its human), and done-criteria (tsc clean + grep audit empty + behavioral report produced).
- MDX style: match existing pages (`content/developers/velocity-sdk/setup.mdx`, `orders.mdx`) — H1 title, plain markdown tables, fenced code blocks, relative links like `/developers/velocity-sdk/setup`, no front-matter (only `asIndexPage: true` on index pages).
- Subagent models: `opus` for all extraction, writing, and verification stages (user-directed). Never `fable` without explicit permission.
- Git: no commits unless the user asks; never any AI co-author attribution.

---

### Task 1: Verified fact sheet (3 parallel Opus extraction agents)

**Files:**
- Create: `<scratchpad>/facts-sdk-surface.md` (agent 1A)
- Create: `<scratchpad>/facts-features-abi.md` (agent 1B)
- Create: `<scratchpad>/facts-behavioral.md` (agent 1C)

**Interfaces:**
- Consumes: `velocity-v1/docs/DRIFT-TO-VELOCITY.md`, velocity-v1 source, fork-point git objects.
- Produces: fact-sheet rows in the schema `| claim | status (VERIFIED/FAILED/UNVERIFIABLE) | evidence (path:line or git ref) | notes |` — writers may only use VERIFIED rows.

- [ ] **Step 1: Launch agent 1A — SDK surface mapping.** Extract every SDK rename/removal/addition relevant to a TS integrator (client classes, subscribers, math modules, types, constants, config). Old side verified via `git show 0ae3e3b1d:sdk/src/index.ts` (and submodule files); new side via `packages/sdk/src/index.ts` + exports. Output: old→new mapping rows with evidence.
- [ ] **Step 2: Launch agent 1B — feature removals + program/ABI facts.** Feature removal list (spot DLOB, fulfillment, fuel, vAMM LP, protected maker, high-leverage mode, prediction markets, pyth pull/push, …), program IDs, npm package names/versions, Anchor versions, error-code additions/renames (verify against `programs/velocity/src/error.rs` and IDL `packages/sdk/src/idl/velocity.json`), removed/added instructions (verify against `programs/velocity/src/lib.rs`).
- [ ] **Step 3: Launch agent 1C — behavioral divergences.** Compile-invisible semantic changes: trigger-order pricing (#234), fast-fill auction defaults v3 (#233), quote-asset/USDT terminology direction, oracle default `PYTH` → `PYTH_LAZER`, any precision/rounding/margin/funding changes surfaced by `git log` + DRIFT-TO-VELOCITY.md §6. Each row: what changed, why it's invisible to the compiler, what an integrator must review.
- [ ] **Step 4: Review the three fact sheets myself.** Reject or re-dispatch on FAILED rows that writers would need; note the SDK version discrepancy (doc says 0.2.x, package.json says 0.6.0) and resolve to the package.json value.

### Task 2: Human-readable changelog page (1 Opus writer)

**Files:**
- Create: `velocity-docs/content/developers/migrate-from-drift/index.mdx`

**Interfaces:**
- Consumes: the three fact sheets (VERIFIED rows only) + two style-reference pages.
- Produces: an `asIndexPage: true` MDX page titled "Migrating from Drift", linked by Task 4's nav entry `migrate-from-drift`.

- [ ] **Step 1: Launch writer with outline:** (1) What happened — fork story, Drift paused, new program deployment, at-a-glance table (program ID, npm package, client class, Anchor, IDL); (2) Feature removals — table: feature / what to do instead; (3) What's new or changed — VLP, Pyth Lazer default, fast-fill auctions, notable behavioral changes in human framing; (4) SDK surface — headline renames (DriftClient→VelocityClient, no back-compat aliases), pointer to the agent guide for exhaustive tables; (5) Migration paths — link to `/developers/migrate-from-drift/agent-guide` for AI-assisted migration and to velocity-v1 `docs/DRIFT-TO-VELOCITY.md` for Rust/ABI depth; (6) Point-in-time disclaimer.
- [ ] **Step 2: Writer self-check:** every table cell traceable to a VERIFIED fact-sheet row; no invented symbols.

### Task 3: AI-agent migration guide page (1 Opus writer)

**Files:**
- Create: `velocity-docs/content/developers/migrate-from-drift/agent-guide.mdx`

**Interfaces:**
- Consumes: the three fact sheets (VERIFIED rows only) + style-reference pages.
- Produces: MDX page titled "AI Agent Migration Guide", written in the second person **to the migrating agent**.

- [ ] **Step 1: Launch writer with outline:** (0) Preamble — audience is an AI coding agent pointed at a codebase importing `@drift-labs/sdk`; scope TS-only; instruction to read fully before editing; (1) Inventory step — greps to enumerate used Drift symbols; (2) Ordered procedure — package swap (`@drift-labs/sdk` → `@velocity-exchange/sdk@0.6.x`), Anchor 0.29→1.0 implications, client/class renames, subscriber changes, removed-feature handling in dependency-safe order; (3) Symbol mapping tables (old → new → notes) from fact sheet 1A; (4) Removed-features audit — grep patterns that must return zero matches; (5) **Behavioral divergences — STOP and report**: the 1C list, with explicit instruction to enumerate which items the codebase touches and report to the human before declaring completion; (6) Done criteria — `tsc` clean, audit greps empty, behavioral report delivered; explicit statement that compile-clean alone is NOT done.
- [ ] **Step 2: Writer self-check** as in Task 2.

### Task 4: Adversarial fact verification (2 Opus verifiers) + fixes

**Files:**
- Modify: both MDX pages from Tasks 2–3 (fix findings)
- Create: `<scratchpad>/verify-index.md`, `<scratchpad>/verify-agent-guide.md`

**Interfaces:**
- Consumes: the two draft pages; velocity-v1 source (NOT the fact sheets — verification must be independent).
- Produces: findings lists `| claim in doc | verdict (CONFIRMED/WRONG/UNSUPPORTED) | evidence |`; corrected pages.

- [ ] **Step 1: Launch one verifier per page**, prompted to *refute*: check every symbol against `packages/sdk/src/index.ts` exports, every error code against `error.rs`, every instruction against `lib.rs`/IDL, every ID/version against source, every old-side claim against `0ae3e3b1d`. Code snippets must typecheck against the real SDK surface (imports exist, method names exact).
- [ ] **Step 2: Apply fixes** for every WRONG/UNSUPPORTED finding myself (or re-dispatch the writer if structural). Re-verify any rewritten section.

### Task 5: Nav wiring + build verification

**Files:**
- Modify: `velocity-docs/app/_meta.global.tsx` (developers → after `"--- guides"` separator, before `"market-makers"`)

**Interfaces:**
- Consumes: page filenames from Tasks 2–3.
- Produces: live nav entries `/developers/migrate-from-drift` and `/developers/migrate-from-drift/agent-guide`.

- [ ] **Step 1: Add nav entry:**

```tsx
"migrate-from-drift": {
  "title": "Migrate from Drift",
  "items": {
    "index": "",
    "agent-guide": "AI Agent Guide"
  }
},
```

- [ ] **Step 2: Build.** Run `pnpm build` in velocity-docs. Expected: compiles, both routes present in build output. Fix any MDX compilation errors.
- [ ] **Step 3: Final read-through** of both rendered pages for tone, link validity, and the point-in-time disclaimer. Report to user; do not commit unless asked.
