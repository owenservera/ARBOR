# File: demo/host-legacy/fixture/tab-control.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | demo/host-legacy/fixture/tab-control.json |
| Language | JSON |
| Kind | config |
| Size | 1769 B |
| Lines | 40 |
| Hash | 8f5929420760 |
| Test | yes |
| Generated | no |
| Component | demo |

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
  "schema": "vivim.demo-step/1",
  "itemId": "tab-control",
  "screen": "Control",
  "currentState": "Paired Direct Control: 'Control your VIVIM' shows 'Available commands · 1 of 1 cataloged' chip, typing 'Set my theme to dusk' renders local token chips plus the canonical command, Preview action returns an approval card ('Exact plan 3f9a… · expires 09:45') with Approve & apply / Cancel, and Recent Host decisions lists the earlier applied theme.set receipt.",
  "proposedUpgrade": "baseline — current view, no upgrade proposed",
  "acceptanceQuestion": "Does the approval step bind visibly to the exact plan digest before anything executes, and would an unsupported request be refused in words rather than guessed at?",
  "mockData": {
    "control": {
      "catalog": {
        "actions": [
          { "id": "theme.set", "title": "Set theme", "risk": "low", "readiness": "verified", "examples": ["Set my theme to dusk", "Use the light theme"] }
        ]
      },
      "world": { "themes": ["dusk", "light"] }
    },
    "plan": {
      "outcome": "approval_required",
      "title": "Set theme to dusk",
      "args": { "theme": "dusk" },
      "risk": "low",
      "planDigest": "3f9ac2b17d44e8a0c6b5d2f1e7a8b9c0d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8",
      "expiresAt": "2026-11-14T09:45:00Z",
      "liveAcceptance": "verified"
    },
    "receipt": {
      "status": "applied",
      "actionId": "theme.set",
      "planId": "p-1",
      "at": "2026-11-14T09:41:00Z",
      "result": { "theme": "dusk" },
      "undo": { "actionId": "theme.unset", "args": {} }
    },
    "recent": {
      "items": [
        { "actionId": "theme.set", "state": "applied", "createdAt": "2026-11-14T09:41:00Z" }
      ]
    }
  }
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
