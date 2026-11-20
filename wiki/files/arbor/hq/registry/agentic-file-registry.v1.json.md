# File: hq/registry/agentic-file-registry.v1.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/registry/agentic-file-registry.v1.json |
| Language | JSON |
| Kind | config |
| Size | 248890 B |
| Lines | 8045 |
| Hash | 47bf1305ffe6 |
| Test | no |
| Generated | no |
| Component | hq |

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
  "schema": "hq.agentic-file-registry/1",
  "version": 1,
  "built_at": "2026-11-02",
  "sources": {
    "inventory": "C:/0-BlackBoxProject-0/aion/workspace/aion/ops/AGENT-CROSS-REPO-SOURCE-INDEX-2026-10-25.json",
    "inventory_date": "2026-10-25",
    "catalog": "C:/0-BlackBoxProject-0/aion/workspace/aion/sessions/roles/15-product-to-market/core-library/AGENTIC-FILE-CATALOG.json",
    "catalog_date": "2026-10-25"
  },
  "interpretation": "217 actual agentic file records across 7 repositories, diffed against the 133-pattern AION catalog. Observed files are not standards; donor snapshots stay historical; missing catalog patterns are not automatically required files.",
  "counts": {
    "repositories": 7,
    "tracked_files": 5982,
    "records": 217,
    "source_records": 209,
    "donor_snapshots": 8,
    "catalog_patterns": 133,
    "observed_types": 19,
    "mapped_records": 143,
    "unmapped_records": 74,
    "catalog_patterns_observed": 12,
    "catalog_patterns_unobserved": 121
  },
  "by_repo": {
    "owenservera/aion": 195,
    "owenservera/001.PROJECTS.PM": 1,
    "owenservera/SOFTWARE_HQ": 10,
    "owenservera/hq": 1,
    "owenservera/vivim-harness": 7,
    "owenservera/vivim-omega": 2,
    "owenservera/zcode-pocket": 1
  },
  "by_kind": {
    "source-file": 209,
    "donor-snapshot": 8
  },
  "by_family": {
    "10": {
      "count": 7,
      "role": "config",
      "family_name": null
    },
    "12": {
      "count": 20,
      "role": "state",
      "family_name": "State, status & telemetry"
    },
    "19": {
      "count": 12,
      "role": "collaboration",
      "family_name": "Collaboration & handoffs"
    },
    "02": {
      "count": 7,
      "role": "instruction",
      "family_name": "Provider-native instruction rules"
    },
    "09": {
      "count": 67,
      "role": "skill",
      "family_name": "Skills & reusable methods"
    },
    "01": {
      "count": 53,
      "role": "instruction",
      "family_name": "Agent entry & bootstrap"
    },
    "04": {
      "count": 46,
      "role": "context",
      "family_name": "Context & retrieval"
    },
    "08": {
      "count": 5,
      "role": "capability",
      "family_name": null
    }
  },
  "network": {
```

_First 80 of 8046 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
