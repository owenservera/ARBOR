# VIVIM Universal Software Absorption — R001

Owner direction 2026-11-25: build a continuously expandable integration substrate, not 1,000 hand-coded adapters. Craft Anything initially observes software; DeepSeek proposes semantic matches; deterministic Rust owns learned contracts. Host alone authorizes effects. The registry never grants execution.

## Corpus
Ten disjoint waves, 100 unique application targets each: global popularity; legal (50) and accounting (50); finance/insurance; healthcare; business/enterprise; engineering/technology; education/research; retail/logistics; travel/real estate; government/administration. Preserve dated ranking provenance, selection rationale, canonical application identity and origins. No claim of ranked coverage until sources are ingested. R1 breadth: permitted public surfaces; R2 authorized interiors; R3 explicit operational verification with controlled effects. Do not harvest user content, credentials or protected enrollment surfaces. Observe access limits, rate limits and applicable site terms; record gaps rather than evade them.

## Open-world model
A primitive is a versioned semantic contract: namespaced ID, typed input/output schema references, effect class, invariants, optional capabilities and links (specializes/composes/related). New IDs and links require no registry code change. Model concepts and operations separately; e.g. conversation/message entities vs messaging.send operation. Graph edges are not proof of substitutability; matching requires compatible contracts and evidence. Unknown extensions remain proposals. Avoid rigid inheritance trees and application-specific UI enums.

Application binding: exact app identity + origin + primitive revision + adapter revision + declared Host capability reference + evidence references. Bindings describe how to perform a known operation; they do not confer authority. Same names/labels alone never prove semantic equivalence. Different features (delivery, threading, encryption, edits) are explicit extensions rather than silently normalized away. Preserve source-specific identifiers and round-trip semantics.

## Pipeline
1. Ingest ranked/curated targets into a durable deduplicated queue. Persist lease, attempt, checkpoint, bounded retry, backoff, pause and cancellation. Workers must be replaceable.
2. Dispatch through existing Studio/Craft runtime in isolated authorized browser contexts. Preserve origin and evidence provenance; exclude sensitive capture surfaces.
3. Normalize observations into inert evidence, using existing Craft intelligence source/projection contracts. Separate observed, derived, inferred and unknown.
4. Propose matches against the registry. Reuse exact compatible semantics; ambiguous matches and novel operations become explicit reviewable candidates. No model-produced evidence is self-attesting.
5. Compile a declarative integration package (primitive revisions, bindings, typed VLANG operations, evidence references, adapter dependencies). Content address canonical serialized manifests; keep immutable versions and rollback.
6. Verify behavior with Host-owned execution and trusted receipts; only the Host may admit a binding for execution. Never turn discovery into permission. Read-only discovery is separate from controlled side-effect tests.
7. Register, project and reuse verified capabilities via existing Host/Harness/Studio/MCP/VLANG. GPUI/PWA share the canonical state, not another renderer.
8. Detect drift, invalidate stale bindings, recapture and recompile incrementally. Keep prior evidence and revisions for audit.

## R001 scaffold
Standalone dependency-free Rust crate, intentionally not yet added to ARBOR root workspace. Registry and graph validation, exact contract matching, evidence and candidate binding model, target queue state machine. No provider-specific selectors, API calls, model calls or browser effects. The seed taxonomy is illustrative, not exhaustive. Queue is in-memory until persistence/leases land. Evidence references are not cryptographic verification; actual admission and signed receipts must come from Host.

## Next implementation slices
- R002: reconcile with existing native application-intelligence contracts; map Craft source/projection envelopes to normalized observations, preserving evidence status and provenance.
- R003: durable SQLite registry and queue, leases and restart recovery; provenance-based ranked corpus ingestion, all 1,000 targets.
- R004: wire authorized Studio/Craft dispatch, resource budgets, cancellation, privacy and origin scope; then first real captures.
- R005: DeepSeek proposal interface plus semantic contract comparison, deduplication and review; never silently admit an inferred capability.
- R006: deterministic package compiler, content digests, signed Host receipt verification, revision activation and rollback.
- R007: VLANG/MCP projections and first verified cross-application messaging capability (Facebook/WhatsApp where authorized).
- R008: 100-target breadth pilot, then remaining nine waves; measure novel primitives, reuse, evidence coverage, drift and time/cost per application.

Acceptance: a previously unseen messaging application can reuse the same messaging contract with only a new data-driven binding and evidence; a novel operation can be registered without changing Rust types; no discovery alone permits sending a message. Measure actual integration effort; no promised zero-code coverage before real evidence.

Run scaffold tests: `cargo test --manifest-path core/absorption/Cargo.toml`.
