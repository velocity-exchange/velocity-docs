# Writing: Velocity Exchange Docs

How pages are written here. Companion to `DESIGN.md`, which covers how they look.

## 1. Overview

These docs explain a perpetual futures exchange and a money market to someone who
understands leverage and collateral but has never held a perpetual. They are read by
traders, by integrators, and by market makers sizing a strategy. All three need the same
thing first: the problem a mechanism solves, before the mechanism.

The failure mode this guide exists to prevent is a page that opens with a formula table,
introduces a named constant before the reader knows what it is for, and never says why the
thing it documents exists.

## 2. Named Rules

**Problem Before Mechanism.** State what goes wrong before describing what fixes it. A
reader who does not know the problem cannot evaluate the solution, and every mechanism on
this protocol exists because a simpler version failed.

**The Simple Version First.** Where a mechanism is a correction to something simpler, give
the simpler thing plainly, then what breaks, then the correction. Funding is not "a rate with
a floor and a dead zone". It is "pay the full gap", plus two fixes, each with a reason.

This names a SHAPE, not a phrase. Do not write the words "the naive rule" into the page, and
do not title the section after the pattern. Name what this page's simple design actually gets
wrong: "Why one flat rate fails", "Why the book is not on chain". Eight pages once carried the
identical heading "The naive rule, and what breaks", which is what happens when a writer copies
the rule's name instead of applying it.

**No Adjective Does Work.** Robust, powerful, seamless, intuitive, competitive, guaranteed,
minimal. If a sentence needs one of these to land, it is missing a number. Taker fees run
from 4 bps down to 2 bps is more persuasive than "highly competitive" and cannot go stale
silently.

**Every Number Carries Its Unit.** Not "10.95%" but "10.95% annualized". Not "5 bps" but
"5 bps of the oracle TWAP". Precision and denominator are part of the number.

**Name And Value Together.** A constant appears with both, or not at all.
`DEFAULT_REVENUE_SINCE_LAST_FUNDING_SPREAD_RETREAT` (negative, -$25). A name alone is
unreadable; a value alone is unverifiable.

**Boundaries Are Stated.** What happens at zero, at the cap, on the first call, after a
long gap. A mechanism described only in its normal range is half documented.

**One Home Per Mechanism.** A mechanism is explained on exactly one page. Every other page
links to it. Duplication is how two pages come to disagree, and it always ends there.

**Say What Is Not True.** Where a reader will reasonably assume something false, say so
directly. The auction duration field is not measured in slots. The vAMM maker rebate is off
by default. These sentences are worth more than the ones around them.

## 3. Page shape

Most explanatory pages run in this order. Reference pages may drop the last two.

1. **What it is**, in two or three sentences, with no jargon that the page has not earned.
2. **The naive version**, stated fairly. Not a strawman.
3. **What breaks**, as a short enumerated list where there is more than one thing.
4. **The mechanism**, as the answer to 3.
5. **Worked example**, with real numbers, inside and outside any boundary.
6. **Boundary behaviour and edge cases.**
7. **What this means for you**, segmented by reader where the answer differs.

Paragraphs run three to five lines. Bullets are for genuinely enumerable things: the four
outcomes, the six validation checks. Prose fragments in a list are still prose, badly set.

Questions as headings are an FAQ, and an FAQ is a page that gave up on structure. If four
questions have the same answer, that answer is one section.

## 4. Worked examples

Two anchor accounts, used everywhere. Do not invent a third.

| Anchor | Use it on |
| --- | --- |
| **$10,000 account, SOL-PERP** | Getting started, trading, orders, fees, margin, liquidation |
| **$5,000,000 desk** | Risk, insurance fund, bankruptcy, market maker pages |

Every invented number is labelled illustrative on the page where it appears. A price that
looks live and is not will be quoted back at us.

## 5. Vocabulary

One name per thing. The distinctions below are real and must not be collapsed.

**Keeper, filler, liquidator.** A keeper is the operator. A filler is the role in a fill. A
liquidator is the role in a liquidation. A liquidator is a keeper; not every keeper is a
liquidator.

**AMM, vAMM.** Use AMM in prose. Use vAMM only where the virtual-reserve construction is
the subject: the curve, reserve bounds, the spread pipeline.

**DLOB.** Decentralized orderbook. Expand on first use per page, then use the acronym. It
is off-chain, built by keepers from on-chain order accounts.

**CLOB** does not appear on any page describing current behaviour until it ships.

**Isolated** never appears without its noun: isolated pool, Isolated contract tier,
isolated asset tier, isolated insurance fund.

| Use | Not |
| --- | --- |
| USDT, dUSDT on devnet | USDC |
| the quote asset | quote token, the stablecoin, spot market 0 |
| P&L, unrealized P&L | PnL, PNL, uP&L |
| maintenance margin | minimum maintenance margin, maintenance margin fraction |
| account health | health factor, margin health |
| contract tier (perp), asset tier (spot) | market tier, or either for both |
| orderbook | order book |
| subaccount | sub-account |
| onchain, offchain | on-chain, off-chain |
| signed-message order | SWIFT order, Swift order |
| Velocity, the protocol, the program | the platform, the exchange, Clearinghouse, we |

The protocol is the system. The program is the deployed Solana code. Use the distinction
only when it carries weight.

**Prose gets the English name, code gets whatever that layer calls it.** A sentence says
"a signed-message order"; the snippet beside it says `SignedMsgOrderParams`, because that
is what the SDK exports. Never invent an identifier to match prose, never bend prose to
match an identifier.

Terms held back until they ship: **VLP** (returns as Velocity Liquidity Pool when the vault
opens to outside capital), and anything else a reader cannot act on today.

## 6. Mechanics

- **en-US.** utilization, socialized, decentralized. Check anchors when changing a heading.
- **No em dashes.** Anywhere. Prose, headings, callouts, figure labels.
- **No en dashes for ranges.** "between two and seven", not a dash.
- **No hyphen as a separator.** `**Term** - description` is a hyphen doing an
  em dash's job. Use a colon, or a period when the second half is a full
  sentence. 45 list items in the corpus still use the hyphen form.
- **Sentence case for headings.** Proper nouns keep their capitals.
- **Bold is for a term on first definition.** Not for emphasis, and never twice in a
  sentence.
- **Callouts hold warnings and asides.** Load-bearing content goes in prose. If a callout
  is the only place a fact appears, it is in the wrong place.

## 7. Citing the program

Cite **names**, never file and line. `get_auction_duration`, `FUNDING_RATE_OFFSET_DENOMINATOR`,
`PerpFulfillmentMethod`. Names survive a refactor; line numbers rot silently and nothing
here checks them.

Before documenting a mechanism, read it in `programs/velocity/src`. Before documenting a
default, read the value the market is initialized with, not the value the field can hold.
Several defaults are zero at launch and the feature they gate is therefore off.

## 8. Do's and Don'ts

### Do:
- **Do** state the problem before the mechanism, on every page that has one.
- **Do** give the number when you are tempted to give an adjective.
- **Do** work the example on both sides of the boundary.
- **Do** link to the one page that owns a mechanism instead of restating it.
- **Do** say plainly when a thing is off by default, not live, or not what the name suggests.

### Don't:
- **Don't** open with a formula table. The formula comes after the reason.
- **Don't** write an FAQ. Four questions with one answer are one section.
- **Don't** introduce an acronym without expanding it on that page.
- **Don't** carry a number across pages without checking it still matches the program.
- **Don't** describe a mechanism you have not read in the source.
