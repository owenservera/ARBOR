# File: tests/fixtures/labs/capability-observatory/schema.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | tests/fixtures/labs/capability-observatory/schema.json |
| Language | JSON |
| Kind | config |
| Size | 2032 B |
| Lines | 101 |
| Hash | 92bee0e1df28 |
| Test | yes |
| Generated | no |
| Component | tests |

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
  "title": "VIVIM capability identity index",
  "type": "array",
  "items": {
    "type": "object",
    "required": [
      "capability_id",
      "name",
      "domain",
      "kind",
      "owner_repo",
      "surfaces",
      "authority",
      "wave_lanes",
      "baseline_evidence",
      "target",
      "source_refs"
    ],
    "properties": {
      "capability_id": {
        "type": "string",
        "pattern": "^cap:[a-z0-9-]+$"
      },
      "name": {
        "type": "string"
      },
      "domain": {
        "type": "string"
      },
      "kind": {
        "enum": [
          "feature",
          "tool",
          "algorithm",
          "system",
          "integration",
          "experience"
        ]
      },
      "owner_repo": {
        "enum": [
          "tierflow",
          "vivim-web-harness",
          "repos-hq"
        ]
      },
      "surfaces": {
        "type": "array",
        "items": {
          "type": "string"
        }
      },
      "authority": {
        "type": "string"
      },
      "wave_lanes": {
        "type": "array",
        "items": {
          "enum": [
            "A",
            "B",
            "C",
            "D",
            "E",
            "F",
            "G",
            "H"
          ]
        }
      },
      "baseline_evidence": {
        "enum": [
          "unverified",
          "design_only",
          "code_present",
          "tested_fixture",
          "integrated_test",
          "hardware_verified",
          "production_verified"
```

_First 80 of 102 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
