# File: harness/src/providers/zai.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/src/providers/zai.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1966 B |
| Lines | 82 |
| Hash | cade73e85d12 |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

_No symbols._

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [harness/src/providers/index.mjs](./index.mjs.md) | ./zai.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Selectors seeded from the owner's site profile; individual selectors may be unverified.
export default {
  "id": "zai",
  "label": "Z.ai",
  "hosts": [
    "chat.z.ai",
    "z.ai",
    "www.z.ai"
  ],
  "url": "https://chat.z.ai/",
  "threadPattern": /^\/c\/(?<id>[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/?$/i,
  "composer": {
    "selectors": [
      "textarea#chat-input",
      "#chat-input",
      "textarea[placeholder*=\"Send a Message\" i]",
      "form textarea",
      "textarea",
      "[contenteditable=\"true\"]",
      "[role=\"textbox\"]"
    ]
  },
  "send": {
    "strategy": "enter",
    "foreground": true,
    "buttonSelectors": [
      "#send-message-button",
      "form button[type=\"submit\"]",
      "button[type=\"submit\"]"
    ]
  },
  "user": {
    "selectors": [
      ".user-message .chat-user"
    ]
  },
  "assistant": {
    "containerSelectors": [
      ".chat-assistant #response-content-container .markdown-prose"
    ],
    "excludeSelectors": [
      ".thinking-chain-container"
    ],
    "errorTexts": [
      "Model is currently at capacity",
      "is intensifying the coordination of resources"
    ],
    "streamingSelectors": [
      "button[aria-label*=\"stop\" i]",
      "[role=\"button\"][aria-label*=\"stop\" i]",
      "#send-message-button[aria-label*=\"stop\" i]",
      "[aria-busy=\"true\"]:not(button)"
    ]
  },
  "preflight": {
    "authWallSelectors": [
      "a[href*=\"/login\"]",
      "a[href*=\"/signin\"]",
      "form[action*=\"login\"]"
    ]
  },
  "status": "measured",
  "models": {
    "triggerSelector": "button.modelSelectorButton",
    "ignore": [
      "^effort$",
      "^(max|high|medium|low|none|off)$"
    ],
    "tiers": {
      "strong": [
        "^glm-5\\.3$"
      ],
      "fast": [
        "flash"
      ]
    }
  },
  "strengths": [
    "coding",
    "visual mode"
```

_First 80 of 83 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
