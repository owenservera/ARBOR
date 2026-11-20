# File: studio/src/profiles/sites/qwen.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | studio/src/profiles/sites/qwen.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2565 B |
| Lines | 69 |
| Hash | a0db59908da7 |
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
// Measured selectors for qwen; the generic heuristic in src/capture/actions.mjs remains the fallback.
export default {
  id: 'qwen',
  label: 'Qwen Chat',
  hosts: ['chat.qwen.ai', 'qwen.ai'],
  url: 'https://chat.qwen.ai/',
  composer: {
    selectors: [
      // Measured 2026-10-29 on the current Qwen landing page (guest session).
      'textarea.message-input-textarea',
      'textarea#chat-input',
      'textarea[placeholder*="How can I help you today" i]',
      'div[contenteditable="true"][role="textbox"]',
      'form textarea',
      'textarea',
      '[contenteditable="true"]',
      '[role="textbox"]',
    ],
    kind: 'auto',
  },
  send: {
    strategy: 'enter',
    buttonSelectors: [
      'button#send-message-button',
      'form button[type="submit"]',
      'button[type="submit"]',
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
    // Measured 2026-10-30 on the owner's signed-in chat.qwen.ai tab: the only account control is
    // <button class="user-menu-btn"> holding <img class="user-img" alt="User profile"> plus the account
    // name and plan badge. It does not exist on a signed-out page, so it is positive sign-in proof.
    signedInSelectors: [
      'button.user-menu-btn',
      'img.user-img[alt*="User profile" i]',
    ],
    authWallSelectors: [
      // Both "Log in" and "Sign up" are buttons with this class, not links.
      // A guest composer can still be visible; its presence is not sign-in proof. The class is also
      // reused by header controls after sign-in, which is why a matched selector alone is only a weak
      // signal and `signedInSelectors` above outranks it (src/capture/actions.mjs detectAuthWall).
      'button.header-right-auth-button',
      'a[href*="/auth"]',
      'a[href*="/login"]',
      'form[action*="login"]',
    ],
    requiresAuth: true,
  },
  streamHints: {
    urlPatterns: ['/api/v2/users/status', '/api/v2/chats'],
    notes: 'The probe captured POST /api/v2/users/status (a Ping-type call, 2 uses) and no chat completion request, so the stream endpoint and shape are unverified.',
  },
};
```

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
