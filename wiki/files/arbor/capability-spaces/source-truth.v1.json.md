# File: capability-spaces/source-truth.v1.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../projects/arbor.md) |
| Path | capability-spaces/source-truth.v1.json |
| Language | JSON |
| Kind | config |
| Size | 5084 B |
| Lines | 134 |
| Hash | b42f530845f6 |
| Test | no |
| Generated | no |
| Component | capability-spaces |

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
  "schema": "arbor.w01f.source-truth/1",
  "generatedFrom": "donor source evidence, not runtime introspection",
  "classificationScope": "IMPLEMENTED=code present; VERIFIED=source-side fixture/test evidence, NOT product acceptance; PREVIEW=non-effectful/conditional; DESIGN_ONLY=spec; DEFERRED=excluded; BLOCKED=hard unavailable",
  "releaseAvailableNow": [],
  "items": [
    {
      "id": "host-control",
      "status": "IMPLEMENTED",
      "targetPath": "apps/vivim-host/control/action-catalog.v1.json",
      "evidence": "Host JS action catalog/journal/dispatcher source present, W1-B physical integration pending",
      "gate": "G04",
      "blocker": "No live Host release or effect test",
      "releaseReady": false
    },
    {
      "id": "hq-semantic-source",
      "status": "IMPLEMENTED",
      "targetPath": "hq/lib/semantic-registry.mjs",
      "evidence": "HQ namespaced name@version semantics; no effect grants",
      "gate": "G03",
      "blocker": "HQ operational package import and isolation pending W1-D",
      "releaseReady": false
    },
    {
      "id": "tierflow-host-view",
      "status": "IMPLEMENTED",
      "targetPath": "packages/tierflow/src/visual-runtime/host/wave4-h-host-status-contract.ts",
      "evidence": "Inert Host status projection source with source fixtures",
      "gate": "G09",
      "blocker": "Live authenticated Host read-port not accepted",
      "releaseReady": false
    },
    {
      "id": "node0-prime",
      "status": "BLOCKED",
      "targetPath": "native/node0/",
      "evidence": "Labs main lacks referenced node-0-prime source; Rust R001 draft/Host integration separate",
      "gate": "G05",
      "blocker": "Native scoped actor and bounded compute not proven",
      "releaseReady": false
    },
    {
      "id": "ui-semantics",
      "status": "PREVIEW",
      "targetPath": "packages/tierflow/",
      "evidence": "Existing render semantics source; full R007 UI is not source-graduated",
      "gate": "G09",
      "blocker": "Lane E runtime import/device acceptance pending",
      "releaseReady": false
    },
    {
      "id": "context-dcb",
      "status": "PREVIEW",
      "targetPath": "apps/vivim-host/",
      "evidence": "Donor Host dcb modules source-present, no independent effect authority",
      "gate": "G10",
      "blocker": "Host owner consent and cross-surface disclosure unverified",
      "releaseReady": false
    },
    {
      "id": "personal-knowledge",
      "status": "VERIFIED",
      "targetPath": "tests/fixtures/labs/personal-knowledge/",
      "evidence": "Source-side pure normalization and synthetic Node tests only; no data import",
      "gate": "G10",
      "blocker": "No actual authorized production T0 Host ingestion",
      "releaseReady": false
    },
    {
      "id": "chronos",
      "status": "PREVIEW",
      "targetPath": "contracts/chronos/staged-contract.v1.json",
      "evidence": "Imported staged_not_activated read-only temporal protocol",
      "gate": "G10",
      "blocker": "No durable scheduler/timezone/device acceptance",
      "releaseReady": false
    },
    {
      "id": "voice-to-tasks",
```

_First 80 of 135 lines._

---

[HQ wiki](../../../index.md) · [Symbols](../../../symbols.md) · [Dependency graph](../../../graph.md) · [Documentation](../../../docs.md) · [Changes](../../../changes.md) · [Open tasks](../../../todos.md) · [Deprecated](../../../deprecated.md) · [Agent annotation protocol](../../../protocol.md) · [Glossary](../../../glossary.md) · [Using HQ](../../../context.md) · [Capabilities](../../../capabilities.md) · [Search index](../../../search.json) · [Browser view](../../../index.html)
