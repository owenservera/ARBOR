# File: contracts/hq-version-intelligence/schemas/v2/adapter-receipt.schema.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | contracts/hq-version-intelligence/schemas/v2/adapter-receipt.schema.json |
| Language | JSON |
| Kind | config |
| Size | 1781 B |
| Lines | 82 |
| Hash | 602034c9e282 |
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
  "$id": "https://arbor.local/hvi/v2/adapter-receipt.schema.json",
  "title": "Dual-digest provenance receipt",
  "type": "object",
  "properties": {
    "schema": {
      "const": "arbor.hvi.adapter.source-manifest/1"
    },
    "aDigest": {
      "type": "string",
      "pattern": "^[a-f0-9]{64}$"
    },
    "cProjectionDigest": {
      "type": "string",
      "pattern": "^[a-f0-9]{64}$"
    },
    "pinId": {
      "type": "string",
      "pattern": "^[a-f0-9]{64}$"
    },
    "repoIdentity": {
      "type": "string",
      "pattern": "^[a-z0-9_.-]+/[a-z0-9_.-]+$"
    },
    "commitSha": {
      "type": "string",
      "pattern": "^[a-f0-9]{40}$"
    },
    "rootTreeSha": {
      "type": "string",
      "pattern": "^[a-f0-9]{40}$"
    },
    "transformVersion": {
      "const": "arbor.hvi.adapter.source-manifest/1"
    },
    "policyOmissions": {
      "type": "integer",
      "minimum": 0
    },
    "observedEntries": {
      "type": "integer",
      "minimum": 0
    },
    "projectedEntries": {
      "type": "integer",
      "minimum": 0
    },
    "completeness": {
      "enum": [
        "complete",
        "partial",
        "blocked",
        "missing"
      ]
    },
    "truncated": {
      "type": "boolean"
    },
    "losses": {
      "type": "array",
      "maxItems": 0
    }
  },
  "required": [
    "schema",
    "aDigest",
    "cProjectionDigest",
    "pinId",
    "repoIdentity",
    "commitSha",
    "rootTreeSha",
    "transformVersion",
    "policyOmissions",
    "observedEntries",
    "projectedEntries",
    "completeness",
    "truncated",
    "losses"
  ],
```

_First 80 of 83 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
