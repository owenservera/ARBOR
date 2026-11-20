# File: harness/src/providers/gemini.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/src/providers/gemini.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2177 B |
| Lines | 83 |
| Hash | e95d7cbb4704 |
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
| [harness/src/providers/index.mjs](./index.mjs.md) | ./gemini.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Selectors seeded from the owner's site profile; individual selectors may be unverified.
export default {
  "id": "gemini",
  "label": "Gemini",
  "hosts": [
    "gemini.google.com"
  ],
  "url": "https://gemini.google.com/app",
  "threadPattern": /^\/app\/(?<id>[0-9a-f]{8,})\/?$/i,
  "composer": {
    "selectors": [
      "textarea[placeholder=\"Ask Gemini\"]",
      "div[data-placeholder=\"Ask Gemini\"]",
      "rich-textarea div[contenteditable=\"true\"]",
      "div.ql-editor[contenteditable=\"true\"]",
      "textarea",
      "[contenteditable=\"true\"]",
      "[role=\"textbox\"]"
    ]
  },
  "send": {
    "strategy": "enter",
    "buttonSelectors": [
      "button[aria-label=\"Send message\"]",
      "button.send-button",
      "button[type=\"submit\"]"
    ]
  },
  "user": {
    "selectors": [
      "user-query"
    ],
    "lineSelector": "p.query-text-line"
  },
  "assistant": {
    "containerSelectors": [
      "model-response message-content",
      "assistant-messages-primary > div",
      "user-query, model-response",
      "model-response",
      "[data-message-author-role=\"assistant\"]",
      "article",
      "[data-testid*=\"assistant\" i]"
    ],
    "streamingSelectors": [
      "button[aria-label*=\"Stop\" i]",
      "[role=\"button\"][aria-label*=\"Stop\" i]",
      "[data-testid=\"stop-button\"]",
      "[aria-busy=\"true\"]:not(button)"
    ]
  },
  "preflight": {
    "authWallSelectors": [
      "a[href*=\"accounts.google.com/ServiceLogin\"]",
      "a[href*=\"accounts.google.com\"][href*=\"signin\" i]",
      "a[href*=\"/signin\"]",
      "form[action*=\"signin\"]"
    ],
    "signedInSelectors": [
      "a[aria-label*=\"Google Account\" i]",
      "a[href*=\"accounts.google.com/SignOutOptions\"]"
    ]
  },
  "status": "measured",
  "models": {
    "triggerSelector": "button[data-test-id=\"bard-mode-menu-button\"]",
    "ignore": [
      "^thinking level"
    ],
    "tiers": {
      "strong": [
        "pro$"
      ],
      "fast": [
        "^auto$"
      ]
    }
  },
  "strengths": [
    "complex routing",
```

_First 80 of 84 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
