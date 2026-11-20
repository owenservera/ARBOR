# File: studio/profiles/chatgpt.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | studio/profiles/chatgpt.json |
| Language | JSON |
| Kind | config |
| Size | 1389 B |
| Lines | 49 |
| Hash | 974767959cea |
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
  "name": "chatgpt",
  "version": 1,
  "description": "Starting profile for chatgpt.com. Scope and capture policy only; data shapes are discovered live and confirmed by the user. UNVERIFIED against the live site until a Windows receipt exists.",
  "match": {
    "hosts": [
      "chatgpt.com",
      "*.chatgpt.com"
    ]
  },
  "scope": {
    "origins": [
      "chatgpt.com",
      "*.chatgpt.com"
    ],
    "thirdParty": "ignore"
  },
  "capture": {
    "bodyResourceTypes": [
      "Fetch",
      "XHR",
      "EventSource",
      "Document",
      "Other"
    ],
    "exclude": [
      "\\.(png|jpe?g|gif|webp|svg|woff2?|ttf|css)(\\?|$)"
    ],
    "websockets": true,
    "wsSentFrames": false,
    "requestBodies": false
  },
  "dom": {
    "enabled": true,
    "roots": [
      "main",
      "body"
    ]
  },
  "decode": {
    "delta": "auto"
  },
  "notes": [
    "No endpoint names are assumed. Beacon/telemetry-like streams are detected from observed behaviour and offered as exclusion suggestions in the studio.",
    "Auth/session endpoints are always metadata-only (built-in credential policy), independent of this profile.",
    "OpenAI documents WebSocket use on chatgpt.com for some conversation updates/notifications; which transport carries a given reply must be observed, not assumed."
  ],
  "family": "ai-chat"
}
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
