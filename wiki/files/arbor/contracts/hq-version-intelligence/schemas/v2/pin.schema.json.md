# File: contracts/hq-version-intelligence/schemas/v2/pin.schema.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | contracts/hq-version-intelligence/schemas/v2/pin.schema.json |
| Language | JSON |
| Kind | config |
| Size | 1768 B |
| Lines | 91 |
| Hash | a2f43577b89f |
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
  "$id": "https://arbor.local/hvi/v2/pin.schema.json",
  "title": "Pinned Source",
  "type": "object",
  "properties": {
    "schema": {
      "const": "arbor.hvi.source/1"
    },
    "pinId": {
      "type": "string",
      "pattern": "^[a-f0-9]{64}$"
    },
    "provider": {
      "const": "github"
    },
    "repoIdentity": {
      "type": "string",
      "pattern": "^[a-z0-9_.-]+/[a-z0-9_.-]+$"
    },
    "requestedRef": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 255
    },
    "resolvedCommitSha": {
      "type": "string",
      "pattern": "^[a-f0-9]{40}$"
    },
    "rootTreeSha": {
      "type": "string",
      "pattern": "^[a-f0-9]{40}$"
    },
    "subPath": {
      "type": "string",
      "maxLength": 4096
    },
    "manifestDigest": {
      "anyOf": [
        {
          "type": "string",
          "pattern": "^[a-f0-9]{64}$"
        },
        {
          "type": "null"
        }
      ]
    },
    "acquiredAt": {
      "type": "string"
    },
    "completeness": {
      "enum": [
        "complete",
        "partial",
        "blocked",
        "missing"
      ]
    },
    "scope": {
      "const": "development"
    },
    "sourceGrantRef": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 255
    },
    "evidenceRef": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 255
    }
  },
  "required": [
```

_First 80 of 92 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
