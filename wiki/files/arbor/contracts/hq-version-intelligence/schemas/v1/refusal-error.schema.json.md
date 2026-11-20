# File: contracts/hq-version-intelligence/schemas/v1/refusal-error.schema.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | contracts/hq-version-intelligence/schemas/v1/refusal-error.schema.json |
| Language | JSON |
| Kind | config |
| Size | 1310 B |
| Lines | 59 |
| Hash | 02e78ee58f7f |
| Test | no |
| Generated | no |
| Component | contracts |

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
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://schemas.arbor.local/hvi/v1/refusal-error.schema.json",
  "title": "ARBOR HVI refusal-error v1",
  "description": "Source-only normative wire contract; no runtime authority inferred.",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "schema",
    "code",
    "message",
    "owner",
    "retryable",
    "scope",
    "evidenceRefs"
  ],
  "properties": {
    "schema": {
      "const": "arbor.hvi.refusal-error/1"
    },
    "code": {
      "enum": [
        "PIN_NOT_FOUND",
        "SOURCE_UNAUTHORIZED",
        "PIN_MOVED",
        "SCOPE_ESCAPE",
        "INCOMPLETE_SCAN",
        "DIGEST_CONFLICT",
        "ID_CONFLICT",
        "EQUIVALENCE_UNPROVEN",
        "RESOURCE_LIMIT"
      ]
    },
    "message": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024
    },
    "owner": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024
    },
    "retryable": {
      "type": "boolean"
    },
    "scope": {
      "const": "development"
    },
    "evidenceRefs": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 1024
      }
    }
  }
}
```

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
