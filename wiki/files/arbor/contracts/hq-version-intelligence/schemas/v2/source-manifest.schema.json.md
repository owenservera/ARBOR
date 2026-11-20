# File: contracts/hq-version-intelligence/schemas/v2/source-manifest.schema.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | contracts/hq-version-intelligence/schemas/v2/source-manifest.schema.json |
| Language | JSON |
| Kind | config |
| Size | 11349 B |
| Lines | 426 |
| Hash | 7b248dff5ab2 |
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
  "$id": "https://arbor.local/hvi/v2/source-manifest.schema.json",
  "title": "Native A or explicitly projected C Source Manifest",
  "oneOf": [
    {
      "type": "object",
      "properties": {
        "schema": {
          "const": "arbor.hvi.manifest/1"
        },
        "pinId": {
          "type": "string",
          "pattern": "^[a-f0-9]{64}$"
        },
        "repoIdentity": {
          "type": "string",
          "pattern": "^[a-z0-9_.-]+/[a-z0-9_.-]+$"
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
          "type": "string"
        },
        "entries": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "path": {
                "type": "string",
                "minLength": 1,
                "maxLength": 4096,
                "pattern": "^(?!/)[^\\\\\\x00-\\x1f]+$"
              },
              "mode": {
                "type": "string",
                "pattern": "^[0-7]{6}$"
              },
              "blobSha": {
                "type": "string",
                "pattern": "^[a-f0-9]{40}$"
              },
              "bytes": {
                "type": [
                  "integer",
                  "null"
                ],
                "minimum": 0
              },
              "kind": {
                "enum": [
                  "file",
                  "symlink",
                  "submodule"
                ]
              },
              "parseStatus": {
                "type": "string"
              },
              "excludedReason": {
                "type": [
                  "string",
                  "null"
                ],
                "maxLength": 255
              },
              "symlinkTarget": {
                "type": [
                  "string",
                  "null"
                ],
                "maxLength": 255
              }
```

_First 80 of 427 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
