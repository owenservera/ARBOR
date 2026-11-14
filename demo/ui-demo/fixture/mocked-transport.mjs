/* VIVIM UI demo — mocked-transport fixture (backend zero).
   Synthetic records only, derived from the walkthrough spec. No provider accounts,
   no real browser/CDP, no network. Intercepts same-origin product-relay fetch calls.
   Reads return synthetic JSON; every product-API write is refused 405. */

const RELAY = ['/api/relay', '/mobile/api/relay'];

const today = {
  snapshot: {
    live: {
      conversations: [
        { id: 'conv-2', provider: 'anthropic', messages: [{ id: 'm-5', state: 'uncertain', commandId: 'cmd-8' }] },
        { id: 'conv-1', provider: 'openai', model: 'gpt-5', messages: [{ id: 'm-9', state: 'waiting_reply' }] }
      ]
    },
    bootstrap: { progress: { passes: [{ pass: 'palette', status: 'running' }] } },
    bridge: { queued: 1, claimed: 0, done: 3, failed: 1 }
  },
  commands: [
    { id: 'cmd-9', mode: 'relay-chat', text: 'Summarize the intake notes', consumer: 'harness', status: 'failed', updatedAt: '2026-11-13T09:12:00Z' },
    { id: 'cmd-7', mode: 'relay-chat', text: 'Draft the demo outline', consumer: 'harness', status: 'done', updatedAt: '2026-11-13T08:40:00Z' }
  ],
  ctx: { connection: 'Direct to your PC', connectionTone: 'ok', paired: true, pendingSend: false }
};

const talk = {
  conversations: [{ id: 'conv-1', title: 'Demo outline', provider: 'openai', model: 'gpt-5',
    messages: [{ role: 'user', text: 'Draft the demo outline' }, { role: 'assistant', state: 'waiting_reply', text: 'Here is a first outline…' }] }],
  providers: [{ id: 'openai', label: 'OpenAI', signedIn: true }, { id: 'anthropic', label: 'Anthropic', signedIn: true }],
  focusViews: ['Today', 'World', 'Build'],
  rustContext: { state: 'Not loaded · Direct connection only' }
};

const build = {
  composeInput: 'Show a card listing the three demo beats',
  proposal: { id: 'prop-1', title: 'Demo beats card', status: 'done', description: 'Adds a card listing the three demo beats',
    preview: { type: 'card', id: 'c1', title: 'Demo beats', children: [{ type: 'text', props: { value: '1. Pair · 2. Talk · 3. Build' } }] } },
  revision: { surfaceId: 'surf-1', revision: 12, parentRevision: 11, changeId: 'chg-88', status: 'committed' }
};

const world = {
  revision: { surfaceId: 'surf-1', revision: 12, changeId: 'chg-88', parentRevision: 11, status: 'committed',
    tree: { type: 'stack', children: [
      { type: 'card', id: 'c1', props: { title: 'Demo beats', description: 'The three beats of the walkthrough' } },
      { type: 'text', id: 't1', props: { value: '1. Pair · 2. Talk · 3. Build' } },
      { type: 'button', id: 'b1', props: { label: 'Open outline', intent: 'open.outline' } }
    ] } },
  live: { conversations: [{ id: 'conv-1', provider: 'openai', messages: [{ state: 'waiting_reply' }] }] },
  bridge: { queued: 1, claimed: 0, done: 3, failed: 1 },
  bootstrap: { undo: { available: true } },
  commands: [{ id: 'cmd-9', mode: 'relay-chat', text: 'Summarize the intake notes', status: 'queued', updatedAt: '2026-11-13T09:05:00Z' }]
};

const me = {
  personalAgent: { agentId: 'vivim-local-7', scope: 'household', identityAssurance: 'device-bound', initialized: true },
  worldId: 'arbor-home-01',
  ctx: { paired: true, mode: 'direct', deviceStatus: 'granted', scopes: ['chat.send', 'build.propose', 'media.read'] },
  providers: [{ id: 'openai', signedIn: true }, { id: 'anthropic', signedIn: true }, { id: 'gemini', signedIn: false }],
  commands: [
    { id: 'cmd-7', mode: 'relay-chat', text: 'Draft the demo outline', status: 'done', updatedAt: '2026-11-13T08:40:00Z' },
    { id: 'cmd-9', mode: 'relay-chat', text: 'Summarize the intake notes', status: 'failed', updatedAt: '2026-11-13T09:12:00Z' }
  ]
};

const control = {
  controlRequest: 'Set my theme to dusk',
  previewResult: { ok: true, action: 'set-theme', params: { theme: 'dusk' }, receipt: 'pending-approval', note: 'Preview only — nothing changed yet' },
  controlActivity: [{ id: 'dec-3', request: 'Stop all traffic', decision: 'approved', receipt: 'host:rcpt-51', at: '2026-11-13T07:55:00Z' }]
};

const BY_PATH = { status: today, today, world, me, build, talk, conversations: talk, control };

const json = (code, value) => new Response(JSON.stringify(value), {
  status: code,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-vivim-demo': 'mocked-transport' }
});

const MUTATION = new Set(['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']);

function relayResponse(method, path) {
  if (MUTATION.has(method)) {
    return json(405, { code: 'PRODUCT_API_READ_ONLY', error: 'Demo harness is backend zero — product API writes are refused.', path, method });
  }
  return json(200, BY_PATH[path] ?? BY_PATH.status ?? { ok: true, path, demo: true });
}

const actualFetch = globalThis.fetch.bind(globalThis);
globalThis.fetch = (input, options = {}) => {
  const raw = typeof input === 'string' ? input : (input && input.url != null ? input.url : String(input ?? ''));
  let url;
  try { url = new URL(raw, location.href); } catch { return actualFetch(input, options); }
  if (RELAY.includes(url.pathname)) {
    const method = String((options && options.method) || (input && input.method) || 'GET').toUpperCase();
    const path = new URLSearchParams(url.search).get('path') || '';
    return Promise.resolve(relayResponse(method, path));
  }
  // Any other product-API surface under /api or /mobile/api is read-only too.
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/mobile/api/')) {
    const method = String((options && options.method) || (input && input.method) || 'GET').toUpperCase();
    if (MUTATION.has(method)) {
      return json(405, { code: 'PRODUCT_API_READ_ONLY', error: 'Demo harness is backend zero — product API writes are refused.', path: url.pathname, method });
    }
    return json(200, { ok: true, path: url.pathname, demo: true });
  }
  return actualFetch(input, options);
};
