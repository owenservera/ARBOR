# File: demo/host-legacy/fixture/tab-today.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | demo/host-legacy/fixture/tab-today.json |
| Language | JSON |
| Kind | config |
| Size | 1397 B |
| Lines | 21 |
| Hash | dee3eeff79f3 |
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
  "itemId": "tab-today",
  "screen": "Today",
  "currentState": "Paired Direct phone: Connection card reads 'Direct to your PC', one live conversation renders under Running as 'Chat · chatgpt · Claimed by worker — not sent', a failed relay-chat command feeds a 'A command failed' Needs-you item, and the footer's single next action is 'Open Talk'.",
  "proposedUpgrade": "baseline — current view, no upgrade proposed",
  "acceptanceQuestion": "Does Today put the one thing that needs you (the failed send) above everything else, and can every card on this screen be traced to a Host field rather than invented?",
  "mockData": {
    "statusObj": {
      "snapshot": {
        "live": { "state": "ok", "conversations": [ { "id": "c-1", "provider": "chatgpt", "model": "gpt-5", "messages": [ { "state": "claimed" } ] } ] },
        "bootstrap": { "progress": { "passes": [] } }
      }
    },
    "commands": [
      { "id": "cmd-9", "mode": "relay-chat", "kind": "command", "consumer": "harness", "target": { "provider": "vivim" }, "text": "Set my theme to dusk", "status": "failed", "updatedAt": "2026-11-14T09:12:00Z" }
    ],
    "ctx": { "paired": true, "mode": "direct", "connection": "Direct to your PC", "connectionTone": "ok", "pendingSend": false },
    "liveStateLabels": { "claimed": "Claimed by worker — not sent" }
  }
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
