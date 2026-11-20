# File: .coordination/evidence/arbor-area-d-slice.units.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | .coordination/evidence/arbor-area-d-slice.units.json |
| Language | JSON |
| Kind | config |
| Size | 10075 B |
| Lines | 389 |
| Hash | dbdcb86361f0 |
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
  "lane": "D",
  "laneRows": 748,
  "nextRows": 13,
  "verifyRows": 0,
  "units": [
    {
      "id": "NEXT:D02.context-existing-read-port",
      "phase": "NEXT",
      "priority": "P1",
      "rowCount": 1,
      "rowIds": [
        "AT-9237D196A64F"
      ],
      "paths": [
        "apps/mobile-relay/app.js"
      ],
      "closures": [],
      "nextPackages": [
        "D02"
      ],
      "packageOwners": [
        "A"
      ],
      "acceptance": "Same committed source usable in UI and instruction; revoked grant clears displayed data.",
      "done": false,
      "targets": {
        "Target Rust": 1,
        "Target Host": 1,
        "Target PWA": 1,
        "Target VLANG": 1,
        "Target AutoWiki": 1
      },
      "reachabilityBlank": 1,
      "evidenceGrades": [
        "DIRECT / SEARCH"
      ],
      "runtimeTests": [
        "UNRUN"
      ],
      "dispositions": [
        "EXTEND"
      ],
      "currentStates": [
        "AUDIT FINDING — OPEN"
      ],
      "granularities": [
        "File"
      ],
      "subsystems": [
        "PWA"
      ],
      "shouldIntegrate": [
        "Yes"
      ],
      "reviewBases": [
        "D-F01 selected executable ranges; selected body + caller evidence; runtime UNRUN"
      ],
      "decisionConfidences": [
        "MEDIUM — selected source evidence, not exhaustive reverse callers; runtime UNRUN"
      ],
      "boundaryOwners": [
        "PWA"
      ],
      "topLevelStates": [
        "TOP LEVEL — SOURCE SUPPORTED"
      ],
      "evidenceTiers": [
        "PRIOR PINNED SOURCE — TOP-LEVEL"
      ],
      "reviewPackages": [
        "D02"
      ],
      "reviewRoles": [],
      "laneReviewNeeds": [
        "REVALIDATE — prior decision, do not silently overwrite"
      ],
      "knownMissing": [
        "Trace actual Host route and whether scoped context is consumed by instruction/planning; inspect markdown escaping; absen..."
      ],
```

_First 80 of 389 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
