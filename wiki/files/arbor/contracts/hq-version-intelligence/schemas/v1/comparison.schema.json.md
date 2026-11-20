# File: contracts/hq-version-intelligence/schemas/v1/comparison.schema.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | contracts/hq-version-intelligence/schemas/v1/comparison.schema.json |
| Language | JSON |
| Kind | config |
| Size | 7436 B |
| Lines | 332 |
| Hash | e32096bcde04 |
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
  "$id": "https://schemas.arbor.local/hvi/v1/comparison.schema.json",
  "title": "ARBOR HVI comparison v1",
  "description": "Source-only normative wire contract; no runtime authority inferred.",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "schema",
    "targetPinId",
    "sourcePins",
    "coverage",
    "summary",
    "sourceDeltas",
    "capabilityDeltas",
    "identityCandidates",
    "authorityConflicts",
    "unported",
    "intentionallyExcluded",
    "unobserved",
    "runtimeProof",
    "mergePlan",
    "evidenceIndex",
    "limits",
    "errors",
    "reproducibilityDigest",
    "owner"
  ],
  "properties": {
    "schema": {
      "const": "arbor.hvi.comparison/1"
    },
    "targetPinId": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024
    },
    "sourcePins": {
      "type": "array",
      "minItems": 2,
      "maxItems": 64,
      "uniqueItems": true,
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 1024
      }
    },
    "coverage": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "completeness",
        "observed",
        "expected",
        "truncated"
      ],
      "properties": {
        "completeness": {
          "enum": [
            "complete",
            "partial",
            "blocked",
            "missing"
          ]
        },
        "observed": {
          "type": "integer",
          "minimum": 0
        },
        "expected": {
          "type": [
            "integer",
            "null"
          ],
          "minimum": 0
        },
        "truncated": {
          "type": "boolean"
        },
```

_First 80 of 333 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
