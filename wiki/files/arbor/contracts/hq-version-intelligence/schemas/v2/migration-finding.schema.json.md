# File: contracts/hq-version-intelligence/schemas/v2/migration-finding.schema.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | contracts/hq-version-intelligence/schemas/v2/migration-finding.schema.json |
| Language | JSON |
| Kind | config |
| Size | 5308 B |
| Lines | 209 |
| Hash | 536a7163bce2 |
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
  "$id": "https://arbor.local/hvi/v2/migration-finding.schema.json",
  "title": "Typed physical-source or candidate-capability finding",
  "oneOf": [
    {
      "type": "object",
      "properties": {
        "id": {
          "type": "string",
          "pattern": "^[A-Za-z0-9][A-Za-z0-9._:@/#-]{0,255}$"
        },
        "originPinId": {
          "type": "string",
          "pattern": "^[a-f0-9]{64}$"
        },
        "targetPinId": {
          "type": "string",
          "pattern": "^[a-f0-9]{64}$"
        },
        "originRepo": {
          "type": "string",
          "pattern": "^[a-z0-9_.-]+/[a-z0-9_.-]+$"
        },
        "originSha": {
          "type": "string",
          "pattern": "^[a-f0-9]{40}$"
        },
        "originPath": {
          "anyOf": [
            {
              "type": "string",
              "minLength": 1,
              "maxLength": 4096,
              "pattern": "^(?!/)[^\\\\\\x00-\\x1f]+$"
            },
            {
              "type": "null"
            }
          ]
        },
        "originBlob": {
          "anyOf": [
            {
              "type": "string",
              "pattern": "^[a-f0-9]{40}$"
            },
            {
              "type": "null"
            }
          ]
        },
        "targetPaths": {
          "type": "array",
          "items": {
            "type": "string",
            "minLength": 1,
            "maxLength": 4096,
            "pattern": "^(?!/)[^\\\\\\x00-\\x1f]+$"
          }
        },
        "targetBlobs": {
          "type": "array",
          "items": {
            "anyOf": [
              {
                "type": "string",
                "pattern": "^[a-f0-9]{40}$"
              },
              {
                "type": "null"
              }
            ]
          }
        },
        "state": {
          "enum": [
            "EXACT_BLOB",
            "SAME_PATH_CHANGED",
            "EXACT_RELOCATION",
```

_First 80 of 210 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
