# File: contracts/hq-version-intelligence/schemas/v1/evidence-receipt.schema.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | contracts/hq-version-intelligence/schemas/v1/evidence-receipt.schema.json |
| Language | JSON |
| Kind | config |
| Size | 4037 B |
| Lines | 197 |
| Hash | 753e100faec8 |
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
  "$id": "https://schemas.arbor.local/hvi/v1/evidence-receipt.schema.json",
  "title": "ARBOR HVI evidence-receipt v1",
  "description": "Source-only normative wire contract; no runtime authority inferred.",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "schema",
    "id",
    "kind",
    "claim",
    "owner",
    "source",
    "evidenceDigest",
    "observation",
    "status"
  ],
  "properties": {
    "schema": {
      "const": "arbor.hvi.evidence-receipt/1"
    },
    "id": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024
    },
    "kind": {
      "enum": [
        "source_blob",
        "source_symbol",
        "contract",
        "fixture",
        "executed_test",
        "host_receipt",
        "device_receipt",
        "owner_decision"
      ]
    },
    "claim": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024
    },
    "owner": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024
    },
    "source": {
      "type": "object",
      "required": [
        "repo",
        "commitSha",
        "path",
        "blobSha"
      ],
      "additionalProperties": false,
      "properties": {
        "repo": {
          "type": "string",
          "minLength": 1,
          "maxLength": 1024
        },
        "commitSha": {
          "type": "string",
          "pattern": "^[a-f0-9]{40}$"
        },
        "path": {
          "type": "string",
          "minLength": 1,
          "maxLength": 1024
        },
        "blobSha": {
          "type": "string",
          "pattern": "^[a-f0-9]{40}$"
        },
        "lines": {
          "type": "array",
          "items": {
```

_First 80 of 198 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
