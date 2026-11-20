# File: docs/product/roadmap/ROADMAP.md

> Generated 2026-11-19 · Markdown · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | docs/product/roadmap/ROADMAP.md |
| Language | Markdown |
| Kind | doc |
| Size | 33087 B |
| Lines | 277 |
| Hash | 78b5b7bca3db |
| Test | no |
| Generated | no |
| Component | docs |

## Symbols

_No symbols._

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```markdown
# ARBOR Product Roadmap

*Schema `arbor.product-roadmap/1` — synthesized inventory 2026-11-16; active acceleration queue R002, batch ACCEL-A. Machine truth is `roadmap.v1.json`. This markdown is a projection; the JSON file is authoritative.*

## Generated from
- proposal5Corpus (.integration/proposal5, .integration/proposal4-one, .integration/proposal1, .integration/proposal4, integration/)
- vivimLabs (vivim-labs/ tech stack, capability observatory, evidence factory, wave boosters, mobile extensions, personal-knowledge-lifecycle, zai, past-orphaned-work)
- hqIndex (hq/, repos_hq/ sync bus, migration evidence)
- gapSweep (30 gap-fill L2 items folded, cited by repo/path; PROPOSAL4-SIGIL and PROPOSAL4-KERNEL-SPEC already present and not re-added)

## Counts
- L0 pillars: 3 (L0-DEMO, L0-BUILD, L0-WININSTALL)
- L1 programs: 7 (L1-DEMO-LOOP, L1-P5-INTEGRATION, L1-P5-FOUNDATIONS, L1-VLANG-VEC, L1-VEC-ENGINES, L1-P2-LABS, L1-WININSTALL)
- L2 work packages: 97 rows shown in this view (statuses: implemented 1, in-progress 6, todo 36, candidate 46, deferred 1, gated 1, queued 6); gap-sweep items folded into synthesis inputs at synthesis, not all enumerated here
- Active build queue: A00-A08 (A00 gated, A01/A02 in-progress, A03 build-failed/gated on A00 until A00 is independently accepted; A04-A08 queued or gated per their dependencies; all verification UNRUN, owner acceptance PENDING)
- archivedBuildBatches: 1 (BATCH-1 executed, acceptance OPEN_FINDINGS, historical bookkeeping only)

## Workstream emphasis (owner, 2026-11-14)
Three workstreams: (1) ARBOR build — roadmap implementation track; (2) ARBOR demo — realtime fast-iteration design-and-acceptance gate over the build; (3) Windows install — ordinary workstream, NOT a gate, never a blocking criterion. Priority: demo >> build >> new queue batch >> demo > build (the self-driving acceleration loop). Labs gap-fill items are supporting context only and never enter the beta critical path.

## Product pillars (L0)

### L0-DEMO — ARBOR demo workstream — realtime fast-iteration design-and-acceptance gate

Status: **active**

Owner emphasis 2026-11-14 (supersedes 2026-11-13 banked): demo is the realtime fast-iteration design and acceptance gate over the build workstream; top priority goes to every component the capture and gap sweep found that accelerates the realtime automated loop — the self-driving cycle: demo surfaces design verdicts → build applies them → new queue batch is drawn → repeat (demo >> build >> new queue batch >> demo > build). GAP STATEMENT: no compiled work package from the four L2 compilers covers the demo workstream — no demo backlog, no automated acceptance-check harness, no queue-batch generator exists in the compiler outputs. Nearest loop accelerators found by the gap sweep (candidates, not compiled): harness/CONTRACT.md (approval-gated sendOnce, receipt-before-effect journal), vivim-ui PLAN.md three-tier agentic runtime, FINAL-WAVE Gate 5/6 matrices, DUAL-EXECUTION-PROTOCOL session lifecycle. Candidate program compiled at L1-DEMO-LOOP.

Sources: OWNER EMPHASIS (ask, 2026-11-14)

### L0-BUILD — ARBOR build workstream — roadmap implementation track

Status: **active**

The build workstream: proposal5 master integration beta program (G00-G13, all PROPOSED_UNRUN per .integration/proposal5/08-BETA-GATES.json:14-209), VEC/vlang NL-programming system convergence, and the vec-ui-engines 100-agent fleet as co-equal pillars. 128 L2 work packages below (98 compiled + 30 gap-fill folded from the gap sweep). Gate statuses honest per 08-BETA-GATES.json — UNRUN is not pass; source presence is not runtime admission; the build queue stays pending owner prioritization (priority null throughout). Conflicting root integration/beta-gates.json ACCEPTED claims are recorded in conflicts, not adopted.

Sources: OWNER EMPHASIS (ask, 2026-11-14) ; .integration/proposal5/08-BETA-GATES.json:14-209

### L0-WININSTALL — Windows install workstream — ordinary workstream, NOT a gate

Status: **active**

Owner emphasis 2026-11-14: the Windows+PWA install/release contract is an ordinary workstream, one of the three, never a G-gate or a blocking criterion. CONFLICT FLAGGED (read-only stage, gate doc untouched): G13 in 08-BETA-GATES.json:196-209 documents 'Windows package and PWA version compatible' as a BLOCKER gate — owner reclassification needs reconciliation at synthesis. Candidate program compiled at L1-WININSTALL.

Sources: OWNER EMPHASIS (ask, 2026-11-14) ; .integration/proposal5/08-BETA-GATES.json:196-209

## Programs (L1)

### L1-DEMO-LOOP — Demo↔build self-driving loop — candidate program, no compiled package

Status: **active**

Candidate L1 from owner emphasis + gap sweep (not from the four compilers). Loop-accelerating components found untracked by proposal5/HVI sources: harness/CONTRACT.md (byte-identical ARBOR/vivim-web-harness, sha1 b47fb0be4afc637242955373e409652dcb5776a5: lane ownership A/B/C :10-28, receipt-before-effect journal :52-54, approval-gated sendOnce :55-61, single Chrome profile loopback 9333, Lane B six provider profiles chatgpt/claude/deepseek/qwen/zai/gemini, Lane C wh CLI + wh serve + wh-mcp, seven safety acceptance tests :72-74 — no roadmap gate cites it, adjacent to G04/G07); vivim-ui PLAN.md (three-tier agentic runtime, Intent→Plan→JobSpec→RunMeta→BusEvent, lanes L0-L9, gates G0-G9, verified 57 pass/1 fail of 58, Rust bench 709,697 ev/s vs TS 246,336 ev/s = 2.9×, Gate 0 PASS 2026-11-02); VIVIM-VISUAL-RUNTIME/FINAL-WAVE/README.md (Gate 5 BLOCKED/Gate 6 BLOCKED, 23/23 commands exit 0, 1046 pass/0 fail, Wave 4B repair src/visual-runtime/device/wave4-phone-adapter.ts:227); VIVIM-VISUAL-RUNTIME/DUAL-EXECUTION-PROTOCOL.md (eight-state session lifecycle, fresh-head CAS publication); docs/SESSION-LEDGER.md (8-lane halt state, 7 carried defects incl P0 registry substring routing bug). Status candidate — queue pending owner prioritization.
R002: ACTIVE ACCELERATION FIRST. Work orders A00/A03/A05 connect demo feedback, scoped building, independent verification and requeue. Readiness depends on source/evidence, not candidate descriptions.

Sources: OWNER EMPHASIS (ask, 2026-11-14) ; harness/CONTRACT.md ; vivim-ui/VIVIM-VISUAL-RUNTIME/FINAL-WAVE/README.md ; vivim-ui/VIVIM-VISUAL-RUNTIME/DUAL-EXECUTION-PROTOCOL.md ; vivim-ui/docs/SESSION-LEDGER.md
Depends on: L0-DEMO

### L1-P5-INTEGRATION — Proposal5 master integration program — W0-W6, serial G, gates G00-G13, status ledger

Status: **todo**

One-time master integration program on integrate/proposal5-beta-r001; wave matrix at 09-EXECUTION-PLAYBOOK.md:31-37; playbook status NOT STARTED (:4). Gates G00-G13 all PROPOSED_UNRUN with observed_evidence null and owner_accepted false (08-BETA-GATES.json) — the conflicting root integration/beta-gates.json (UNBLOCKED, G01-G13 ACCEPTED, betaGo true, mergeCommit 7586f28) is treated as an unverified ledger claim contradicted by the same repo's release-manifest.json (BLOCKED_NOT_BUILT, betaGo false, mergeCommit dc2ae811, releaseAllowed false); reconciliation is an open owner decision (see conflicts). Compiled as P5-W0..W6, P5-SERIAL-G, P5-STATUS-LEDGER, G00..G11, G12-G13.

Sources: .integration/proposal5/09-EXECUTION-PLAYBOOK.md:4,31-37 ; .integration/proposal5/08-BETA-GATES.json:14-209
Depends on: L0-BUILD

### L1-P5-FOUNDATIONS — Proposal5 foundations pre-G program — PG waves, Rust proof tasks, pre-G exit, G sole-source union

Status: **todo**

Pre-G waves PG-00..PG-03 isolated, no product writes (IMPLEMENTATION-WAVES.md:54). Real Rust proof tasks FA-PG01-03 (generation swap, pinned lease, cancellation, typed DAG budget on synthetic isolated source) and FA-W2F1-02 (pure language/graph transform as new engine generation with CAS rollback) require cross-language build/cargo test actual exit codes per NATIVE-MACHINERY-AND-CONTRACTS.md:75-82 — V8 evaluation not sufficient. Runtime evidence exists for PG02 only: Node synthetic 20/20 PASS exit 0 (PG02-semantic-fabric/RUN-LEDGER.json:42-52); FA-PG01-03 cargo tests UNRUN (cargo not installed, PG01-native-abi/RUN-LEDGER.json:214-239); FA-W2F1-02 no Rust runtime evidence in corpus. Pre-G exit gate PREPARED_NOT_PROMOTED; G sole-source union NOT_EXECUTED with wave1G NOT_RUN_AS_CONFIRMED_BY_OWNER.

Sources: .integration/proposal5/foundations/IMPLEMENTATION-WAVES.md:54-130 ; .integration/proposal5/foundations/NATIVE-MACHINERY-AND-CONTRACTS.md:75-82
Depends on: L0-BUILD

### L1-VLANG-VEC — VLang/VEC system-convergence program — gates G-00..G-09, SCF step 1, VECX P0

Status: **todo**
```

_First 80 of 278 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
