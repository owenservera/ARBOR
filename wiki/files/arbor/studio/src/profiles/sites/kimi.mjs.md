# File: studio/src/profiles/sites/kimi.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | studio/src/profiles/sites/kimi.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1891 B |
| Lines | 58 |
| Hash | 97b8246956a4 |
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

```javascript
// Measured selectors for kimi; the generic heuristic in src/capture/actions.mjs remains the fallback.
export default {
  id: 'kimi',
  label: 'Kimi',
  hosts: ['www.kimi.com', 'kimi.com', 'kimi.moonshot.cn'],
  url: 'https://www.kimi.com/',
  composer: {
    selectors: [
      // Measured 2026-10-29: .chat-input-editor is the composer. Only select
      // its editable state; the landing shell also renders it contenteditable=false.
      'div.chat-input-editor[contenteditable="true"]',
      'form div[contenteditable="true"]',
      'div[contenteditable="true"][role="textbox"]',
      'div.ProseMirror[contenteditable="true"]',
      'div[contenteditable="true"][data-testid]',
      'textarea',
      '[contenteditable="true"]',
      '[role="textbox"]',
    ],
    kind: 'auto',
  },
  send: {
    strategy: 'enter',
    buttonSelectors: [
      'form button[type="submit"]',
      'button[type="submit"]',
      'form button:last-of-type',
    ],
  },
  assistant: {
    containerSelectors: [
      '[data-message-author-role="assistant"]',
      'div[class*="markdown"]',
      'div[class*="prose"]',
      'article',
      '[data-testid*="assistant" i]',
    ],
    streamingSelectors: [
      'button[aria-label*="stop" i]',
      '[role="button"][aria-label*="stop" i]',
      '[data-testid="stop-button"]',
      '[aria-busy="true"]',
    ],
    doneWhen: 'text-stable',
  },
  preflight: {
    authWallSelectors: [
      'a[href*="/login"]',
      'a[href*="/signin"]',
      'form[action*="login"]',
    ],
    requiresAuth: true,
  },
  streamHints: {
    urlPatterns: ['/apiv2/kimi.gateway.chat.v1.KimiPlusService/'],
    notes: 'The probe saw only POST /apiv2/kimi.gateway.chat.v1.KimiPlusService/ListKimiPlus (a list RPC, status 200), so the chat-completion RPC and its response shape are unverified.',
  },
};
```

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
