# W1-E Provider Hub graph proposal port

Status: SOURCE_PREPARED, MOCK_ONLY; no native Rust ABI or live provider integration.

## Public boundary

Import index.mjs from the canonical ProviderHub service (W1-B after G integration). createMockGraphPort({readAuthority, verifySourceRef, fault}) yields {schema, mode, propose, check}. Both readAuthority and verifySourceRef MUST be injected and MUST be supplied by a Host-owner-controlled implementation when integrated. Omitting either refuses. No implicit mock fallback in live mode is provided.

- propose({expected,sources}) returns a deterministic, versioned and inert GraphChangeSet-shaped source-reference proposal.
- check({proposal,sources}) re-reads Host authority, validates exact CAS and source evidence, and returns MOCK_VALIDATED with applied=false, persisted=false, rustValidated=false, hostCommitted=false, mockReceipt=false. It is NOT a graph transaction or receipt.
- expected: {owner,worldId,graphEpoch,accountRef,accountEpoch,grantRevision}.
- sources: array of up to 100 {providerId,accountRef,sourceRef,sourceRevision,provenanceDigest,coverage:'complete'}.
- Mock accountRef and sourceRef must be synthetic://. Never provide raw messages, E2EE content, contact lists, cookies, tokens, attachments or private body fields; unexpected fields refuse.
- A structural SHA-256 provenance digest is not authenticated just because it has a valid format. The injected verifier must affirm accepted source and revision exactly. Test verifier only uses invented fixtures.
- check detects grant revocation, account swap, changed epoch, stale graph revision, changed proposal bytes, denied/offline/partial/uncertain script states. Unknown outcomes never retry.

## Native code inspected on ARBOR main e0c510712b7e93c9f2e8d0c4991b06dc0b6c92c0

- native/hqkg/src/scoped_graph.rs: qualified_id, node, apply_scoped; structural provenance, namespace and clone-then-apply.
- native/hqkg/src/typed_dag.rs: Namespace{Personal,owner}, RevisionToken{namespace,graph_epoch}; requires owner authentication outside Rust.
- native/hqkg/src/graph_change_set.rs: GraphChangeSet, ChangeOp::PutNode, ApplyLedger; already owns graph mutation algorithm.
- apps/vivim-host/control/dispatcher.mjs and control/journal.mjs: the existing sole Host authority for effects, claims and receipts.

This JavaScript data shape is a PROPOSED mapping to Rust structs, not a verified FFI or serializable ABI. Do not call apply_scoped, write a new graph store, or treat MOCK_VALIDATED as accepted World evidence.

## Execution and G handoff

Node >=22: node --test apps/vivim-host/provider-hub/ports/graph/index.test.mjs

G must first confirm W0 accepted gate ancestry (this branch used a provisional main base because W0-G was not available), then reconcile W1-A schema, W1-B service and W1-C Host evidence callback; the shared changes are for G to apply, not for lane E to edit. Native Rust bridge tests, Host end-to-end tests, Windows/PWA and real provider/device verification remain UNRUN.
