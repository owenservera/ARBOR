# File: contracts/interop/v1/protocol.schema.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | contracts/interop/v1/protocol.schema.json |
| Language | JSON |
| Kind | config |
| Size | 3848 B |
| Lines | 181 |
| Hash | 02c4a701c6ba |
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
  "title": "ARBOR minimal pure interoperability contract",
  "$id": "arbor.interop/1",
  "description": "Derived/read-only interoperability. Does not authorize effects, reassign source identities or replace Host action catalog.",
  "$defs": {
    "source": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "id",
        "domain",
        "ownerRef",
        "revision"
      ],
      "properties": {
        "id": {
          "type": "string",
          "minLength": 1,
          "maxLength": 256
        },
        "domain": {
          "enum": [
            "development",
            "personal",
            "control",
            "ui"
          ]
        },
        "ownerRef": {
          "type": [
            "string",
            "null"
          ]
        },
        "revision": {
          "type": "integer",
          "minimum": 0
        }
      }
    },
    "evidence": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "source",
        "digest",
        "confidence"
      ],
      "properties": {
        "source": {
          "$ref": "#/$defs/source"
        },
        "digest": {
          "type": "string",
          "pattern": "^[a-f0-9]{64}$"
        },
        "confidence": {
          "enum": [
            "rule",
            "accepted-pattern",
            "source-observed",
            "model-proposed"
          ]
        }
      }
    },
    "event": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "eventId",
        "kind",
        "source",
        "expectedRevision"
      ],
      "properties": {
        "eventId": {
          "type": "string",
          "minLength": 1
```

_First 80 of 182 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
