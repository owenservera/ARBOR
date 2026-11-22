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

## First actual execution receipt — 2026-11-22

- **Cloud source:** GPUI Host composer meaning bridge `e455bb7`, native UI `3beaf36`; bounded delayed Wiki refresh `d5e605a`.
- **Windows immutable source** `3beaf36b7a955fd514bb80ad45bf347630e4bec1`, device `DESKTOP-9KB03LU`: `cargo test --manifest-path native/gpui-desktop/Cargo.toml --lib --offline` **41/41 PASS**; `cargo check --manifest-path native/gpui-desktop/Cargo.toml --features desktop --offline --locked` **PASS**.
- `node --test apps/vivim-host/test/vlang-command-compilation.test.mjs apps/vivim-host/test/control-intent-planner.test.mjs apps/vivim-host/test/command-intent-native.test.mjs apps/mobile-relay/test/composer-assist.test.mjs`: **26/26 PASS**, including test annotations that full native binary parity is **UNRUN** in parts of the Node harness.
- Real deterministic Host compiler sampling: `create wiki page notes` → `candidate wiki.page.create` R1 source_wired; `edit wiki section notes/tasks saying item` → `candidate wiki.section.edit` R1 source_wired; `stop all traffic` → `clarification_required` with the exact question about pausing VIVIM traffic versus disconnecting the machine. The native adapter tests admission but real GPU visual feedback on this SHA **UNRUN**.
- **ZCode scout pilot actually launched** through CLI in plan/read-only mode against the immutable source. The configured OpenRouter `baidu/ernie-5.5-flash-preview:free` provider returned **HTTP 429 upstream TPM rate limit**, so **no model-generated finding or completed improvement pass** exists. The scoped pilot process was terminated; no retry or other model lane was launched. No claims of independent ZCode verifier success.
- The saved `arbor-life` build/loop scripts were **not** executed because their older routes and source-edit permissions violate today's owner workflow. The deterministic test path remains usable without model fanout.

**Next execution order:** (1) native UI physical typing/meaning and Wiki test on rebuilt exact SHA; (2) add one real, independently reproduced natural-language failure as a regression before editing parser rules; (3) when a healthy authorized provider is available, retry **one** read-only ZCode scout with a hard budget, then expand to two independent lanes; (4) no unbounded model retries or paid-provider fallback without owner direction. Core code remains ChatGPT-owned.
