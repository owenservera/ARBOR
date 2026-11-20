# File: contracts/hq-version-intelligence/schemas/v1/pin.schema.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | contracts/hq-version-intelligence/schemas/v1/pin.schema.json |
| Language | JSON |
| Kind | config |
| Size | 2332 B |
| Lines | 108 |
| Hash | dc1519d4785a |
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
  "$id": "https://schemas.arbor.local/hvi/v1/pin.schema.json",
  "title": "ARBOR HVI pin v1",
  "description": "Source-only normative wire contract; no runtime authority inferred.",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "schema",
    "pinId",
    "provider",
    "repoIdentity",
    "requestedRef",
    "resolvedCommitSha",
    "rootTreeSha",
    "manifestDigest",
    "acquiredAt",
    "completeness",
    "scope",
    "owner",
    "evidenceRef"
  ],
  "properties": {
    "schema": {
      "const": "arbor.hvi.pin/1"
    },
    "pinId": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024
    },
    "provider": {
      "enum": [
        "github",
        "git-local-approved"
      ]
    },
    "repoIdentity": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "repository"
      ],
      "properties": {
        "repository": {
          "type": "string",
          "pattern": "^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$"
        },
        "remoteFingerprint": {
          "type": "string",
          "pattern": "^[a-f0-9]{64}$"
        }
      }
    },
    "requestedRef": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024
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
    "acquiredAt": {
      "type": "string",
      "format": "date-time"
    },
    "completeness": {
      "enum": [
        "complete",
        "partial",
        "blocked",
```

_First 80 of 109 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
