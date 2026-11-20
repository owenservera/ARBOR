# File: .coordination/evidence/arbor-area-c-slice.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | .coordination/evidence/arbor-area-c-slice.json |
| Language | JSON |
| Kind | config |
| Size | 1241313 B |
| Lines | 15380 |
| Hash | 83c1b773023a |
| Test | no |
| Generated | no |
| Component | .coordination |

## Symbols

_No symbols._

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```json
{
  "lane": "C",
  "laneRows": 1189,
  "nextRows": 52,
  "verifyRows": 135,
  "units": [
    {
      "id": "NEXT:CONSOLIDATE:studio/src/studio",
      "phase": "NEXT",
      "ledgerKey": "",
      "unkeyed": true,
      "rowCount": 4,
      "rowIds": [
        "AT-64713736D0D1",
        "AT-ECC846F6B5BA",
        "AT-EE5630007A77",
        "AT-5E05C518128E"
      ],
      "priority": "P0",
      "priorities": [
        "P1",
        "P0"
      ],
      "closures": [],
      "nextPackages": [
        "D06"
      ],
      "packageOwners": [
        "?"
      ],
      "acceptance": "Prove real caller or deliberate internal/dev status; Real product caller and consumer proven; no duplicated Host effect path.",
      "acceptanceVariants": 4,
      "runtimeTests": [
        "UNRUN"
      ],
      "testManifest": [
        "(blank)"
      ],
      "evidenceGrades": [
        "DECLARATION / PROPOSED"
      ],
      "targets": {
        "Target Rust": 4,
        "Target Host": 4,
        "Target Studio": 4,
        "Target PWA": 4,
        "Target VLANG": 4,
        "Target Harness": 4,
        "Target AutoWiki": 4
      },
      "reachabilityBlank": 4,
      "paths": [
        "studio/src/studio/server.mjs",
        "studio/src/studio/core-runtime-bridge.mjs",
        "studio/src/studio/integration-hub.mjs",
        "studio/src/studio/world-control-lineage.mjs"
      ],
      "detail": [
        {
          "id": "AT-64713736D0D1",
          "path": "studio/src/studio/server.mjs",
          "symbol": "deriveSession @ L125",
          "action": "deriveSession @ L125: Inspect deriveSession (L125) within server.mjs, trace its caller and owner, then apply parent boundary: Trace server Studio service/route; converge on existing Host authorization and typed native context when appropriate.",
          "acceptance": "Prove real caller or deliberate internal/dev status; Real product caller and consumer proven; no duplicated Host effect path.",
          "runtime": "UNRUN",
          "reach": "",
          "manifest": "",
          "closure": "",
          "priority": "P1",
          "source": "https://github.com/owenservera/ARBOR/blob/e07e61385a53f30890b4a7f7441fe25d22a79b1c/studio/src/studio/server.mjs#L125",
          "Granularity": "Symbol",
          "Subsystem": "Studio",
          "Should integrate?": "Conditional",
          "Disposition": "TRACE_AND_DISPOSE",
          "Current state": "CALLER REVIEW REQUIRED",
          "Review basis": "BODY / SPECIFIC BOUNDARY",
          "Source finding": "server.mjs L138-L164: One harness store/executor shares conversation runtime; retryable tools read-only; one learned VersionedStore shared by factory and pipeline; hub constructed with these owners.",
          "Atomic decision / boundary": "Publish verified derived outcome through existing hub and Host reader, no parallel process.",
          "Acceptance / exit": "No parallel learned store or sender; unverified browser profile refuses send; unchanged registry and route authorization. Verify existing Host proof path before native consumption; no extra effect owner.",
          "Decision confidence": "MEDIUM — evidence-backed proposal",
```

_First 80 of 15380 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
