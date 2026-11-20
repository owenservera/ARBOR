# File: docs/data-intelligence/schemas/data-asset.v1.schema.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | docs/data-intelligence/schemas/data-asset.v1.schema.json |
| Language | JSON |
| Kind | config |
| Size | 367 B |
| Lines | 17 |
| Hash | 62da9811fdd3 |
| Test | no |
| Generated | no |
| Component | docs |

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
  "type": "object",
  "properties": {
    "schema": { "const": "vivim.data-asset/1" },
    "model": {
      "properties": {
        "observedState": { "enum": ["verified", "unverified", "unavailable"] }
      }
    },
    "content": {
      "properties": {
        "authorityRef": { "type": ["string", "null"] }
      }
    }
  },
  "additionalProperties": false
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
