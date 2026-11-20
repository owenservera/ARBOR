# File: .coordination/evidence/arbor-area-c-slice.units.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | .coordination/evidence/arbor-area-c-slice.units.json |
| Language | JSON |
| Kind | config |
| Size | 71316 B |
| Lines | 2443 |
| Hash | 4629590e6b08 |
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
      "priority": "P0",
      "rowCount": 4,
      "rowIds": [
        "AT-64713736D0D1",
        "AT-ECC846F6B5BA",
        "AT-EE5630007A77",
        "AT-5E05C518128E"
      ],
      "paths": [
        "studio/src/studio/server.mjs",
        "studio/src/studio/core-runtime-bridge.mjs",
        "studio/src/studio/integration-hub.mjs",
        "studio/src/studio/world-control-lineage.mjs"
      ],
      "closures": [],
      "nextPackages": [
        "D06"
      ],
      "packageOwners": [
        "?"
      ],
      "acceptance": "Prove real caller or deliberate internal/dev status; Real product caller and consumer proven; no duplicated Host effect path.",
      "done": false,
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
      "evidenceGrades": [
        "DECLARATION / PROPOSED"
      ],
      "runtimeTests": [
        "UNRUN"
      ],
      "dispositions": [
        "TRACE_AND_DISPOSE",
        "PRESERVE_AUTHORITY",
        "TRACE_AND_CONNECT",
        "EXTEND"
      ],
      "currentStates": [
        "CALLER REVIEW REQUIRED"
      ],
      "granularities": [
        "Symbol"
      ],
      "subsystems": [
        "Studio"
      ],
      "shouldIntegrate": [
        "Conditional",
        "No",
        "Yes"
      ],
      "reviewBases": [
        "BODY / SPECIFIC BOUNDARY"
      ],
      "decisionConfidences": [
        "MEDIUM — evidence-backed proposal"
      ],
      "boundaryOwners": [],
      "topLevelStates": [
        "PRIOR DISPOSITION"
      ],
      "evidenceTiers": [],
      "reviewPackages": [],
```

_First 80 of 2443 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
