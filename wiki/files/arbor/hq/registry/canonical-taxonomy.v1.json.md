# File: hq/registry/canonical-taxonomy.v1.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/registry/canonical-taxonomy.v1.json |
| Language | JSON |
| Kind | config |
| Size | 77212 B |
| Lines | 2237 |
| Hash | daba8103448a |
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
  "authority": [
    {
      "assignable_by": "the tool vendor or the official documentation of the provider",
      "evidence": "docs/AGENTIC-RULEBOOK.md §4; hq/lib/canon.mjs DOCUMENT_AUTHORITY",
      "id": "authority.vendor_documented",
      "label": "vendor_documented",
      "meaning": "An official provider or tool convention.",
      "promotion_rule": "Never promoted by HQ; a local file cannot claim it.",
      "vocabulary": "document",
      "weight": 1
    },
    {
      "assignable_by": "the HQ indexer during the census",
      "evidence": "hq/lib/canon.mjs classifyDocument",
      "id": "authority.project_observed",
      "label": "project_observed",
      "meaning": "An actual repository file, observed in the census.",
      "promotion_rule": "Observation never becomes current by itself.",
      "vocabulary": "document",
      "weight": 0.9
    },
    {
      "assignable_by": "a project maintainer",
      "evidence": "docs/AGENTIC-RULEBOOK.md §4",
      "id": "authority.local_custom",
      "label": "local_custom",
      "meaning": "A local convention that has not been verified.",
      "promotion_rule": "Must not be promoted without owner confirmation.",
      "vocabulary": "document",
      "weight": 0.7
    },
    {
      "assignable_by": "any author or agent",
      "evidence": "docs/AGENTIC-RULEBOOK.md §4",
      "id": "authority.proposed",
      "label": "proposed",
      "meaning": "A candidate that has not been adopted.",
      "promotion_rule": "Stays proposed until the owner accepts it.",
      "vocabulary": "document",
      "weight": 0.5
    },
    {
      "assignable_by": "the indexer, when a path segment marks archive, history or donor material",
      "evidence": "hq/lib/canon.mjs lifecycleFor; buildDocument",
      "id": "authority.historical",
      "label": "historical",
      "meaning": "Archived or donor material. It stays historical.",
      "promotion_rule": "Never promoted to current without an owner decision.",
      "vocabulary": "document",
      "weight": 0.2
    },
    {
      "assignable_by": "explicit owner confirmation only",
      "evidence": "hq/lib/canon.mjs AUTHORITY; confirmDecision; confirmTerm",
      "id": "authority.owner",
      "label": "owner",
      "meaning": "The owner of the record.",
      "promotion_rule": "The only value that produces an accepted decision or a current CANON term.",
      "vocabulary": "decision",
      "weight": null
    },
    {
      "assignable_by": "the architecture decision group",
      "evidence": "hq/lib/canon.mjs normalizeAuthorityValue default",
      "id": "authority.architecture",
      "label": "architecture",
      "meaning": "Authority recorded by the architecture group.",
      "promotion_rule": "Never promotes to `owner`; it is the default for extracted decisions and terms.",
      "vocabulary": "decision",
      "weight": null
    },
    {
      "assignable_by": "a named team",
      "evidence": "hq/lib/canon.mjs AUTHORITY",
      "id": "authority.team",
      "label": "team",
      "meaning": "Authority recorded by one team.",
      "promotion_rule": "Never promotes to `owner`.",
      "vocabulary": "decision",
```

_First 80 of 2238 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
