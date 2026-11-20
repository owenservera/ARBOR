# File: .coordination/evidence/arbor-area-e-slice.units.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | .coordination/evidence/arbor-area-e-slice.units.json |
| Language | JSON |
| Kind | config |
| Size | 38402 B |
| Lines | 1444 |
| Hash | 2c5176b019fe |
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
  "lane": "E",
  "laneRows": 1053,
  "nextRows": 27,
  "verifyRows": 26,
  "units": [
    {
      "id": "NEXT:D05-E01-reproducible-packaging",
      "phase": "NEXT",
      "priority": "P0",
      "rowCount": 2,
      "rowIds": [
        "AT-CE1EAA2642DA",
        "AT-7AE45AD102EA"
      ],
      "paths": [
        "tools/packaging/prepare-host-runtime.mjs",
        "package.json"
      ],
      "closures": [
        "BUILD/VERIFICATION"
      ],
      "nextPackages": [
        "D05"
      ],
      "packageOwners": [
        "?"
      ],
      "acceptance": "Installed runtime launches all required binaries without Cargo/Bun/Git; no debug fallback.",
      "done": false,
      "targets": {
        "Target Rust": 1,
        "Target Host": 1,
        "Target Tauri": 1
      },
      "reachabilityBlank": 0,
      "evidenceGrades": [
        "DIRECT / SEARCH",
        "TREE / PROVISIONAL"
      ],
      "runtimeTests": [
        "UNRUN"
      ],
      "dispositions": [
        "PACKAGE",
        "VERIFY_PACKAGE"
      ],
      "currentStates": [
        "AUDIT FINDING — OPEN",
        "REVIEW REQUIRED"
      ],
      "granularities": [
        "File"
      ],
      "subsystems": [
        "Tauri / Packaging",
        "Development / History"
      ],
      "shouldIntegrate": [
        "Yes",
        "Conditional"
      ],
      "reviewBases": [
        "E-F01 fresh pinned source anchors; partial caller trace"
      ],
      "decisionConfidences": [
        "SOURCE SUPPORTED PARTIAL; runtime UNRUN"
      ],
      "boundaryOwners": [
        "E / packaging",
        "E / workspace"
      ],
      "topLevelStates": [
        "TOP LEVEL — SOURCE SUPPORTED"
      ],
      "evidenceTiers": [
        "PINNED SOURCE — TOP-LEVEL"
      ],
      "reviewPackages": [
        "D05"
```

_First 80 of 1444 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
