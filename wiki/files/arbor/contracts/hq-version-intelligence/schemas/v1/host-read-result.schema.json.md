# File: contracts/hq-version-intelligence/schemas/v1/host-read-result.schema.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | contracts/hq-version-intelligence/schemas/v1/host-read-result.schema.json |
| Language | JSON |
| Kind | config |
| Size | 3170 B |
| Lines | 153 |
| Hash | 0fe8fb041d6c |
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
  "$id": "https://schemas.arbor.local/hvi/v1/host-read-result.schema.json",
  "title": "ARBOR HVI host-read-result v1",
  "description": "Source-only normative wire contract; no runtime authority inferred.",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "schema",
    "operation",
    "status",
    "scope",
    "actorId",
    "sessionId",
    "grantRef",
    "evaluatedAt",
    "owner",
    "coverage",
    "receipts"
  ],
  "properties": {
    "schema": {
      "const": "arbor.hvi.host-read-result/1"
    },
    "operation": {
      "const": "development.source.compare.read"
    },
    "status": {
      "enum": [
        "ok",
        "denied",
        "incomplete"
      ]
    },
    "scope": {
      "const": "development"
    },
    "actorId": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024
    },
    "sessionId": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024
    },
    "grantRef": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024
    },
    "evaluatedAt": {
      "type": "string",
      "format": "date-time"
    },
    "owner": {
      "const": "Host"
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
```

_First 80 of 154 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
