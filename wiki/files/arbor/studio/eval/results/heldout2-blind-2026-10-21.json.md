# File: studio/eval/results/heldout2-blind-2026-10-21.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/eval/results/heldout2-blind-2026-10-21.json |
| Language | JSON |
| Kind | config |
| Size | 8231 B |
| Lines | 314 |
| Hash | 8a27f5d7e17f |
| Test | no |
| Generated | no |
| Component | studio |

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
  "fixtures": {
    "v2-crm-contacts": {
      "ms": 19.6,
      "samples": 4,
      "discovered": [
        "account[account_number]",
        "contact[contactId]"
      ],
      "metrics": {
        "typeDiscovery": {
          "precision": 1,
          "recall": 1
        },
        "keyAccuracy": 1,
        "fieldTypeAccuracy": 1,
        "fieldsMissing": 0,
        "roleAccuracy": 0.4,
        "heuristicBaselineRoleAccuracy": 0.7,
        "taggedUnionAccuracy": null,
        "relationships": {
          "precision": 1,
          "recall": 1
        },
        "roleCalibrationECE": 0.3376,
        "misses": {
          "keys": [],
          "roles": [
            "account.company: title vs id",
            "account.industry: category vs metadata",
            "account.arr_usd: measure vs id",
            "contact.contactId: id vs reference",
            "contact.account: reference vs metadata",
            "contact.title: category vs metadata"
          ],
          "relationships": []
        }
      },
      "identity": {
        "contact": {
          "expected": 14,
          "resolved": 14
        }
      }
    },
    "v2-ticketing-sse": {
      "ms": 14.1,
      "samples": 25,
      "discovered": [
        "ticket_2[subject]",
        "ticket[ticketNo]",
        "comment[commentId]"
      ],
      "metrics": {
        "typeDiscovery": {
          "precision": 0.667,
          "recall": 1
        },
        "keyAccuracy": 0.5,
        "fieldTypeAccuracy": 1,
        "fieldsMissing": 0,
        "roleAccuracy": 0.556,
        "heuristicBaselineRoleAccuracy": 0.667,
        "taggedUnionAccuracy": null,
        "relationships": {
          "precision": 0,
          "recall": 0
        },
        "roleCalibrationECE": 0.2417,
        "misses": {
          "keys": [
            "ticket: expected ticketNo, got subject"
          ],
          "roles": [
            "ticket.subject: title vs id",
            "ticket.assignee: category vs metadata",
            "comment.ticketNo: reference vs timestamp",
            "comment.author: category vs metadata"
          ],
          "relationships": [
```

_First 80 of 314 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
