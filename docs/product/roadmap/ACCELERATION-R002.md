# ARBOR Acceleration-First Execution — R002

**Owner directive:** 2026-11-14. **Machine authority:** `docs/product/roadmap/roadmap.v1.json`. This is an explanatory companion, not a second backlog. **Status:** queue/planning applied; A00–A08 source implementation and tests are **UNRUN**.

## 1. Objective and priorities

Build the capabilities that increase ARBOR's ability to build its next capability. First deliver the PC Host PWA chat (screen 1) → NLCL/VEC → one Host-authorized durable state/revision → source-backed intelligent Wiki (screen 2). Then make a real observed defect produce a source-pinned, executable work order; verify the repair independently and display the new live result. An accelerator is accepted only after it demonstrably speeds up a **subsequent verified** work order.

Keep three L0 workstreams: `L0-DEMO` (feedback/acceptance), `L0-BUILD` (source and runtime), `L0-WININSTALL` (separate packaging workstream, not a universal gate). Activate existing `L1-DEMO-LOOP`. Preserve all former L2 inventory. Do not start a second interpreter, graph store, UI publisher, roadmap or effect authority. Provider APIs are prohibited; APK is deferred.

## 2. The scoring policy

Estimated acceleration value = 30% downstream unlocks + 25% cross-system reuse + 20% faster feedback + 15% recurring reasoning reduction + 10% simpler implementation. Each factor is scored 0–5 and normalized to 100. Scores are estimates, **not** measured speedups. Critical-path dependencies and readiness outrank the raw score.

Safety, privacy, explicit approvals, source pinning, independent test receipts and fresh-revision refusal are constraints, not tradeable score inputs.

## 3. Active Acceleration Batch A

| Order | Lane | Score | Work order | Hard dependencies | Prove |
|---|---|---:|---|---|---|
| A00 | B | 89 | Truth and queue repair | none | Fix erroneous Wiki verifier assumptions; distinguish source/executed/verified/accepted; reconcile contradictory release ledgers |
| A01 | C | 95 | One-command Host and acceptance runner | none | Isolated Host + actual endpoint exits, versions, stdout/stderr and receipts |
| A02 | A | 96 | Canonical stateful chat↔Wiki projection | none | One journal-backed state/revision, persistent across refresh/restart and guarded mutations |
| A03 | B | 96 | Demo feedback-to-work-order compiler | A00 | Deliberate demo failure yields one deduplicated, owned, source-pinned repair |
| A04 | A | 91 | Narrow realtime NL→VLang/VEC visual compiler | A02 | Three tested NLP intents produce guarded, source-backed UI updates |
| A05 | B | 94 | Authorized build→verify→demo→requeue | A01,A02,A03 | One actual repair reaches an independent executed receipt, demo rewalk and next queue decision |
| A06 | C | 90 | Incremental RDCB/context reuse | A01,A02 | Stable reuse digest, selective invalidation, identity isolation; no false execution claims |
| A07 | C | 81 | Parallel worker convergence | A05,A06 | Two nonoverlapping tasks converge; same-path/stale-head writes are refused |
| A08 | A | 67 | Windows Host and physical paired PWA proof | A02,A04 | Physical HTTPS pairing, revocation, restart, revision-consistency evidence |

A00–A02 are now `in-progress` with `execution=SOURCE_LANDED_TESTS_UNRUN`; A03–A08 remain `queued`. All nine retain `verification=UNRUN` and `ownerAcceptance=PENDING` until actual independent results. Every record supplies write scopes, acceptance checks, source references, dependency IDs and an estimated score breakdown. Dependencies are satisfied by independently accepted results, never merely the words "implemented", "executed" or "source-wired".

### Three lanes start in parallel

**Lane A — Product state/visual runtime:** A02 → A04 → A08. Own the canonical Host projection and tightly scoped VLang/VEC compile targets. Prove "open the wiki" navigation; "show ARBOR progress and blockers" source-backed visual rendering; and "change this section" approved typed diff, stale-revision refusal and persistence.

**Lane B — Demo/roadmap flywheel:** A00 → A03 → A05. Own the one-writer roadmap and independent verifier. Consume real demo failures, generate minimal work orders, dedupe them, and rewalk the real product instead of accepting static fixture screenshots.

**Lane C — Runner/context/parallelism:** A01 → A06 → A07. Reuse existing Host test infrastructure, HQKG/Rust, RDCB generator and worker orchestration. Capture actual exits, cache invalidation and context reuse; detect file-scope collision before integration.

Concurrent authoring is allowed only in disjoint write scopes. When scopes overlap, serialize under the existing sole-writer/fresh-head CAS contract. No worker gains blanket Host effect access from planning approval.

## 4. Existing evidence and contradictions must survive

Historical Batch 1 items remain in `archivedBuildBatches`, retaining reported `executed` bookkeeping and the actual receipts: Chat 11/11 *narrow* checks (including unchanged state), Wiki 8/10 with failed source/DOM and journal assumptions, RDCB 12/12 *generator only*. Independent keeper acceptance remains UNRUN; two-screen end-to-end is not accepted.

`integration/beta-gates.json` reports UNBLOCKED while `.integration/proposal5/08-BETA-GATES.json` says PROPOSED_UNRUN and `integration/release-manifest.json` says BLOCKED_NOT_BUILT. A00 must reconcile the contradictory **claims** using observed receipts, without falsifying or rewriting history. HVI GitHub Actions startup_failure with zero jobs is not a passing or failing test process.

## 5. Definition of done and next frontier

Every closed task must have: exact baseline/result SHA, owner, permitted changed paths, OS/runtime versions, literal test command/exit, independent verifier receipt, actual product route rewalk, applicable Host approval/revocation checks, provenance/revision, and measured subsequent-task acceleration or explicit `NOT_YET_MEASURED`. Mark UNRUN where test execution is unavailable.

The keeper selects the ready frontier deterministically from the roadmap. Initial ready set is **A00 + A01 + A02**. When A00 is accepted, A03 becomes eligible; A02 unlocks A04; A01+A02 unlock A06; A01+A02+A03 unlock A05; and the remaining frontier follows the machine dependencies. Do not automatically mutate the queue or start effectful workers from a read-only readiness command. Owner gates are per batch; authorized deterministic checks may be automatic within that batch, never bypassing Host approvals.

Metrics, initially `NOT_MEASURED`: verified demo cycles, feedback-to-verified-change seconds, manual clarification rate, context reused fraction, verified changes per measured compute spend, and false-green acceptance count (target zero). Ask after each batch: what later task became faster, by how much and based on what evidence?

## 6. Read-only local operator commands

```sh
node scripts/roadmap/acceleration-queue.mjs --check
node scripts/roadmap/acceleration-queue.mjs --ready
node --test scripts/roadmap/acceleration-queue.test.mjs
```

This CLI validates and selects; it does **not** create agents, change the roadmap, approve batches or perform Host effects. The existing roadmap keeper owns subsequent file writes. No new orchestration runtime or second queue.

## 7. Explicit exclusions from Batch A

Do not promote Provider Hub branches into main, launch the 100-agent UI engine fleet, rerun unapproved donor comparisons, merge HVI draft source without its synthetic Node24/security receipts, claim live provider integration, or package an APK. Keep these programs in the inventory and activate only on verified dependency/use-case need.

**Milestone 1:** PC chat changes an accurate, durable source-backed second-screen Wiki through the existing Host authority. **Milestone 2:** ARBOR finds a defect in that experience, creates the smallest repair, executes within approvals, independently verifies, and demonstrates the correction. This is the first truly compounding ARBOR flywheel.

## 8. Execution checkpoint (2026-11-14)

Source changes for A00 (evidence verifier, release-conflict projection, corrected canonical Host tests), A01 (one-command isolated Host test runner), and A02 (persistent data-root journal, chat/Wiki projection, revision guard, external CSP-compliant JS/CSS) have landed on `main`. Source parse and isolated V8 logic checks were performed; **actual Node24/Windows/Android/browser tests are UNRUN** here. The next action is to run and inspect:

```
node scripts/roadmap/acceleration-queue.mjs --check
node scripts/roadmap/evidence-truth.mjs --check
node --test apps/vivim-host/test/product-journal.test.mjs apps/vivim-host/test/product-routes.test.mjs apps/vivim-host/test/chat-box-baseline.test.mjs
node --test scripts/roadmap/acceleration-queue.test.mjs scripts/roadmap/evidence-truth.test.mjs scripts/acceleration/live-host-check.test.mjs
```

The isolated Host runner additionally invokes the repaired Wiki evidence runner with an explicit ephemeral base URL. It cannot be aimed at a live user's Host without the isolated-run flag. This checkpoint is **not** independent acceptance of A00–A02 and does not unlock dependent work.
