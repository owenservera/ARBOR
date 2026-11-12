# ARBOR HQ Version Intelligence — Native Tool G1

Stable capability ID: arbor.hvi.compare.pinned/1
Library: hq/version-intelligence/integration/index.mjs, export runHviTool
CLI: node hq/version-intelligence/integration/cli.mjs --synthetic-stdin
Input: arbor.hvi.tool-request/1
Output: arbor.hvi.tool-result/1

## Intent and trigger examples

- Compare commits A, B, and C of the same explicitly selected repository.
- Compare explicitly authorized donor repositories against a target pin.
- Explain which source files were identical, changed, relocated, physically absent or unobservable.
- Report source provenance, incompleteness, lineage hints and evidence, not assumed runtime parity.

This G1 tool is a native read-only library and synthetic-only local CLI. It is NOT registered in the Host agent or command router yet. H owns actual registration and live actor/session/grant authorization in existing command and action machinery. An injected authorization callback in the library is operator-provided and NOT cryptographically Host-attested.

## Typed call and approval

Call runHviTool with:
- schema: arbor.hvi.tool-request/1
- sourceManifests: array of 2..16 validated Lane-A arbor.hvi.manifest/1 objects, each including its signed-off immutable pin copy. Acquisition occurs separately in Lane A.
- targetPinId: one of the supplied immutable SHA256 pin IDs; branch names are only provenance.
- pairwise: optional boolean, false by default.
- scope: bounded approved source prefixes.
- budgets: maxPins, maxEntries, maxFindings, maxPairs.
- includeParity: optional physical D atlas join, false by default.
- identityRecords/identityLinks: optional source declarations, NEVER owner approval.
- identityDecisions: must be absent or empty until separate authenticated Host receipt acceptance.
Supply options.authorize for each source and options.signal for cancellation.

Each call checks every source against the provided authorize callback; denial is terminal. Host H must replace this with live actor/session-grant validation, including revoke/refuse, prior to any remote agent routing. No guessed privileges, no extra Git readers, no ambient checkout, no worker orchestration.

The pre-H CLI accepts ONLY synthetic/* repositories from stdin with explicit --synthetic-stdin. It NEVER resolves an actual Git ref, reads credentials, clones a donor, accesses a provider app, writes files, or launches scheduled scans.

## Trust and completion

Native A manifest SHA256 and projected C SHA256 are computed independently; bridge receipts bind both to immutable repo/commit/tree/pin. Native A provenance is retained without being re-typed as a C digest. The C comparison envelope is kept intact with full donor coverage; E is a sanitized pagination view, not lossless truth itself. D physical file absence NEVER means missing capability. B cross-repo identity candidates are source claims, not signed equivalence. No runtime or beta evidence may be manufactured.

The G1 integration gate is GO_FOR_W2_TOOLING only after observed real Node24 synthetic tests, strict Draft 2020-12 schema checks, independent source review and normal PR merge. Host H and TierFlow U are separate W2 work. Actual ARBOR/VIVIM/Labs comparison is explicitly deferred until a later user-triggered request and fresh grants.

## Machine-discoverable definition

HVI_TOOL_DEFINITION is exported by the native index module, with capability ID, input/output schemas, trigger examples, grant obligations and read-only effects policy. H must bind that definition into the existing canonical Host registry; no second registry, graph, scheduler, action executor, browser controller or TierFlow publisher is permitted.
