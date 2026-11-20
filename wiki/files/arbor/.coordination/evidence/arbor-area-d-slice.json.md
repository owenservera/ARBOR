# File: .coordination/evidence/arbor-area-d-slice.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | .coordination/evidence/arbor-area-d-slice.json |
| Language | JSON |
| Kind | config |
| Size | 124112 B |
| Lines | 1180 |
| Hash | 58e070d965a9 |
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
      "ledgerKey": "D02.context-existing-read-port",
      "unkeyed": false,
      "rowCount": 1,
      "rowIds": [
        "AT-9237D196A64F"
      ],
      "priority": "P1",
      "priorities": [
        "P1"
      ],
      "closures": [],
      "nextPackages": [
        "D02"
      ],
      "packageOwners": [
        "A"
      ],
      "acceptance": "Same committed source usable in UI and instruction; revoked grant clears displayed data.",
      "acceptanceVariants": 1,
      "runtimeTests": [
        "UNRUN"
      ],
      "testManifest": [
        "(blank)"
      ],
      "evidenceGrades": [
        "DIRECT / SEARCH"
      ],
      "targets": {
        "Target Rust": 1,
        "Target Host": 1,
        "Target PWA": 1,
        "Target VLANG": 1,
        "Target AutoWiki": 1
      },
      "reachabilityBlank": 1,
      "paths": [
        "apps/mobile-relay/app.js"
      ],
      "detail": [
        {
          "id": "AT-9237D196A64F",
          "path": "apps/mobile-relay/app.js",
          "symbol": "",
          "action": "Native context is separate focus panel; consume authorized typed relevant context in Talk/Wiki/Build.",
          "acceptance": "Same committed source usable in UI and instruction; revoked grant clears displayed data.",
          "runtime": "UNRUN",
          "reach": "",
          "manifest": "",
          "closure": "",
          "priority": "P1",
          "source": "https://github.com/owenservera/ARBOR/blob/e07e61385a53f30890b4a7f7441fe25d22a79b1c/apps/mobile-relay/app.js",
          "Granularity": "File",
          "Subsystem": "PWA",
          "Should integrate?": "Yes",
          "Disposition": "EXTEND",
          "Current state": "AUDIT FINDING — OPEN",
          "Review basis": "D-F01 selected executable ranges; selected body + caller evidence; runtime UNRUN",
          "Source finding": "Authenticated read-only native context is fetched by focus; epoch and session checks discard stale responses; 8-item display bound. Provider rendering acknowledges already delivered replies only.",
          "Atomic decision / boundary": "REUSE | PWA displays, Host authorizes, native retrieval owns compute.",
          "Acceptance / exit": "Query relevant source, change focus and revoke session; verify UI and planner refer to same committed source, stale data clears; no new store.",
          "Decision confidence": "MEDIUM — selected source evidence, not exhaustive reverse callers; runtime UNRUN",
          "Caller verification": "app imports build, control, transport, pairing, wiki, capture; context GET /mobile/api/chat/context.",
          "Evidence detail / anchor": "21466411b50655fc6b8f7890e21c0ec9949f2423 L2–21, L274–311, L1250–1325",
          "Notes": "",
          "Disposition round": "FB01",
          "Resolved action": "REUSE",
          "Revised should wire?": "Yes — reuse existing port",
          "Revised priority": "P1",
          "Next-phase package": "D02",
          "Phase decision": "NEXT",
```

_First 80 of 1180 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
