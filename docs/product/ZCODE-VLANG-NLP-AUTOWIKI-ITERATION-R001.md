# ZCode × ChatGPT — VLANG / NLP / AutoWiki improvement loops R001

**Owner directive:** 2026-11-22. **Status:** APPROVED pilot design; **not an assertion that workers are already running**.  
**Main product:** ONE VIVIM surface; GPUI desktop master, responsive phone PWA, Host sole state/effects authority.  
**Core development owner:** ChatGPT Cloud Dev, direct Rust-first changes to `owenservera/ARBOR` `main`.  
**ZCode role:** bounded, parallel, read-only assessment and independent replay. No writes to application source, no PRs/branches, no Host effects, no UI forks.

## Reuse, not another platform

Extend the existing `.zcode/workflows/arbor-life.dwf.ts` `mode=audit` design, `arbor-product.dwf.ts`, `CONTINUOUS-IMPROVEMENT-FLEET/DWF-PARALLEL-PATTERNS.md`, and the observed `4 scouts → 1 integrator → 1 verifier` architecture. **Do not run legacy workflow definitions unchanged**: their `life` and `build` phases can write repo files, start Host sessions, trigger provider calls or use archived `/chat`, `/wiki`, `/demo` routes. Today's product is First Contact GPUI/PWA.

Run one isolated pilot scout first. Model routing, billing, provider throttle and 429 recovery remain explicitly UNVERIFIED; only expand to 2–4 independent ZCode scouts after successful bounded evidence. Do not pretend 93 agent definitions, 15 saved workflows, or 3,357 persisted sessions are active workers. Avoid an automatic endless loop until one complete repeatable cycle is proven.

## Parallel improvement lanes (disjoint read-only observation scopes)

| Lane | Target | Canonical evidence | Improvement metric |
|---|---|---|---|
| **Z-AUTO** | AutoWiki as-you-type quality: actual matches, stale results, relevance and null-state accuracy | GPUI `first_contact.rs`, `main.rs`, `wiki_read.rs`; existing Host Wiki revision; owner-authorized live observations | final-query result stable; zero stale results; zero synthetic records |
| **Z-VLANG** | VLANG/NLCL natural-language → typed command IR: paraphrases, context, deterministic routing, cross-surface semantic identity | `apps/vivim-host/control/intent-planner.mjs`, `command-intent.mjs`, `core/programmability/src/command_intent_projection.rs`, existing tests | correct action+argument recognition; exact catalog/world revision |
| **Z-SAFETY** | Negation, ambiguous references, compound instructions, unsupported or unavailable capabilities, risky action suggestions | `action-catalog.v1.json`, `heldout.v1.json`, `command-ai-guard`, `control.rs` | zero accidental plans, grants or effects on typed input; refusal/clarification correct |
| **Z-VISUAL** | First Contact parity: text/IME, preview correctness, Wiki + interpreted command contextual feedback, phone render and source sync | GPUI screenshot and PWA First Contact; source-backed observation receipts | one blank composer before typing; typed interpretation visible; no browser on PC |

Each scout reads and tests only the approved source and **reports** issues. ChatGPT chooses one source-backed defect at a time and pushes a narrowly scoped fix. Independent verifier replays the identical input plus one held-out case on the next SHA. If two consecutive cycles yield no new defect, test improvement or product diff, stop and return a factual receipt rather than consuming quotas.

## First measurable pilot: user text → command

**Source:** exact ARBOR `main` SHA; do not read the dirty local ARBOR worktree for source truth.  
**Checks:**
1. Run the existing `node --test` files `vlang-command-compilation`, `control-intent-planner`, `command-intent-native`, `composer-assist`. No synthetic capability or account assumptions.
2. Compare authorized Host deterministic NLCL interpretation with Rust projection on **existing** catalog-bound examples and the frozen `heldout.v1.json` input set. Held-out cases evaluate, never train parser rules.
3. Record command outcomes in categories: `candidate`, `clarification_required`, `interpretation_required`, `refused`. A candidate is never an approved plan.
4. Verify GPUI draft meaning is **inert**, has exact action identity + risk/readiness, and is invalidated when newer text arrives.
5. Flag missing cross-device command parity; do not claim mobile behavior passed without Android proof.

**Receipt shape:** `{lane,runId,sha,sourcePaths,inputs,exactCommands,pass,fail,unrun,defects:[{repro,expected,actual,severity}],tests,deviceEvidence,providerCostOr429,proposedOneFix}`.

## Work handoff

- ZCode observer: findings and read-only evidence; no code edit, no source commit, no user Host mutation.
- ChatGPT integrator: one verified product change on `main`, Rust first and TypeScript 7+ if needed; no second NLP grammar.
- ZCode independent verifier: replay on immutable SHA, annotate actual PASS/FAIL/UNRUN; update shared canonical 100-step product ledger **via ChatGPT GitHub source owner**, not local source patches.
- On 429 / model issue: park model agent immediately, run existing deterministic test suites manually as a no-cost validation lane, do not retry repeatedly.

## Already delivered core changes

- `e455bb7`: native Host `interpret` read-only composer projector with bounded candidate/clarification admission.
- `3beaf36`: GPUI contextual inert VLANG interpretation on the First Contact surface.
- `d5e605a`: delayed Wiki refresh schedule respects bounded recent Host observations.

**Acceptance warning:** these are Rust source+tests, not a successful physical GPUI typing / Android PWA parity demo yet. Native binary and device evidence remain separate gates.
