# File: demo/host-legacy/fixture/tab-me.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | demo/host-legacy/fixture/tab-me.json |
| Language | JSON |
| Kind | config |
| Size | 2640 B |
| Lines | 29 |
| Hash | b0b12354bf5a |
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
  "itemId": "tab-me",
  "screen": "Me",
  "currentState": "Paired Direct Me: Identity rows show Personal agent 'owen-local' / Initialized Yes, Phone Connection shows 'Paired' + 'Direct to your PC', Permissions show the device-grant scopes and 'Signed-in AI: chatgpt', and Activity Record lists eight command receipts newest-first.",
  "proposedUpgrade": "baseline — current view, no upgrade proposed",
  "acceptanceQuestion": "Do the identity, grant and permission rows match exactly what the Host reported — nothing padded, and every 'Not available yet' hole honest?",
  "mockData": {
    "statusObj": {
      "snapshot": {
        "personalAgent": { "agentId": "owen-local", "scope": "owner", "identityAssurance": "device-bound", "initialized": true },
        "bootstrap": { "worldId": "home-main" }
      }
    },
    "device": { "status": "active", "scopes": ["control:read", "chat:send"] },
    "manifest": { "providers": [ { "id": "chatgpt", "signedIn": true }, { "id": "claude", "signedIn": false }, { "id": "qwen", "signedIn": false } ] },
    "commands": [
      { "id": "rc-8", "mode": "relay-chat", "text": "Set my theme to dusk", "consumer": "harness", "target": { "provider": "chatgpt" }, "status": "done", "updatedAt": "2026-11-14T09:40:00Z" },
      { "id": "rc-7", "mode": "bootstrap", "action": "theme.apply", "consumer": "host", "status": "done", "updatedAt": "2026-11-14T09:35:00Z" },
      { "id": "rc-6", "mode": "relay-chat", "text": "Summarize the morning brief", "consumer": "harness", "target": { "provider": "chatgpt" }, "status": "done", "updatedAt": "2026-11-14T09:30:00Z" },
      { "id": "rc-5", "mode": "bootstrap", "action": "surface.create", "consumer": "host", "status": "done", "updatedAt": "2026-11-14T09:25:00Z" },
      { "id": "rc-4", "mode": "relay-chat", "text": "Open the research plan", "consumer": "harness", "target": { "provider": "chatgpt" }, "status": "done", "updatedAt": "2026-11-14T09:20:00Z" },
      { "id": "rc-3", "mode": "relay-chat", "text": "Send the daily note", "consumer": "harness", "target": { "provider": "vivim" }, "status": "failed", "updatedAt": "2026-11-14T09:15:00Z" },
      { "id": "rc-2", "mode": "relay-chat", "text": "Remind me at noon", "consumer": "harness", "target": { "provider": "chatgpt" }, "status": "queued", "updatedAt": "2026-11-14T09:10:00Z" },
      { "id": "rc-1", "mode": "relay-chat", "text": "Set my theme to dusk", "consumer": "harness", "target": { "provider": "chatgpt" }, "status": "claimed", "updatedAt": "2026-11-14T09:00:00Z" }
    ],
    "ctx": { "mode": "direct" }
  }
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
