# File: studio/src/profiles/sites/deepseek.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | studio/src/profiles/sites/deepseek.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2249 B |
| Lines | 63 |
| Hash | eb1d6dbddb62 |
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
// Measured selectors for deepseek; the generic heuristic in src/capture/actions.mjs remains the fallback.
export default {
  id: 'deepseek',
  label: 'DeepSeek',
  hosts: ['chat.deepseek.com'],
  url: 'https://chat.deepseek.com/',
  composer: {
    selectors: [
      // Measured on the live site (2026-10-22): the message box is a textarea named "search"
      // whose placeholder is "Message DeepSeek". It is NOT a search box.
      'textarea[placeholder*="Message DeepSeek" i]',
      'textarea[name="search"]',
      'textarea#chat-input',
      'div[contenteditable="true"][role="textbox"]',
      'textarea[placeholder*="发送消息" i]',
      'textarea[placeholder*="Send" i]',
      'textarea',
      '[contenteditable="true"]',
      '[role="textbox"]',
    ],
    kind: 'auto',
  },
  send: {
    strategy: 'enter',
    buttonSelectors: [
      'div[role="button"][aria-label*="发送" i]',
      'button[aria-label*="Send" i]',
      'button[type="submit"]',
    ],
  },
  assistant: {
    containerSelectors: [
      'div.ds-markdown',
      'div[class*="markdown"]',
      '[data-message-author-role="assistant"]',
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
      // Dedicated capture Chrome, 2026-10-29: / redirects to /sign_in. The
      // login actions are divs, not links or a form[action="login"].
      'input.ds-input__input[type="password"][placeholder="Password"]',
      '.ds-sign-in-form__social-link',
      'a[href*="/sign_in"]',
      'a[href*="/login"]',
      'form[action*="login"]',
    ],
    requiresAuth: true,
  },
  streamHints: {
    urlPatterns: ['/api/v0/chat/completion', '/api/v0/chat/create_pow_challenge'],
    notes: 'The probe reached only the landing view and captured GET /api/v0/client/settings plus POST /api/v0/chat/create_pow_challenge; the completion stream path is inferred and unverified, and the composer may need an existing conversation.',
  },
};
```

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
