# File: studio/src/profiles/sites/gemini.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | studio/src/profiles/sites/gemini.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3541 B |
| Lines | 84 |
| Hash | 3f2d15a82136 |
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
| [studio/src/studio/adapter-learning-pipeline.mjs](../../studio/adapter-learning-pipeline.mjs.md) | ../profiles/sites/gemini.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Measured selectors for gemini; the generic heuristic in src/capture/actions.mjs remains the fallback.
export default {
  id: 'gemini',
  label: 'Gemini',
  hosts: ['gemini.google.com'],
  url: 'https://gemini.google.com/app',
  composer: {
    selectors: [
      // Dedicated capture Chrome, 2026-10-29: the new-chat composer is now a textarea.
      'textarea[placeholder="Ask Gemini"]',
      'div[data-placeholder="Ask Gemini"]',
      'rich-textarea div[contenteditable="true"]',
      'div.ql-editor[contenteditable="true"]',
      'textarea',
      '[contenteditable="true"]',
      '[role="textbox"]',
    ],
    kind: 'auto',
    // Measured 2026-11-04 with the gemini channel: on a WARM /app tab the drive focuses, clears and
    // types into the composer and submits with Enter (two turns sent, replies read). On a COLD tab
    // opened by the same run it fails closed with composer-unreadable (nothing typed or sent), so a
    // cold Gemini send is not yet reliable and the matched selector below is unconfirmed.
    notes: 'warm tab: types + Enter sends; cold tab: composer-unreadable before typing.',
  },
  send: {
    strategy: 'enter',
    buttonSelectors: [
      'button[aria-label="Send message"]',
      'button.send-button',
      'button[type="submit"]',
    ],
  },
  assistant: {
    containerSelectors: [
      'assistant-messages-primary > div',
      'user-query, model-response',
      'model-response',
      '[data-message-author-role="assistant"]',
      'article',
      '[data-testid*="assistant" i]',
    ],
    streamingSelectors: [
      'button[aria-label*="Stop" i]',
      '[role="button"][aria-label*="Stop" i]',
      '[data-testid="stop-button"]',
      '[aria-busy="true"]',
    ],
    doneWhen: 'text-stable',
  },
  preflight: {
    // Measured 2026-10-30 on the owner's signed-in gemini.google.com/app tab. The Google account
    // button is an <a> whose aria-label starts "Google Account:" and whose href is
    // accounts.google.com/SignOutOptions — i.e. the site's own accounts.google.com link is a SIGNED-IN
    // control, not a wall, which is why signedInSelectors must outrank authWallSelectors below.
    signedInSelectors: [
      'a[aria-label*="Google Account" i]',
      'a[href*="accounts.google.com/SignOutOptions"]',
    ],
    authWallSelectors: [
      'a[href*="accounts.google.com"]',
      'a[href*="/signin"]',
      'form[action*="signin"]',
    ],
    requiresAuth: true,
  },
  streamHints: {
    urlPatterns: ['/_/BardChatUi/data/batchexecute'],
    notes: 'Replies arrive as POST /_/BardChatUi/data/batchexecute batched-RPC frames (probe saw 27 calls, plus 49 cspreport posts); the payload encoding is unverified.',
  },
  // Measured 2026-11-04 (first time a Gemini thread identity was observed): a fresh chat lives on
  // /app and the first send pins it to /app/<hex>, which is a durable address. The harness thread map
  // (src/capture/conversation-thread.mjs SITE_THREADS) still has no gemini entry, so driveParseThread
  // returns null and drive cannot prove or address a Gemini thread; the gemini channel does the
  // binding proof itself before each turn. Adding gemini here is the drive-layer change that would
  // let drive address a thread by URL.
  thread: {
    kind: 'gemini-app',
    pinnedAfterFirstSend: true,
    path: '/app/<hex>',
    freshPaths: ['/', '/app'],
```

_First 80 of 85 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
