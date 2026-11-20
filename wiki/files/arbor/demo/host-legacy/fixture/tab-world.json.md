# File: demo/host-legacy/fixture/tab-world.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | demo/host-legacy/fixture/tab-world.json |
| Language | JSON |
| Kind | config |
| Size | 1386 B |
| Lines | 29 |
| Hash | c1f6b2c509e1 |
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
  "itemId": "tab-world",
  "screen": "World",
  "currentState": "Queue-mode World: durable journal entries and approved Wiki revisions under 'What was built', with undoAvailable as the undo cue. Reads md directly — top-level revision/built/running/queue/undoAvailable/changeHint, not statusObj.snapshot.bootstrap.",
  "proposedUpgrade": "baseline — current view, no upgrade proposed",
  "acceptanceQuestion": "After an approved Wiki edit and Host refresh, does World show the edit as a new built item under the committed revision, and does undo behave correctly?",
  "mockData": {
    "hostReported": true,
    "revision": {
      "surfaceId": "vivim.ui-surface/1",
      "revision": 7,
      "status": "committed",
      "changeId": "chg_001",
      "parentRevision": 6
    },
    "built": [
      { "title": "Wiki page · ARBOR roadmap", "detail": "Approved edit · revision 7" },
      { "title": "Chat journal entry", "detail": "Durable entry · source host-command" }
    ],
    "running": [],
    "queue": { "queued": 0, "claimed": 0, "done": 3, "failed": 0 },
    "undoAvailable": true,
    "changeHint": "Build proposes a change; your PC commits it as a new revision you can undo.",
    "empty": false,
    "emptyMessage": "The Host committed revision 7, and it holds no components yet.",
    "gaps": []
  }
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
