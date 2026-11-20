# File: studio/src/profiles/sites/grok.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | studio/src/profiles/sites/grok.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1549 B |
| Lines | 55 |
| Hash | 05b2d9e1a17f |
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
// Measured selectors for grok; the generic heuristic in src/capture/actions.mjs remains the fallback.
export default {
  id: 'grok',
  label: 'Grok',
  hosts: ['grok.com', 'www.grok.com', 'grok.x.ai'],
  url: 'https://grok.com/',
  composer: {
    selectors: [
      'div[contenteditable="true"]',
      'textarea',
      '[contenteditable="true"]',
      '[role="textbox"]',
    ],
    kind: 'auto',
  },
  send: {
    strategy: 'enter',
    buttonSelectors: [
      'button[data-testid="send-button"]',
      'button[aria-label="Send"]',
      'button[aria-label="Send prompt"]',
      'form button[type="submit"]',
      'button[type="submit"]',
    ],
  },
  assistant: {
    containerSelectors: [
      '[data-message-author-role="assistant"]',
      'article',
      '[data-testid*="assistant" i]',
      'div[class*="prose"]',
    ],
    streamingSelectors: [
      'button[aria-label*="Stop" i]',
      '[role="button"][aria-label*="Stop" i]',
      '[data-testid="stop-button"]',
      '[data-is-streaming="true"]',
      '[aria-busy="true"]',
    ],
    doneWhen: 'text-stable',
  },
  preflight: {
    authWallSelectors: [
      'a[href*="/login"]',
      'button[data-testid="login-button"]',
      'input[name="email"][autocomplete="username"]',
      'form[action*="login"]',
    ],
    requiresAuth: true,
  },
  streamHints: {
    urlPatterns: [],
    notes: 'Grok transport framing and reply endpoints are unverified; selector profile is seeded from the owner site.',
  },
};
```

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
