# File: harness/src/providers/qwen.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/src/providers/qwen.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2368 B |
| Lines | 86 |
| Hash | e101baf9560f |
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
| [harness/src/providers/index.mjs](./index.mjs.md) | ./qwen.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Selectors seeded from the owner's site profile; individual selectors may be unverified.
export default {
  "id": "qwen",
  "label": "Qwen Chat",
  "hosts": [
    "chat.qwen.ai",
    "qwen.ai"
  ],
  "url": "https://chat.qwen.ai/",
  "threadPattern": /^\/c\/(?<id>[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/?$/i,
  "composer": {
    "selectors": [
      "textarea.message-input-textarea",
      "textarea#chat-input",
      "textarea[placeholder*=\"How can I help you today\" i]",
      "div[contenteditable=\"true\"][role=\"textbox\"]",
      "form textarea",
      "textarea",
      "[contenteditable=\"true\"]",
      "[role=\"textbox\"]"
    ]
  },
  "send": {
    // Measured 2026-10-30: in a hidden background tab Qwen's send handler accepts the click/Enter but
    // never submits (text stays in the composer). Bring the tab to the front, then Enter (as vivim-harness).
    "strategy": "enter",
    "foreground": true,
    "buttonSelectors": [
      "button.send-button[aria-label=\"Send\"]",
      "button#send-message-button",
      "form button[type=\"submit\"]",
      "button[type=\"submit\"]"
    ]
  },
  "user": {
    "selectors": [
      "p.user-message-content",
      "[data-message-author-role=\"user\"]"
    ]
  },
  "assistant": {
    "containerSelectors": [
      "div.custom-qwen-markdown",
      "[data-message-author-role=\"assistant\"]",
      "div[class*=\"markdown\"]",
      "div[class*=\"prose\"]",
      "article",
      "[data-testid*=\"assistant\" i]"
    ],
    "streamingSelectors": [
      "button[aria-label*=\"stop\" i]",
      "[role=\"button\"][aria-label*=\"stop\" i]",
      "[data-testid=\"stop-button\"]",
      "[aria-busy=\"true\"]:not(button)"
    ]
  },
  "preflight": {
    "authWallSelectors": [
      "button.header-right-auth-button",
      "a[href*=\"/auth\"]",
      "a[href*=\"/login\"]",
      "form[action*=\"login\"]"
    ],
    "signedInSelectors": [
      "button.user-menu-btn",
      "img.user-img[alt*=\"User profile\" i]"
    ]
  },
  "status": "measured",
  "models": {
    "triggerSelector": "div.wms-trigger",
    "ignore": [],
    "tiers": {
      "strong": [
        "max$"
      ],
      "fast": [
        "plus$"
      ]
    }
```

_First 80 of 87 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
