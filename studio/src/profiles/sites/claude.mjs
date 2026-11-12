// Measured selectors for claude; the generic heuristic in src/capture/actions.mjs remains the fallback.
export default {
  id: 'claude',
  label: 'Claude',
  hosts: ['claude.ai', 'www.claude.ai'],
  url: 'https://claude.ai/',
  composer: {
    // Measured 2026-11-04 (Chrome 156, signed-in owner profile): claude.ai paints a bare <textarea>
    // loading shell before the app hydrates, and that shell is REPLACED once the editor mounts. Because
    // findComposer returns the first selector that matches anything usable, the old generic `textarea`
    // fallback won the race: the drive typed into the shell, the node was swapped, and the post-type
    // read came back null -> composer-unreadable -> nothing sent (fail-closed, but unusable).
    // The real composer is the ProseMirror contenteditable below; the generic textarea/textbox
    // fallbacks are deliberately ABSENT so waitForComposer keeps polling for the hydrated editor
    // instead of latching onto the shell. No match inside the wait budget = no-composer = fail closed.
    selectors: [
      'div[data-testid="chat-input"]',
      'fieldset div[contenteditable="true"]',
      'div[contenteditable="true"][aria-label*="prompt" i]',
      'div.ProseMirror[contenteditable="true"]',
      'div[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"]',
    ],
    kind: 'auto',
  },
  send: {
    strategy: 'enter',
    buttonSelectors: [
      'button[aria-label="Send message"]',
      'button[data-testid="send-button"]',
      'fieldset button[type="submit"]',
      'button[type="submit"]',
    ],
    // Claude hides (visibility:hidden, inert) the send button while the composer is empty and shows the
    // voice-mode button in its place. Idle-state evidence only; never used to find a button to click.
    idleSelectors: [
      'button[aria-label="Use voice mode"]',
    ],
  },
  // Measured on the live claude.ai transcript (2026-10-29): user text lives in [data-testid=user-message],
  // the reply in [data-testid=assistant-message] whose body is [data-perf-reply-text] (the node also holds an
  // sr-only "Claude responded:" heading, an action bar and a timestamp). Both rows carry the provider's own
  // stable identity in `data-turn-key` (user: <uuid>, reply: <uuid>-hub-reply).
  transcript: {
    userSelectors: ['[data-testid="user-message"]'],
    assistantSelectors: ['[data-testid="assistant-message"]'],
    textSelector: '[data-perf-reply-text]',
    idAttribute: 'data-turn-key',
  },
  assistant: {
    containerSelectors: [
      'div[class*="prose"]',
      '[data-testid="assistant-message"]',
      '[data-message-author-role="assistant"]',
      'article',
      '[data-testid*="assistant" i]',
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
    urlPatterns: [
      '/api/organizations/',
      '/chat_conversations_v2',
      '/claudeai-rpc/anthropic.bard.api.v1alpha.ConversationService/',
    ],
    notes: 'The probe saw GET /api/organizations/:id/chat_conversations_v2 plus POST /claudeai-rpc/...ConversationService/:id, and the response framing is unverified.',
  },
};
