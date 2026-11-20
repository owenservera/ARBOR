# File: .coordination/evidence/arbor-area-b-slice.units.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | .coordination/evidence/arbor-area-b-slice.units.json |
| Language | JSON |
| Kind | config |
| Size | 98959 B |
| Lines | 4001 |
| Hash | 4db4bd326c54 |
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
  "lane": "B",
  "laneRows": 675,
  "nextRows": 48,
  "verifyRows": 128,
  "units": [
    {
      "id": "NEXT:B-F01-B01",
      "phase": "NEXT",
      "priority": "P0",
      "rowCount": 13,
      "rowIds": [
        "AT-D68C01D5FB47",
        "AT-D7737CC0A646",
        "AT-D693F4AFFE8D",
        "AT-A1953F72809C",
        "AT-8255EF123104",
        "AT-430FC711A497",
        "AT-C062898E6A35",
        "AT-7AD4746E44A6",
        "AT-2563EC207E6A",
        "AT-CEA535AC0938",
        "AT-F4671F461297",
        "AT-66F274D9ADFB",
        "AT-99124D1838DA"
      ],
      "paths": [
        "apps/vivim-host/direct-phone.mjs",
        "apps/vivim-host/control/dispatcher.mjs",
        "harness/src/interface/router.mjs",
        "harness/bin/wh-mcp.mjs",
        "harness/bin/wh.mjs",
        "harness/src/interface/dev-auto-approve.mjs",
        "harness/src/interface/server.mjs"
      ],
      "closures": [
        "CONFIRMED SOURCE REPAIR"
      ],
      "nextPackages": [
        "D06",
        "D03",
        "D14",
        "D02"
      ],
      "packageOwners": [
        "?",
        "A"
      ],
      "acceptance": "No production dependency on coordination/smoke tool; any real use through existing Host.",
      "done": false,
      "targets": {
        "Target Host": 13,
        "Target PWA": 13,
        "Target Harness": 13
      },
      "reachabilityBlank": 0,
      "evidenceGrades": [
        "DIRECT / SEARCH",
        "TREE / PROVISIONAL",
        "DECLARATION / PROPOSED"
      ],
      "runtimeTests": [
        "UNRUN"
      ],
      "dispositions": [
        "EXTEND",
        "KEEP_AUTHORITY",
        "KEEP_ADAPTER",
        "KEEP_DEV_TOOL"
      ],
      "currentStates": [
        "AUDIT FINDING — OPEN",
        "REVIEW REQUIRED",
        "CALLER REVIEW REQUIRED"
      ],
      "granularities": [
        "File",
        "Symbol"
      ],
      "subsystems": [
```

_First 80 of 4001 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
