# File: contracts/hq-version-intelligence/schemas/v1/manifest.schema.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | contracts/hq-version-intelligence/schemas/v1/manifest.schema.json |
| Language | JSON |
| Kind | config |
| Size | 4120 B |
| Lines | 174 |
| Hash | 9bd589b3cc88 |
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
  "$id": "https://schemas.arbor.local/hvi/v1/manifest.schema.json",
  "title": "ARBOR HVI manifest v1",
  "description": "Source-only normative wire contract; no runtime authority inferred.",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "schema",
    "pinId",
    "commitSha",
    "digest",
    "entries",
    "coverage",
    "owner"
  ],
  "properties": {
    "schema": {
      "const": "arbor.hvi.manifest/1"
    },
    "pinId": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024
    },
    "commitSha": {
      "type": "string",
      "pattern": "^[a-f0-9]{40}$"
    },
    "digest": {
      "type": "string",
      "pattern": "^[a-f0-9]{64}$"
    },
    "entries": {
      "type": "array",
      "maxItems": 1000000,
      "items": {
        "type": "object",
        "required": [
          "path",
          "mode",
          "blobSha",
          "kind",
          "parseStatus"
        ],
        "additionalProperties": false,
        "properties": {
          "path": {
            "type": "string",
            "pattern": "^(?!/)(?!.*(?:^|/)\\.\\.(?:/|$))(?!.*(?:^|/)\\.git(?:/|$))(?!.*\\\\)(?!.*(?:^|/)(?:\\.env[^/]*|cookies|login data|session\\.json|storage-state\\.json)(?:/|$))[^\\u0000-\\u001f]+$"
          },
          "mode": {
            "enum": [
              "100644",
              "100755",
              "120000",
              "160000",
              "040000"
            ]
          },
          "blobSha": {
            "type": "string",
            "pattern": "^[a-f0-9]{40}$"
          },
          "bytes": {
            "type": "integer",
            "minimum": 0
          },
          "kind": {
            "enum": [
              "file",
              "symlink",
              "submodule",
              "tree",
              "lfs_pointer",
              "binary",
              "unobservable"
            ]
          },
          "parseStatus": {
```

_First 80 of 175 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
