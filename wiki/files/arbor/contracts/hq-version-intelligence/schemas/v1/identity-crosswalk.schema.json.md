# File: contracts/hq-version-intelligence/schemas/v1/identity-crosswalk.schema.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | contracts/hq-version-intelligence/schemas/v1/identity-crosswalk.schema.json |
| Language | JSON |
| Kind | config |
| Size | 4458 B |
| Lines | 188 |
| Hash | ad270f8cbe5d |
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
  "$id": "https://schemas.arbor.local/hvi/v1/identity-crosswalk.schema.json",
  "title": "ARBOR HVI identity-crosswalk v1",
  "description": "Source-only normative wire contract; no runtime authority inferred.",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "schema",
    "pinIds",
    "candidates",
    "authorityConflicts",
    "coverage",
    "owner"
  ],
  "properties": {
    "schema": {
      "const": "arbor.hvi.identity-crosswalk/1"
    },
    "pinIds": {
      "type": "array",
      "minItems": 2,
      "uniqueItems": true,
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 1024
      }
    },
    "candidates": {
      "type": "array",
      "items": {
        "type": "object",
        "required": [
          "id",
          "left",
          "right",
          "identityBasis",
          "disposition",
          "certainty",
          "owner",
          "evidenceRefs"
        ],
        "properties": {
          "id": {
            "type": "string",
            "minLength": 1,
            "maxLength": 1024
          },
          "left": {
            "type": "string",
            "minLength": 1,
            "maxLength": 1024
          },
          "right": {
            "type": "string",
            "minLength": 1,
            "maxLength": 1024
          },
          "identityBasis": {
            "enum": [
              "source_id",
              "exact_blob",
              "canonical_declared",
              "explicit_owner_decision",
              "symbol_signature",
              "similarity_candidate"
            ]
          },
          "disposition": {
            "enum": [
              "REVIEW_REQUIRED",
              "CONFIRMED_EQUIVALENT",
              "KEEP_SEPARATE",
              "REJECTED"
            ]
          },
          "certainty": {
            "enum": [
              "confirmed",
```

_First 80 of 189 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
