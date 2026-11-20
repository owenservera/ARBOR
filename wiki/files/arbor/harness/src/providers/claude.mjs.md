# File: harness/src/providers/claude.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/src/providers/claude.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2413 B |
| Lines | 84 |
| Hash | 6098ea9cfde2 |
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
| [harness/src/providers/index.mjs](./index.mjs.md) | ./claude.mjs |
| [harness/test/core/relay-chat-fixes.test.mjs](../../test/core/relay-chat-fixes.test.mjs.md) | ../../src/providers/claude.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Selectors seeded from the owner's site profile; individual selectors may be unverified.
export default {
  "id": "claude",
  "label": "Claude",
  "hosts": [
    "claude.ai",
    "www.claude.ai"
  ],
  "url": "https://claude.ai/",
  "threadPattern": /^\/chat\/(?<id>[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/?$/i,
  "composer": {
    "selectors": [
      "div[data-testid=\"chat-input\"]",
      "fieldset div[contenteditable=\"true\"]",
      "div[contenteditable=\"true\"][aria-label=\"Write your prompt to Claude\"]",
      "div.ProseMirror[contenteditable=\"true\"]",
      "textarea",
      "[contenteditable=\"true\"]",
      "[role=\"textbox\"]"
    ]
  },
  "send": {
    "strategy": "enter",
    "buttonSelectors": [
      "button[aria-label=\"Send message\"]",
      "button[data-testid=\"send-button\"]",
      "fieldset button[type=\"submit\"]",
      "button[type=\"submit\"]"
    ]
  },
  "assistant": {
    "containerSelectors": [
      "[data-testid=\"assistant-message\"] .standard-markdown",
      "[data-testid=\"assistant-message\"]",
      "[data-message-author-role=\"assistant\"]",
      "article",
      "[data-testid*=\"assistant\" i]"
    ],
    "streamingSelectors": [
      "button[aria-label*=\"Stop\" i]",
      "[role=\"button\"][aria-label*=\"Stop\" i]",
      "[data-testid=\"stop-button\"]",
      "[data-is-streaming=\"true\"]",
      "[aria-busy=\"true\"]:not(button)"
    ]
  },
  "preflight": {
    "authWallSelectors": [
      "a[href*=\"/login\"]",
      "button[data-testid=\"login-button\"]",
      "input[name=\"email\"][autocomplete=\"username\"]",
      "form[action*=\"login\"]"
    ],
    "dismissButtonTexts": ["Reject all cookies"]
  },
  "status": "measured",
  "models": {
    "triggerSelector": "button[data-testid=\"model-selector-dropdown\"]",
    "submenuText": "More models",
    "effortMenu": { "text": "Effort", "levels": ["Low", "Medium", "High", "Max"] },
    "ignore": [
      "^effort",
      "^more models",
      "included in",
      "^buy credits",
      "^requires usage credits",
      "^learn more",
      "^(low|medium|high|max)$"
    ],
    "tiers": {
      "strong": [
        "^opus 5\\.5$",
        "^sonnet 5\\.5$"
      ],
      "fast": [
        "^haiku"
      ]
    }
  },
  "strengths": [
```

_First 80 of 85 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
