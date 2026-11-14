# ARBOR Unified Provider Hub R002 — W1 Lane E worker report

**Classification:** SOURCE_PREPARED / FOCUSED_TESTS_PASS / INTEGRATION_BLOCKED_ON_W0.
**Mode:** MOCK_ONLY. No live provider access, no durable graph apply, no World commit.
**Branch:** work/provider-hub-W1-E-r001
**BASE_SHA:** e0c510712b7e93c9f2e8d0c4991b06dc0b6c92c0 (ARBOR main as inspected, 2026-11-13 13:44:39 UTC).
**BASE WARNING:** The prerequisite accepted W0 Provider Hub gate head was not present in ARBOR branch list or docs/provider-hub on main when this worker began. This is an isolated PROVISIONAL branch, not a claim of W0 acceptance. W1-G must repin/replay on the accepted W0 base before GO.
**HEAD_SHA:** Resolve the exact commit SHA from this branch ref at integration time. A file cannot record its own final commit SHA without changing that SHA; the invoking response gives the exact final SHA.

## Sources independently inspected

- native/hqkg/src/scoped_graph.rs (blob 586843b56eedd4a9926bb443cbbeda80d841bda4): namespace prefix, qualified_id, node evidence/provenance structural validation and clone-then-apply apply_scoped; not Host authentication.
- native/hqkg/src/typed_dag.rs: Namespace/GraphDomain::Personal/RevisionToken graph_epoch, pure compute constraints.
- native/hqkg/src/graph_change_set.rs (blob 326d144046dd40eccf7d225237a9844e9ad72c02): GraphChangeSet/ChangeOp::PutNode/ApplyLedger.
- apps/vivim-host/control/dispatcher.mjs (blob 723865482b8a0f98ab3214b2ec6a83aaea629c43): sole Host plan/approval/claim/receipt owner with uncertain outcomes.
- apps/vivim-host/control/journal.mjs: existing durable journal; not replaced.
- apps/vivim-host/package.json: Node >=22 and node --test.
- .integration/proposal5/README.md, 09-EXECUTION-PLAYBOOK.md, foundations/FOUNDATIONAL-ARCHITECTURE.md: one ARBOR system, no donor dependency/duplicate World.
- ARBOR root AGENTS.md: absent (404); checked, not inferred.
- Labs adaptors-providers/execution-rounds: README, architecture/mock ports, execution protocol, acceptance, source pins, WAVE-MANIFEST.json, W0-G/W1-E/W1-G and W1 launcher.

Existing AI chat provider registry is not this social Hub. W0-gate absence is an external integration prerequisite; no other worker's files were changed.

## Authorized branch modifications

1. apps/vivim-host/provider-hub/ports/graph/index.mjs — injectable versioned MOCK_ONLY GraphPort with source-ref PutNode proposal, exact owner/world/account/grant/graph CAS; strict synthetic evidence and provenance; stable output; no apply/commit path. Git blob 7bbfa3ce7a7167139f2804a12b8492ea45d97a09.
2. apps/vivim-host/provider-hub/ports/graph/index.test.mjs — 13 committed deterministic tests using invented accounts, synthetic:// refs and fake SHA-256 digests. Git blob 30604f56ac25d1aee8f2809aed0d1049bc9c73e3.
3. apps/vivim-host/provider-hub/ports/graph/README.md — API, usage, integration limits.
4. docs/provider-hub/worker-reports/W1-E.md — this source-inspected handoff report.

No edits to contracts/provider-hub, World, dispatcher, Rust, root manifests, Studio, browser driver, PWA, phone application, TierFlow publisher, other lanes, ARBOR main or the shared integration branch. No new graph store, ledger or persistent state.

## Tests with actual exits (Linux container, Node.js v22.16.0)

- node --test /mnt/data/provider-hub-W1-E/ports/graph/index.test.mjs -> EXIT 0; 13/13 PASS, 0 FAIL, 0 SKIP.
- node --check /mnt/data/provider-hub-W1-E/ports/graph/index.mjs -> EXIT 0.
- node --check /mnt/data/provider-hub-W1-E/ports/graph/index.test.mjs -> EXIT 0.
- Source-byte equivalence: local git hash-object index.mjs = GitHub blob 7bbfa3ce7a7167139f2804a12b8492ea45d97a09; local git hash-object index.test.mjs = GitHub blob 30604f56ac25d1aee8f2809aed0d1049bc9c73e3. These checks make the local test exits relevant to exactly the branch's committed bytes.

Negative cases executed: foreign World/owner; wrong account; account swap between proposal and validation; CAS graph epoch; CAS grant revision; revoked grant; asynchronous identity race; invalid SHA-256/revision; contradictory duplicate; evidence refusal/exception; partial or E2EE-unavailable source; live nonsynthetic source refusal; injected untrusted source instructions/body; offline, denied and uncertain faults; mutated proposal; missing injected authority; oversized batch. Success never sets applied/persisted/rustValidated/hostCommitted/mockReceipt true.

UNRUN: actual Rust FFI/ABI and cargo test; graph native apply_scoped; actual owner World journal/grant verification; full ARBOR Host test suite; W1-A/B/C/D/F service integration; CI on the remote commit; Windows Studio/browser integration; PWA/device acceptance; any live provider read/write. No MOCK_VALIDATED result is LIVE_READ_VERIFIED, LIVE_WRITE_VERIFIED, DEVICE_VERIFIED, or a real action receipt.

## Scope/invariant checks

- Personal namespace uses Rust-compatible personal:{UTF8-byte-len}:{owner}/ encoding. Candidate nodes hold only qualified source refs, provenance revision and digest, never message body, contact or attachment contents.
- Proposal is inert, deterministic and bounded (100); duplicates coalesce, conflicting source revisions refuse.
- Before returning, graph port re-reads injected Host authority following asynchronous evidence verification, rejecting stale account/grant/graph revisions.
- No direct provider send, browser automation, provider API, Playwright/Puppeteer, network fetch, filesystem write, automatic uncertain retry, second Host/World, personal graph store, or phone app.
- Proposal mapping to Rust GraphChangeSet is still a PROPOSAL, not a documented native ABI. The injected fake verifier is synthetic, not real source provenance authentication.

## Blockers and G handoff

**B1 W0 prerequisite:** Obtain accepted W0-G GO_FOR_NEXT_MOCK_WAVE with exact integrated SHA. Compare ancestry; replay this branch's four files onto that head. Do not promote W1 without gate acceptance.

**B2 cross-lane type reconciliation:** W1-G reconcile this GraphPort with W1-A schemas, W1-B single ProviderHub service and W1-C trusted World grants/evidence. Shared file modifications must be applied by G/owning lane, NOT this worker.

**B3 real Rust binding:** Native owner must define and test a serialization/FFI contract mapping personal Namespace, RevisionToken, graph-scoped Node and GraphChangeSet. Actual apply_scoped, ledger and owner World commit remain with existing ARBOR authorities; do not activate code that bypasses them.

**B4 G tests:** Execute node --test apps/vivim-host/provider-hub/ports/graph/index.test.mjs and combined W1 validation with exact exit codes; check six lane heads, CAS refusal, source-evidence owner, no extra effects, no implicit mock fallback and missing live/device gates.

**Proposed G decision:** SOURCE_PREPARED_REQUIRES_W0_GATE_AND_W1_G, not GO_FOR_W2.
