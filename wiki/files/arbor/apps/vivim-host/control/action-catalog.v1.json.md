# File: apps/vivim-host/control/action-catalog.v1.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/control/action-catalog.v1.json |
| Language | JSON |
| Kind | config |
| Size | 44968 B |
| Lines | 1807 |
| Hash | e2054777f590 |
| Test | no |
| Generated | no |
| Component | vivim-host |

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
  "schema": "vivim.control-action-catalog/1",
  "version": 15,
  "asOf": "2026-11-18",
  "policy": {
    "allUserFacingActionsRequireTextPath": true,
    "uiSharesTypedExecutor": true,
    "unverifiedActionsAreNotAvailable": true,
    "missingAdapter": "unavailable",
    "unknownLanguage": "interpretation_required",
    "modelRole": "candidate_only",
    "sourceWiredIsNotLiveAcceptance": true,
    "forceModifierGrantsNothing": true,
    "aiMayNotTeachLanguage": true
  },
  "actions": [
    {
      "id": "control.rule.remember",
      "title": "Remember exact command phrase",
      "category": "control",
      "owner": "host-control",
      "executor": "apps/vivim-host/control/dispatcher.mjs:createExecutors",
      "readiness": "source_wired",
      "risk": "R2",
      "target": "local-host",
      "surfaces": [
        "text",
        "desktop",
        "mobile",
        "visual"
      ],
      "privacy": "pc-only",
      "aiCandidate": false,
      "subject": "personal-semantics",
      "priority": "P2",
      "args": {
        "phrase": {
          "type": "string",
          "min": 2,
          "max": 200
        },
        "command": {
          "type": "string",
          "min": 2,
          "max": 1000
        }
      },
      "examples": [
        "Use desktop Chat to remember an exact phrase"
      ],
      "reversible": true
    },
    {
      "id": "control.rule.revoke",
      "title": "Revoke learned command phrase",
      "category": "control",
      "owner": "host-control",
      "executor": "apps/vivim-host/control/dispatcher.mjs:createExecutors",
      "readiness": "source_wired",
      "risk": "R2",
      "target": "local-host",
      "surfaces": [
        "text",
        "desktop",
        "mobile",
        "visual"
      ],
      "privacy": "pc-only",
      "aiCandidate": false,
      "subject": "personal-semantics",
      "priority": "P2",
      "args": {
        "rule_id": {
          "type": "string",
          "min": 6,
          "max": 85
        }
      },
      "examples": [
        "Use desktop Chat to revoke a learned phrase"
```

_First 80 of 1808 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
