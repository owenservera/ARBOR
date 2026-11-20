# File: harness/src/providers/chatgpt.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/src/providers/chatgpt.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2587 B |
| Lines | 95 |
| Hash | de853e814b1b |
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
| [harness/src/providers/index.mjs](./index.mjs.md) | ./chatgpt.mjs |
| [harness/test/core/effort.test.mjs](../../test/core/effort.test.mjs.md) | ../../src/providers/chatgpt.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Selectors seeded from the owner's site profile; individual selectors may be unverified.
export default {
  "id": "chatgpt",
  "label": "ChatGPT",
  "hosts": [
    "chatgpt.com",
    "www.chatgpt.com",
    "chat.openai.com"
  ],
  "url": "https://chatgpt.com/",
  "threadPattern": /^\/c\/(?<id>[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/?$/i,
  "composer": {
    "selectors": [
      "form div[contenteditable=\"true\"]",
      "#prompt-textarea",
      "div.ProseMirror[contenteditable=\"true\"]",
      "[data-testid=\"prompt-textarea\"]",
      "textarea",
      "[contenteditable=\"true\"]",
      "[role=\"textbox\"]"
    ]
  },
  "send": {
    "strategy": "button",
    "buttonSelectors": [
      "button[data-testid=\"send-button\"]",
      "form button[aria-label=\"Send\"]",
      "button[aria-label=\"Send prompt\"]",
      "#composer-submit-button",
      "form button[type=\"submit\"]",
      "button[type=\"submit\"]"
    ]
  },
  "user": {
    "selectors": [
      "[data-user-message-bubble=\"true\"]",
      "[data-message-author-role=\"user\"]"
    ]
  },
  "assistant": {
    "containerSelectors": [
      "[data-markdown-text-style=\"assistant-message\"]",
      "[data-content-search-unit-key$=\"assistant\"]",
      "[data-chatgpt-search-unit-key$=\"assistant\"]",
      "[data-message-author-role=\"assistant\"]",
      "article",
      "[data-testid*=\"assistant\" i]"
    ],
    "streamingSelectors": [
      "[data-talvt-turn-state]:not([data-talvt-turn-state=\"complete\"])",
      "[data-testid=\"stop-button\"]",
      "button[aria-label*=\"Detener\" i]",
      "button[aria-label*=\"Stop\" i]",
      "[aria-busy=\"true\"]:not(button)"
    ]
  },
  "preflight": {
    "authWallSelectors": [
      "[data-testid=\"login-button\"]",
      "a[href*=\"/auth/login\"]",
      "button[data-testid=\"welcome-login\"]",
      "form[action*=\"login\"]"
    ]
  },
  "status": "measured",
  "models": {
    "triggerSelector": "button[aria-label=\"Select ChatGPT model\"], button[aria-label=\"Seleccionar modelo de ChatGPT\"]",
    "effortSlider": "[role=slider]",
    "efforts": [
      "^instant$",
      "^light$",
      "^standard$",
      "^extended$",
      "^thinking",
      "^heavy",
      "^pro$"
    ],
    "ignore": [
      "^instant$",
      "^thinking",
```

_First 80 of 96 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
