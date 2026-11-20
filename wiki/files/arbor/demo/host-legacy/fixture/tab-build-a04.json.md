# File: demo/host-legacy/fixture/tab-build-a04.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | demo/host-legacy/fixture/tab-build-a04.json |
| Language | JSON |
| Kind | config |
| Size | 1097 B |
| Lines | 25 |
| Hash | 911acc7d61c0 |
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
  "itemId": "A04",
  "screen": "Build",
  "currentState": "Queue-mode Build: intent-compiler preview pane for three bounded intents rendered as proposal-preview with is-done/is-error, guarded publish that refuses stale/unapproved publish. Reads md directly.",
  "proposedUpgrade": "baseline — current view, no upgrade proposed",
  "acceptanceQuestion": "Does Build render each of the three intents as a guarded proposal (is-done/is-error), refuse to publish when stale or unapproved, and navigate to World for 'open the wiki' without introducing a second visual publisher?",
  "mockData": {
    "intent": "show ARBOR progress projection",
    "compiled": {
      "kind": "visual-update",
      "surfaceId": "vivim.ui-surface/1",
      "revision": 8,
      "guarded": true,
      "publishable": false,
      "reason": "pending owner approval"
    },
    "proposal": {
      "status": "pending",
      "preview": "ARBOR progress projection · source-backed revision 8",
      "state": "is-done"
    },
    "approvalRequired": true
  }
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
