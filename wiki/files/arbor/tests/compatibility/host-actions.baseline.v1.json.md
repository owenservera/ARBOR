# File: tests/compatibility/host-actions.baseline.v1.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | tests/compatibility/host-actions.baseline.v1.json |
| Language | JSON |
| Kind | config |
| Size | 2597 B |
| Lines | 107 |
| Hash | 2e36b23427f5 |
| Test | yes |
| Generated | no |
| Component | tests |

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
  "schema": "arbor.test-only.host-catalog-baseline/1",
  "note": "TEST-ONLY: no executable catalog; Host apps/vivim-host/control/action-catalog.v1.json is the exclusive action/risk owner.",
  "sourceRepo": "owenservera/vivim-web-harness",
  "sourceCommit": "cae97afe848d79957c9d6c698a90996a758bfd56",
  "sourcePath": "apps/vivim-host/control/action-catalog.v1.json",
  "sourceBlobSha": "c423d5933c28ca9f534028aeaffd7929f767c269",
  "catalogVersion": 6,
  "actions": [
    {
      "id": "control.catalog.list",
      "risk": "R0",
      "readiness": "source_wired"
    },
    {
      "id": "vivim.status.show",
      "risk": "R0",
      "readiness": "source_wired"
    },
    {
      "id": "devices.summary",
      "risk": "R0",
      "readiness": "source_wired"
    },
    {
      "id": "devices.approve",
      "risk": "R2",
      "readiness": "source_wired"
    },
    {
      "id": "devices.revoke",
      "risk": "R2",
      "readiness": "source_wired"
    },
    {
      "id": "personalization.context.summary",
      "risk": "R0",
      "readiness": "source_wired"
    },
    {
      "id": "personalization.preference.list",
      "risk": "R0",
      "readiness": "source_wired"
    },
    {
      "id": "personalization.preference.add",
      "risk": "R1",
      "readiness": "source_wired"
    },
    {
      "id": "personalization.preference.remove",
      "risk": "R1",
      "readiness": "source_wired"
    },
    {
      "id": "ui.theme.show",
      "risk": "R0",
      "readiness": "source_wired"
    },
    {
      "id": "ui.theme.set_preset",
      "risk": "R1",
      "readiness": "source_wired"
    },
    {
      "id": "ui.theme.undo",
      "risk": "R1",
      "readiness": "source_wired"
    },
    {
      "id": "privacy.hard_no.list",
      "risk": "R0",
      "readiness": "source_wired"
    },
    {
      "id": "privacy.hard_no.add",
      "risk": "R2",
      "readiness": "source_wired"
    },
    {
```

_First 80 of 108 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
