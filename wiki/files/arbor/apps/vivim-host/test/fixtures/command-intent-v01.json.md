# File: apps/vivim-host/test/fixtures/command-intent-v01.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/fixtures/command-intent-v01.json |
| Language | JSON |
| Kind | config |
| Size | 3497 B |
| Lines | 138 |
| Hash | 02872359dc19 |
| Test | yes |
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
  "schema": "vivim.command-intent-fixtures/0.1",
  "note": "Cross-repository interchange fixtures for Lane 3 wiki gestures. expected fields are a stable subset of V0.1 JSON; provenance revisions are runtime-bound, never authorizations.",
  "cases": [
    {
      "id": "show-theme-desktop",
      "input": {
        "text": "show my theme",
        "scope": "desktop"
      },
      "expected": {
        "schema": "vivim.command-intent/0.1",
        "outcome": "candidate",
        "actionId": "ui.theme.show",
        "args": {},
        "canonical": "/ui.theme.show",
        "risk": "R0",
        "requiredScopes": []
      }
    },
    {
      "id": "show-theme-phone",
      "input": {
        "text": "show my theme",
        "scope": "mobile"
      },
      "expected": {
        "schema": "vivim.command-intent/0.1",
        "outcome": "candidate",
        "actionId": "ui.theme.show",
        "args": {},
        "canonical": "/ui.theme.show",
        "risk": "R0",
        "requiredScopes": []
      }
    },
    {
      "id": "set-theme",
      "input": {
        "text": "Set my theme to dusk",
        "scope": "text"
      },
      "expected": {
        "schema": "vivim.command-intent/0.1",
        "outcome": "candidate",
        "actionId": "ui.theme.set_preset",
        "args": {
          "preset": "dusk"
        },
        "canonical": "/ui.theme.set_preset preset=\"dusk\"",
        "risk": "R1",
        "requiredScopes": []
      }
    },
    {
      "id": "privacy-exclusion",
      "input": {
        "text": "Never mention my former employer"
      },
      "expected": {
        "schema": "vivim.command-intent/0.1",
        "outcome": "candidate",
        "actionId": "privacy.hard_no.add",
        "args": {
          "trait": "mention my former employer"
        },
        "risk": "R2"
      }
    },
    {
      "id": "negated-mutation",
      "input": {
        "text": "don't remember my salary"
      },
      "expected": {
        "schema": "vivim.command-intent/0.1",
        "outcome": "refused",
        "refusal": {
          "code": "NEGATED_ACTION"
        }
```

_First 80 of 139 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
