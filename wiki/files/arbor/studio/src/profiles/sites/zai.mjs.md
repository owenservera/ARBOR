# File: studio/src/profiles/sites/zai.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | studio/src/profiles/sites/zai.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2523 B |
| Lines | 72 |
| Hash | fb762ece2cc8 |
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
// Measured selectors for zai; the generic heuristic in src/capture/actions.mjs remains the fallback.
export default {
  id: 'zai',
  label: 'Z.ai',
  hosts: ['chat.z.ai', 'z.ai', 'www.z.ai'],
  url: 'https://chat.z.ai/',
  composer: {
    selectors: [
      'textarea#chat-input',
      '#chat-input',
      'textarea[placeholder*="Send a Message" i]',
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
      '#send-message-button',
      'form button[type="submit"]',
      'button[type="submit"]',
    ],
  },
  assistant: {
    // Measured on chat.z.ai/c/<uuid> (2026-10-29, signed in): every turn is a wrapper
    // #message-<uuid> inside #messages-container; the prompt bubble is .chat-user and the answer
    // is .chat-assistant. The previous generic guesses (div[class*="prose"], article) matched the
    // anonymous footer wrapper instead, so the page footer was read back as the reply.
    containerSelectors: [
      '#messages-container .chat-assistant',
      '#messages-container [id^="message-"]:not(.user-message)',
    ],
    // Decoration around the answer, not the answer: the collapsed "Thought Process" header would
    // otherwise prefix every reply with "Thought Process".
    stripSelectors: ['.thinking-chain-container'],
    // Regions that sit next to the answer and were read as it: the composer panel ("Choose
    // project"), the new-chat landing pane ("More than coding..." + model chip), the prompt
    // bubble, the thinking header, and the site chrome.
    ignoreSelectors: [
      '.messageInputContainer',
      '.agent-home-scroll',
      '.chat-user',
      '.thinking-chain-container',
      'nav',
      'footer',
      'header',
      'aside',
    ],
    streamingSelectors: [
      'button[aria-label*="stop" i]',
      '[role="button"][aria-label*="stop" i]',
      '#send-message-button[aria-label*="stop" i]',
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
    urlPatterns: ['/api/v1/scene-cfg'],
    notes: 'The probe captured only GET /api/v1/scene-cfg (scene configuration, 2 calls) and no completion request, so the reply transport is unverified.',
  },
};
```

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
