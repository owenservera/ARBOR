# File: docs/design/ARBOR-LIFE-R002-THROUGHPUT-STEERING.md

> Generated 2026-11-19 · Markdown · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | docs/design/ARBOR-LIFE-R002-THROUGHPUT-STEERING.md |
| Language | Markdown |
| Kind | doc |
| Size | 13908 B |
| Lines | 133 |
| Hash | dc634ec6c799 |
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
# ARBOR LIFE R002 — Maximum Development Throughput Steering

**Date:** 2026-11-17  
**Status:** Owner-directed execution steering; not a claim of implementation or acceptance  
**Repository:** `owenservera/ARBOR` · `main`  
**Baseline inspected:** `922ca4e06db93f3b3a727cebe83d655ee196c095`  
**Local workspace:** `C:\0-BlackBoxProject-0\ARBOR`

## ERA 1 — Facts, constraints, and the actual bottleneck

**Objective:** maximize **independently verified, accepted application improvements per hour**, not agent count, model calls, phase count, or raw test count. Preserve all completed work; optimize the existing running `arbor-life` workflow instead of creating another fleet.

The 2026-11-17 briefing in `.coordination/pdr/chatgpt-workflows-explainer.md` reports:

- First ARBOR LIFE lineage completed three green rounds on A00/A01/A02, with recorded gate exit 0, static/live evidence exit 0, journey replays, 9/9 route rewalks, and keeper handoffs. These are reported evidence, not independently rerun by this steering document.
- Development cycles take approximately **20–40 minutes**, against the design's ≤5-minute aspiration for small fixes.
- Recorded mean generation durations: **ERNIE 5.5 Flash 4.6 seconds (181 calls)** and **NIM Mistral Large 4 37.6 seconds (171 calls)**. Provider-specific averages may measure different generation behavior and do not alone establish coding success.
- Multiple `AmendWorkflow` iterations per lineage, provider stalls, and repeated summary/verification steps consume wall time.
- GLM is retired from this routing setup because of reported Z.ai quota error 1005.

**Critical acceptance contradiction:** `docs/product/roadmap/receipts/A00.receipt.json`, `A01.receipt.json`, and `A02.receipt.json` themselves describe shared-Host mutations against port `43187` while their cited isolation contracts require no such effects. A00 records three mutations; A01 and A02 record two each. Some browser observations are also labelled `NOT VERIFIED` in the receipts. Preserve passing deterministic evidence, but do **not** treat the contradictory claims as full isolation/browser acceptance. Correct only the affected acceptance surface, not the completed A00–A02 implementation.

**Queue drift:** canonical `roadmap.v1.json` at the inspected SHA shows A00/A01 `verification: UNRUN`, A02 `STATIC_LIVE_PASS_EXIT0`, and owner acceptance still pending. The read-only `scripts/roadmap/acceleration-queue.mjs` selects `queued|in-progress` items only when dependencies meet its explicit independent-acceptance predicate. Consequently the observed queue has no readily actionable build item through that selector. Reconciliation belongs to the existing keeper, with no unilateral approval or relaxed predicates.

**Infrastructure already present:** `arbor-life`, `arbor-build`, `arbor-demo`, `arbor-batch-engine`, Host journal, roadmap, receipts, `scripts/test-gate.mjs`, change-set tests, dependency cache, per-item evidence runners, native ZCode browser control and isolated scratch-Host test patterns. Reuse them. GitHub Actions still reports `startup_failure` at inspected `main`; a passing local gate does not establish passing CI.

## ERA 2 — Six practical throughput optimizations

### 1. Two-speed LIFE execution, with FAST as default

**FAST** for a small source-pinned issue: deterministic selection → one lightweight diagnosis → one scoped fixer if required → targeted tests → fresh real browser replay against isolated Host → independent acceptance → keeper handoff. Target **3–8 minutes** on sufficiently small issues; ≤5 minutes is an aspiration, not a universal timeout.

**DEEP** only for cross-system architecture, security-sensitive changes, uncertain diagnosis, contradictory evidence, or two failed bounded repair attempts. Escalate to specialists only when the initial path cannot settle the issue. Do not assemble an eight-agent team for a one-file fix.

### 2. Right-size model routing based on measured success and latency

- Feeder selection, dependency checks, dedup, exit-code parsing and evidence comparison: **deterministic code, no LLM**.
- User-journey planning and simple diagnosis: begin with **ERNIE 5.5 Flash** based on observed latency; validate quality.
- Scoped code repair: benchmark ERNIE against healthy faster NIM alternatives on representative tasks, including success and retry costs. Do not simply assume fastest generation means fastest correct fix.
- Complex reasoning: reserve **Mistral Large 4** or another verified specialist for deep problems.
- Verification: deterministic gates + an independent browser/Host oracle; a model is used only for decisions that cannot be coded reliably.
- Health-probe models, avoid dead GLM quota and unhealthy fallback routes. Limit concurrent model calls to demonstrated provider capacity.

### 3. Keep one long-lived coordinator; minimize amendments

Use the existing LIFE coordinator, its journaled execution, resume and stable identities. Handle normal test failures *inside* the cycle with bounded retries. Use `AmendWorkflow` only for actual workflow-definition corrections or eligible recovery. On genuine amendment, explicitly preserve/replicate saved args because existing definitions document an argument-loss failure mode.

Cached completed workflow steps and gate proofs are valid only for their original source/worktree, environment and inputs. Never reuse a prior acceptance result after code changes. Persist checkpoints and ownership leases so restarts do not cause duplicate effects or rework.

### 4. One thin roadmap feeder, one canonical queue

Reuse `scripts/roadmap/acceleration-queue.mjs`, `docs/product/roadmap/roadmap.v1.json`, accepted receipts and existing claim/release mechanisms. The feeder should only:

1. Read canonical status, relevant receipts, source pins, dependency state and active claims.
2. Skip already completed/claimed/duplicate items.
3. Select one truly authorized eligible item and issue a compact work order.
4. Send source-pinned outcomes to the **existing keeper** for authoritative receipt/queue updates.
5. If no item qualifies, emit the exact blocker **once**; notify keeper and allow only bounded authorized read-only exploration meanwhile.

No roadmap regeneration, second scheduler, duplicate message bus, speculative queue flips, rewritten historical receipts, or automatic owner approval.

**Dedup key:** stable issue identity = affected capability + normalized failure condition + expected behavior + scenario identity; separately attach execution identity = baseline source SHA + dirty-worktree digest + environment fingerprint + relevant journal/Host revision + test inputs. Dedup stable issues across restarts while invalidating stale execution evidence when inputs change.

### 5. Execute the smallest safe checks; preserve independent acceptance

- Coding iteration: relevant unit/component tests first.
- Candidate fix: repeat the **same failed UI journey** with fresh actions on an isolated scratch Host.
- Pre-handoff: canonical `bun scripts/test-gate.mjs` with its own change selection, dependency fingerprint, and proof cache; do not bypass fail-closed full-suite triggers.
- Acceptance: independent verifier confirms browser-visible behavior, intended Host-state/journal changes, source-revision binding, and relevant adversarial negative assertions.
- Keeper consumes existing valid, matching receipts instead of recomputing everything.

Avoid touching global files such as `scripts/test-manifest.json` unnecessarily; its change forces broad test selection. Never weaken the suite or turn missing browser evidence into a PASS.

### 6. Overlap only independent work

Keep **one exclusive code writer per overlapping file scope**. Allow read-only exploration and already-safe deterministic checks to run concurrently with scoped development when the shared runtime and machine resources permit it. Perform independent verification after a stable candidate is available. Do not create competing Host effect writers, duplicate LIFE coordinators, or file clobbers. Start with low concurrency and raise only after measuring provider/machine utilization.

## ERA 3 — Direct ZCode execution order

> **ARBOR LIFE R002 — MAXIMUM DEVELOPMENT THROUGHPUT**
```

_First 80 of 134 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
