# File: .coordination/evidence/arbor-area-e-slice.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | .coordination/evidence/arbor-area-e-slice.json |
| Language | JSON |
| Kind | config |
| Size | 323411 B |
| Lines | 4708 |
| Hash | 3cac06e43b4f |
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
      "ledgerKey": "D05-E01-reproducible-packaging",
      "unkeyed": false,
      "rowCount": 2,
      "rowIds": [
        "AT-CE1EAA2642DA",
        "AT-7AE45AD102EA"
      ],
      "priority": "P0",
      "priorities": [
        "P0",
        "P1"
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
      "acceptanceVariants": 2,
      "runtimeTests": [
        "UNRUN"
      ],
      "testManifest": [
        "(blank)"
      ],
      "evidenceGrades": [
        "DIRECT / SEARCH",
        "TREE / PROVISIONAL"
      ],
      "targets": {
        "Target Rust": 1,
        "Target Host": 1,
        "Target Tauri": 1
      },
      "reachabilityBlank": 0,
      "paths": [
        "tools/packaging/prepare-host-runtime.mjs",
        "package.json"
      ],
      "detail": [
        {
          "id": "AT-CE1EAA2642DA",
          "path": "tools/packaging/prepare-host-runtime.mjs",
          "symbol": "",
          "action": "Currently stages four native binaries; extend only proven production ports. Freeze manifest and verify clean installed runtime.",
          "acceptance": "Installed runtime launches all required binaries without Cargo/Bun/Git; no debug fallback.",
          "runtime": "UNRUN",
          "reach": "BUILD PATH — CLEAN CHECKOUT BLOCKER",
          "manifest": "",
          "closure": "BUILD/VERIFICATION",
          "priority": "P0",
          "source": "https://github.com/owenservera/ARBOR/blob/e07e61385a53f30890b4a7f7441fe25d22a79b1c/tools/packaging/prepare-host-runtime.mjs",
          "Granularity": "File",
          "Subsystem": "Tauri / Packaging",
          "Should integrate?": "Yes",
          "Disposition": "PACKAGE",
          "Current state": "AUDIT FINDING — OPEN",
          "Review basis": "E-F01 fresh pinned source anchors; partial caller trace",
          "Source finding": "Required lock absent; stages four existing Rust CLIs; final node --check proves syntax only.",
          "Atomic decision / boundary": "CHANGE - Reuse staging; retain signature/hash/exclusions/rollback; clean Windows module-resolution and Host boot proof.",
          "Acceptance / exit": "Reuse staging; retain signature/hash/exclusions/rollback; clean Windows module-resolution and Host boot proof.",
          "Decision confidence": "SOURCE SUPPORTED PARTIAL; runtime UNRUN",
          "Caller verification": "PARTIAL - source anchors and selected imports/references; exhaustive reverse callers, mounting and execution not established",
          "Evidence detail / anchor": "Pinned blob 03739ce10ec3c6b72a1a9f8552ac658779f3cda2; lines 11-28,34-49,53-83",
          "Notes": "E-F01 prior values (base 92074ea249d0c30741790cf11bb1a49d17c97796): {\"Review HEAD\":\"e07e61385a53f30890b4a7f7441fe25d22a79b1c\",\"Review basis\":\"PINNED SOURCE — TOP-LEVEL\",\"Resolved action\":\"CHANGE\",\"Phase decision\":\"NEXT\",\"Revised priority\":\"P0\",\"Revised should wire?\":\"Yes — repair existing build/verification closure; not new product authority\",\"Source finding\":\"14–17 requires root bun.lock; 50–58 --lock is the explicit generation route; 69–76 builds four native binaries then frozen install. Full pinned tree lacks root bun.lock.\",\"Atomic decision / boundary\":\"REPAIR CONFIRMED BUILD / COVERAGE GAP; Generate and review a real root lock; verify clean frozen install, --check/--stage and required packaged native binaries. Preserve binary signature verification.\",\"Acceptance / exit\":\"Generate and review a real root lock; verify clean frozen install, --check/--stage and required packaged native binaries. Preserve binary signature verification.\",\"Implementation unit / dedup key\":\"D05-LOCK-REPRODUCIBILITY\",\"Top-level boundary owner\":\"Build / verification\",\"Evidence detail / anchor\":\"14–17 requires root bun.lock; 50–58 --lock is the explicit generation route; 69–76 builds four native binaries then frozen install. Full pinned tree lacks root bun.lock.\",\"Caller verification\":\"Tauri resources/runtime; packaged Host; Cargo, Bun\",\"Decision confidence\":\"HIGH — concrete source/tree gap\",\"Remaining evidence required\":\"Run actual acceptance; complete caller trace for any new integration.\",\"Runtime test\":\"UNRUN\",\"Target Rust\":\"3\",\"Target Host\":\"3\",\"Target Studio\":\"\",\"Target PWA\":\"\",\"Target HQ\":\"\",\"Target VLANG\":\"\",\"Target TierFlow\":\"\",\"Target Harness\":\"\",\"Target AutoWiki\":\"\",\"Target Tauri\":\"4\"}",
          "Disposition round": "FB02",
          "Resolved action": "CHANGE",
```

_First 80 of 4708 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
