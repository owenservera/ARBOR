# File: demo/host-legacy/fixture/tab-talk.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | demo/host-legacy/fixture/tab-talk.json |
| Language | JSON |
| Kind | config |
| Size | 1928 B |
| Lines | 30 |
| Hash | ea63e9d4fcaf |
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
  "itemId": "tab-talk",
  "screen": "Talk",
  "currentState": "Paired Direct chat: drawer lists two conversations ('Theme test', 'Research plan'), the open thread shows your bubble 'Set my theme to dusk' over an assistant reply wearing the receipt badge 'Send observed — awaiting reply', and the composer offers provider chips with chatgpt signed in.",
  "proposedUpgrade": "baseline — current view, no upgrade proposed",
  "acceptanceQuestion": "Reading only the receipt badges, can you tell exactly where each send really is — and is any state on this screen one the Host never reported?",
  "mockData": {
    "state": { "paired": true, "transportDirect": true, "hostPreview": false },
    "convs": [
      { "id": "c-1", "title": "Theme test", "provider": "chatgpt", "model": "gpt-5", "effort": "standard", "updatedAt": "2026-11-14T09:10:00Z" },
      { "id": "c-2", "title": "Research plan", "provider": "claude", "updatedAt": "2026-11-14T08:40:00Z" }
    ],
    "cmds": [
      { "id": "m-1", "conversationId": "c-1", "text": "Set my theme to dusk", "status": "done", "mode": "relay-chat", "consumer": "harness", "target": { "provider": "chatgpt" }, "createdAt": "2026-11-14T09:09:00Z", "updatedAt": "2026-11-14T09:11:00Z" }
    ],
    "statusObj": {
      "snapshot": {
        "live": { "state": "ok", "conversations": [ { "id": "c-1", "provider": "chatgpt", "messages": [ { "state": "waiting_reply" } ] } ] }
      }
    },
    "manifest": {
      "providers": [
        { "id": "chatgpt", "label": "ChatGPT", "signedIn": true, "models": [ { "id": "gpt-5", "label": "GPT-5", "current": true } ], "thinkingLevels": [ { "id": "standard", "label": "Standard" } ], "attachments": true },
        { "id": "claude", "label": "Claude", "signedIn": false }
      ]
    },
    "liveStateLabels": { "waiting_reply": "Send observed — awaiting reply" }
  }
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
