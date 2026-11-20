# File: harness/src/providers/deepseek.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/src/providers/deepseek.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1688 B |
| Lines | 60 |
| Hash | ebbf5a4cee5b |
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
| [harness/src/providers/index.mjs](./index.mjs.md) | ./deepseek.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Selectors seeded from the owner's site profile; individual selectors may be unverified.
export default {
  "id": "deepseek",
  "label": "DeepSeek",
  "hosts": [
    "chat.deepseek.com"
  ],
  "url": "https://chat.deepseek.com/",
  "threadPattern": null,
  "composer": {
    "selectors": [
      "textarea[placeholder*=\"Message DeepSeek\" i]",
      "textarea[name=\"search\"]",
      "textarea#chat-input",
      "div[contenteditable=\"true\"][role=\"textbox\"]",
      "textarea[placeholder*=\"发送消息\" i]",
      "textarea[placeholder*=\"Send\" i]",
      "textarea",
      "[contenteditable=\"true\"]",
      "[role=\"textbox\"]"
    ]
  },
  "send": {
    "strategy": "enter",
    "buttonSelectors": [
      "div[role=\"button\"][aria-label*=\"发送\" i]",
      "button[aria-label*=\"Send\" i]",
      "button[type=\"submit\"]"
    ]
  },
  "assistant": {
    "containerSelectors": [
      "div.ds-markdown",
      "div[class*=\"markdown\"]",
      "[data-message-author-role=\"assistant\"]",
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
      "input.ds-input__input[type=\"password\"][placeholder=\"Password\"]",
      ".ds-sign-in-form__social-link",
      "a[href*=\"/sign_in\"]",
      "a[href*=\"/login\"]",
      "form[action*=\"login\"]"
    ]
  },
  "status": "measured",
  "strengths": [
    "coding",
    "complex routing"
  ]
};
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
