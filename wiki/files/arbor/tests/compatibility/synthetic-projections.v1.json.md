# File: tests/compatibility/synthetic-projections.v1.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | tests/compatibility/synthetic-projections.v1.json |
| Language | JSON |
| Kind | config |
| Size | 1246 B |
| Lines | 53 |
| Hash | 0ccf171eedb3 |
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
  "schema": "arbor.w01f.synthetic-only/1",
  "source": {
    "id": "synthetic://owner-a/context-01",
    "domain": "personal",
    "ownerRef": "synthetic-owner-a",
    "revision": 4
  },
  "wrongOwner": {
    "id": "synthetic://owner-a/context-01",
    "domain": "personal",
    "ownerRef": "synthetic-owner-b",
    "revision": 4
  },
  "stale": {
    "id": "synthetic://owner-a/context-01",
    "domain": "personal",
    "ownerRef": "synthetic-owner-a",
    "revision": 3
  },
  "grounded": {
    "schema": "arbor.inert-view/1",
    "source": {
      "id": "synthetic://owner-a/context-01",
      "domain": "personal",
      "ownerRef": "synthetic-owner-a",
      "revision": 4
    },
    "inert": true,
    "status": "grounded",
    "actions": [
      "vivim.status.show"
    ]
  },
  "candidate": {
    "schema": "arbor.inert-view/1",
    "source": {
      "id": "synthetic://owner-a/context-01",
      "domain": "personal",
      "ownerRef": "synthetic-owner-a",
      "revision": 4
    },
    "inert": true,
    "status": "candidate",
    "actions": []
  },
  "unownedPersonal": {
    "id": "synthetic://unowned",
    "domain": "personal",
    "ownerRef": null,
    "revision": 1
  }
}
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
