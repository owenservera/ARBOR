# File: hq/version-intelligence/integration/AGENT-USAGE.md

> Generated 2026-11-19 · Markdown · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/version-intelligence/integration/AGENT-USAGE.md |
| Language | Markdown |
| Kind | doc |
| Size | 8290 B |
| Lines | 125 |
| Hash | 3ed1d70c60ef |
| Test | no |
| Generated | no |
| Component | hq |

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
# ARBOR HQ Version Intelligence — Native Tool G1

Stable capability ID: arbor.hvi.compare.pinned/1
Library: hq/version-intelligence/integration/index.mjs, export runHviTool
CLI: node hq/version-intelligence/integration/cli.mjs --synthetic-stdin
MCP tool: hvi_compare_pinned (hq/lib/mcp.mjs, stdio JSON-RPC; listed by tools/list, run by tools/call)
Host action: versions.compare.pinned (apps/vivim-host/control/action-catalog.v1.json)
Host binding: apps/vivim-host/control/hvi-capability.mjs, createHviHostReadPort().invoke
Input: arbor.hvi.tool-request/1
Output: arbor.hvi.tool-result/1

## Intent and trigger examples

- Compare commits A, B, and C of the same explicitly selected repository.
- Compare explicitly authorized donor repositories against a target pin.
- Explain which source files were identical, changed, relocated, physically absent or unobservable.
- Report source provenance, incompleteness, lineage hints and evidence, not assumed runtime parity.

## Where it is registered, and where it is not

This capability has THREE existing registrations. None of them is a second registry.

- **HQ MCP tool `hvi_compare_pinned`** — the native agent-discovery surface. `tools/list`
  advertises it and `tools/call` runs it. `tools/call` is awaited, so the async engine is
  reachable here. In the native-tooling wave it accepts `synthetic/` fixtures only.
- **Host action `versions.compare.pinned`** — present in the canonical Host action
  catalog with `readiness: "enforcement_missing"` and `executor: null`. The Host control
  planner already routes natural language to it (`planText('compare versions')` yields
  this action id) and reports `outcome: 'unavailable'`, because the Host control plane is
  synchronous by construction and this engine is async. Promoting that row to
  `source_wired` is a Host-owner change, not a documentation change.
- **Host read port** — `createHviHostReadPort()` binds the catalog row and performs the
  read through the same HQ code paths, with a live grant recheck on every source read.

It is NOT registered in the HQ action registry (`hq/lib/actions/*`), which cites only
real `hq`/`sync` CLI verbs; and it must NOT be added there, because the HQ action
registry and the Host action registry are authoritatively different and are never merged.

## Typed call and approval

**`runHviTool` is `async`. It always returns a Promise and must be awaited.** Every
failure is a promise rejection carrying `e.code`; a `try { runHviTool(...) } catch {}`
without `await` catches nothing.

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
- reportOptions: optional, passed through to the report projection.

Supply options.authorize for each source, options.signal for cancellation, and
options.context (free provenance, echoed into every authorize payload).

Budget defaults and ceilings: maxPins 16/16, maxEntries 100000/1000000,
maxFindings 20000/100000, maxPairs 120/8128. A non-safe-integer or `<1` budget is
`RESOURCE_LIMIT`.

Error codes: INVALID_REQUEST, SOURCE_UNAUTHORIZED, RESOURCE_LIMIT, SCOPE_ESCAPE,
PIN_NOT_FOUND, EQUIVALENCE_UNPROVEN, plus bridge codes INCOMPLETE_SCAN, ID_CONFLICT and
DIGEST_CONFLICT.

Each call checks every source against the provided authorize callback; denial is terminal.
Host H must replace this with live actor/session-grant validation, including revoke/refuse,
prior to any remote agent routing. No guessed privileges, no extra Git readers, no ambient
checkout, no worker orchestration.

The CLI accepts ONLY synthetic/* repositories from stdin with explicit --synthetic-stdin.
It NEVER resolves an actual Git ref, reads credentials, clones a donor, accesses a provider
app, writes files, or launches scheduled scans. Its exit codes are 0 (success, stdout
carries the result plus `provenance: "SYNTHETIC_ONLY"`), 2 (any argument other than
exactly `--synthetic-stdin`, checked before stdin is read) and 1 (any other failure, one
`HVI_TOOL_<CODE>` line on stderr). stdin is capped at 4 MB.

## Result shape and what it never claims
```

_First 80 of 126 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
