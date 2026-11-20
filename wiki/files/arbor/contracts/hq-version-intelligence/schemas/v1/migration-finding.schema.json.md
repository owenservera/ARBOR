# File: contracts/hq-version-intelligence/schemas/v1/migration-finding.schema.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | contracts/hq-version-intelligence/schemas/v1/migration-finding.schema.json |
| Language | JSON |
| Kind | config |
| Size | 4638 B |
| Lines | 226 |
| Hash | be7dcd514233 |
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
  "$id": "https://schemas.arbor.local/hvi/v1/migration-finding.schema.json",
  "title": "ARBOR HVI migration-finding v1",
  "description": "Source-only normative wire contract; no runtime authority inferred.",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "schema",
    "id",
    "origin_repo",
    "origin_sha",
    "origin_path",
    "origin_blob",
    "target_repo",
    "target_sha",
    "target_path",
    "target_blob",
    "identity_basis",
    "source_lineage",
    "capability_id",
    "source_type",
    "tests",
    "runtime_evidence",
    "decision",
    "certainty",
    "missing_reason",
    "owner",
    "merge_recommendation",
    "evidence_refs",
    "coverage"
  ],
  "properties": {
    "schema": {
      "const": "arbor.hvi.migration-finding/1"
    },
    "id": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024
    },
    "origin_repo": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024
    },
    "origin_sha": {
      "type": "string",
      "pattern": "^[a-f0-9]{40}$"
    },
    "origin_path": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024
    },
    "origin_blob": {
      "type": "string",
      "pattern": "^[a-f0-9]{40}$"
    },
    "target_repo": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024
    },
    "target_sha": {
      "type": "string",
      "pattern": "^[a-f0-9]{40}$"
    },
    "target_path": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 1024
      }
    },
    "target_blob": {
      "type": "array",
      "items": {
        "type": "string",
```

_First 80 of 227 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
