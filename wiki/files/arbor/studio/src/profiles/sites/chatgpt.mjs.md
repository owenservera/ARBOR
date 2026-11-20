# File: studio/src/profiles/sites/chatgpt.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | studio/src/profiles/sites/chatgpt.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2282 B |
| Lines | 62 |
| Hash | 40917bf4bca8 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

_No symbols._

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/adapter-learning-pipeline.mjs](../../studio/adapter-learning-pipeline.mjs.md) | ../profiles/sites/chatgpt.mjs |
| [studio/src/studio/adapter-probes.mjs](../../studio/adapter-probes.mjs.md) | ../profiles/sites/chatgpt.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Measured selectors for chatgpt; the generic heuristic in src/capture/actions.mjs remains the fallback.
export default {
  id: 'chatgpt',
  label: 'ChatGPT',
  hosts: ['chatgpt.com', 'www.chatgpt.com', 'chat.openai.com'],
  url: 'https://chatgpt.com/',
  composer: {
    selectors: [
      'form div[contenteditable="true"]',
      '#prompt-textarea',
      'div.ProseMirror[contenteditable="true"]',
      '[data-testid="prompt-textarea"]',
      'textarea',
      '[contenteditable="true"]',
      '[role="textbox"]',
    ],
    kind: 'auto',
  },
  send: {
    // Live 2026-11-14: ChatGPT's Lexical composer no longer submits on the synthesized Enter shape
    // (typing verified, Enter did not submit). Submit via the send button instead; it is disabled
    // until the composer holds text, so this fails closed (not-attempted) rather than double-sending.
    strategy: 'button',
    buttonSelectors: [
      'button[data-testid="send-button"]',
      '#composer-submit-button',
      'form button[type="submit"]',
      'button[type="submit"]',
    ],
  },
  assistant: {
    containerSelectors: [
      '[data-markdown-text-style="assistant-message"]',
      '[data-content-search-unit-key$="assistant"]',
      '[data-chatgpt-search-unit-key$="assistant"]',
      '[data-message-author-role="assistant"]',
      'article',
      '[data-testid*="assistant" i]',
    ],
    streamingSelectors: [
      '[data-talvt-turn-state]:not([data-talvt-turn-state="complete"])',
      '[data-testid="stop-button"]',
      'button[aria-label*="Detener" i]',
      'button[aria-label*="Stop" i]',
      '[aria-busy="true"]',
    ],
    doneWhen: 'marker-gone',
  },
  preflight: {
    authWallSelectors: [
      '[data-testid="login-button"]',
      'a[href*="/auth/login"]',
      'button[data-testid="welcome-login"]',
      'form[action*="login"]',
    ],
    requiresAuth: true,
  },
  streamHints: {
    urlPatterns: ['/backend-api/conversation', '/backend-api/f/conversation', '/backend-api/conversation/init'],
    notes: 'Conversation turns POST to /backend-api/* (probe also saw POST /ces/v1/rgstr and one wss://codex-cloud-backend websocket); the reply body is a stream whose exact shape is unverified.',
  },
};
```

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
