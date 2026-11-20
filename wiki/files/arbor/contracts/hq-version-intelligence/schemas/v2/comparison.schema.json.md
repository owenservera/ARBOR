# File: contracts/hq-version-intelligence/schemas/v2/comparison.schema.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | contracts/hq-version-intelligence/schemas/v2/comparison.schema.json |
| Language | JSON |
| Kind | config |
| Size | 36746 B |
| Lines | 1338 |
| Hash | a67d930c1a68 |
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
  "$id": "https://arbor.local/hvi/v2/comparison.schema.json",
  "title": "Normative C Version Comparison; F v1 is not interchangeable",
  "type": "object",
  "properties": {
    "schema": {
      "const": "arbor.hvi.version-comparison/1"
    },
    "targetPinId": {
      "type": "string",
      "pattern": "^[a-f0-9]{64}$"
    },
    "sourcePins": {
      "type": "array",
      "minItems": 2,
      "maxItems": 128,
      "items": {
        "type": "object",
        "properties": {
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
          "resolvedCommitSha": {
            "type": "string",
            "pattern": "^[a-f0-9]{40}$"
          },
          "rootTreeSha": {
            "type": "string",
            "pattern": "^[a-f0-9]{40}$"
          },
          "manifestDigest": {
            "type": "string",
            "pattern": "^[a-f0-9]{64}$"
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
          }
        },
        "required": [
          "pinId",
          "provider",
          "repoIdentity",
          "resolvedCommitSha",
          "rootTreeSha",
          "manifestDigest",
          "completeness",
          "scope"
        ],
        "additionalProperties": false
      }
    },
    "pairwise": {
      "oneOf": [
        {
          "type": "null"
        },
        {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "sourcePinId": {
                "type": "string",
```

_First 80 of 1339 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
