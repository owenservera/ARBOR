# File: .coordination/evidence/arbor-area-a-slice.units.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | .coordination/evidence/arbor-area-a-slice.units.json |
| Language | JSON |
| Kind | config |
| Size | 69257 B |
| Lines | 2407 |
| Hash | cb6d18b01421 |
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
  "lane": "A",
  "laneRows": 1076,
  "nextRows": 30,
  "verifyRows": 435,
  "units": [
    {
      "id": "NEXT:D01:managed-delta-ingest",
      "phase": "NEXT",
      "priority": "P0",
      "rowCount": 5,
      "rowIds": [
        "AT-001113D995E8",
        "AT-EF9F4CDEA8AC",
        "AT-E91209CD1800",
        "AT-408CCB844DD1",
        "AT-6BD4961AB7EF"
      ],
      "paths": [
        "native/hqkg/src/bin/hqkg-personal.rs",
        "native/hqkg/src/graph_change_set.rs",
        "native/hqkg/src/scoped_graph.rs",
        "native/hqkg/tests/host_context_sync.rs"
      ],
      "closures": [
        "EXISTING REPAIR UNIT"
      ],
      "nextPackages": [
        "D01"
      ],
      "packageOwners": [
        "A"
      ],
      "acceptance": "Actual update is revision-fenced, idempotent and cannot cross namespace.",
      "done": false,
      "targets": {
        "Target Rust": 5,
        "Target Host": 5,
        "Target PWA": 2,
        "Target VLANG": 4,
        "Target AutoWiki": 4
      },
      "reachabilityBlank": 0,
      "evidenceGrades": [
        "DIRECT / SEARCH",
        "SYMBOL / DIRECT",
        "TREE / PROVISIONAL",
        "TREE / PATH ONLY"
      ],
      "runtimeTests": [
        "UNRUN"
      ],
      "dispositions": [
        "EXTEND",
        "FIRST PASS — REVIEW REQUIRED"
      ],
      "currentStates": [
        "AUDIT FINDING — OPEN",
        "REVIEW REQUIRED",
        "INVENTORIED — NOT DISPOSITIONED"
      ],
      "granularities": [
        "File",
        "Symbol"
      ],
      "subsystems": [
        "Rust core"
      ],
      "shouldIntegrate": [
        "Yes",
        "Undetermined"
      ],
      "reviewBases": [
        "BODY + EXACT HOST CALLER",
        "PINNED CALLABLE WINDOW + LEXICAL SCAN",
        "BODY + MODULE CALLER",
        "TEST BODY; UNRUN"
      ],
      "decisionConfidences": [
        "SOURCE-SUPPORTED PROPOSAL; NOT RUNTIME ACCEPTANCE",
```

_First 80 of 2407 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
