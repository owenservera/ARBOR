// Focused acceptance for VERIFY:CONSOLIDATE:apps/vivim-host/public/pages.
// Owner UI (chat) renders live committed Host state and actual errors.
// The chat page consumes typed Host state via /api/state and /api/mutate and
// performs no direct native I/O; the /mobile/* imports are phone UI helpers,
// stripped here and injected as globals (mirrors test/chat-command-surface.test.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const src = readFileSync(fileURLToPath(new URL('../public/pages/chat.js', import.meta.url)), 'utf8');
const entry = src
  .replace("import { resolveDesktopDestination, resolveProductRoute } from '/mobile/control-language.mjs';", '')
  .replace("import { mountComposerAssist } from '/mobile/composer-assist.mjs';", '');

const tick = () => new Promise(resolve => setImmediate(resolve));

class FakeNode {
  constructor(tag = 'div') {
    this.tagName = tag; this.children = []; this.listeners = new Map(); this.dataset = {};
    this.value = ''; this.disabled = false; this.hidden = false; this.textContent = '';
    this.type = ''; this.className = ''; this.id = tag;
  }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = [...nodes]; }
  addEventListener(name, cb) { this.listeners.set(name, cb); }
  async trigger(name, event = { preventDefault() {} }) { return this.listeners.get(name)?.(event); }
  setAttribute(key, value) { this[key] = String(value); }
  focus() {}
}

const text = node => !node ? '' : [node.textContent, ...node.children.map(text)].join(' ');

const REV = 'a'.repeat(64);

function makeElements() {
  const nodes = new Map();
  const add = (id, tag = 'div') => { const n = new FakeNode(tag); n.id = id; nodes.set(id, n); return n; };
  add('log'); add('rev', 'span'); add('f', 'form'); add('t', 'textarea'); add('send', 'button');
  add('control-status', 'span'); add('control-result', 'div'); add('control-recent', 'div');
  add('control-logout', 'button'); add('composer-assist', 'div');
  add('teach-phrase', 'input'); add('teach-command', 'textarea'); add('teach-share-phone', 'input');
  add('teach-rule-form', 'form'); add('teach-program-example', 'button'); add('show-rules', 'button');
  add('learned-rules', 'div');
  return nodes;
}

function makeWindow(hash = '') {
  const storage = {};
  return {
    location: { hash, pathname: '/chat', search: '' },
    history: { replaceState: () => {} },
    sessionStorage: {
      getItem: k => storage[k] ?? null,
      removeItem: k => { delete storage[k]; },
      setItem: (k, v) => { storage[k] = String(v); },
    },
    addEventListener: () => {},
  };
}

function runChat(fetchImpl, hash = '') {
  const nodes = makeElements();
  const document = {
    getElementById: id => nodes.get(id) || null,
    createElement: () => new FakeNode(),
    querySelectorAll: () => [],
    addEventListener: () => {},
    hidden: false,
  };
  const window = makeWindow(hash);
  const context = {
    document, window, fetch: fetchImpl,
    console, Date, JSON, Map, Object, String, Number, Math, Array,
    AbortSignal: { timeout: () => undefined },
    setInterval: () => 0, clearInterval: () => {}, setTimeout, clearTimeout,
    encodeURIComponent,
    resolveDesktopDestination: () => null,
    resolveProductRoute: () => ({ kind: 'unavailable' }),
    mountComposerAssist: () => ({ reset: () => {}, refresh: () => {} }),
  };
  vm.runInNewContext(entry, context, { filename: 'chat.js' });
  return { nodes, text: id => text(nodes.get(id)), trigger: (id, name) => nodes.get(id)?.trigger(name) };
}

test('chat page renders live committed Host state', async () => {
  const messages = [
    { who: 'user', text: 'hello from human', at: '2026-11-20T00:00:00.000Z', revision: 1 },
    { who: 'system', text: 'hello from ai', at: '2026-11-20T00:00:01.000Z', revision: 2 },
  ];
  const ui = runChat(async url => {
    if (url.endsWith('/api/state')) return { ok: true, status: 200, json: async () => ({ schemaVersion: 1, chat: messages, wikiRevision: 1, revision: 2 }) };
    if (url.endsWith('/api/host/control/ui-state')) return { ok: true, status: 200, json: async () => ({ schema: 'vivim.control-ui-session/1', csrf: REV }) };
    return { ok: false, status: 404, json: async () => ({}) };
  });
  for (let i = 0; i < 10; i++) await tick();
  assert.match(ui.text('log'), /hello from human/);
  assert.match(ui.text('log'), /hello from ai/);
  assert.match(ui.text('rev'), /state rev 2/);
  assert.match(ui.text('rev'), /wiki rev 1/);
  assert.match(ui.text('control-status'), /Owner session active/);
});

test('chat page renders the actual error when Host state is unavailable', async () => {
  const ui = runChat(async url => {
    if (url.endsWith('/api/state')) return { ok: false, status: 503, json: async () => ({ error: 'db busy' }) };
    if (url.endsWith('/api/host/control/ui-state')) return { ok: true, status: 200, json: async () => ({ schema: 'vivim.control-ui-session/1', csrf: REV }) };
    return { ok: false, status: 404, json: async () => ({}) };
  });
  for (let i = 0; i < 10; i++) await tick();
  // The page reports the actual failure reason from the Host, not a generic sentence.
  assert.match(ui.text('rev'), /Chat state unavailable/);
  assert.match(ui.text('rev'), /db busy/);
});

test('chat page does not execute a Host effect without explicit approval', async () => {
  let executeCalls = 0;
  const ui = runChat(async (url, opts = {}) => {
    if (url.endsWith('/api/state')) return { ok: true, status: 200, json: async () => ({ schemaVersion: 1, chat: [], wikiRevision: 1, revision: 1 }) };
    if (url.endsWith('/api/host/control/ui-state')) return { ok: true, status: 200, json: async () => ({ schema: 'vivim.control-ui-session/1', csrf: REV }) };
    if (url.endsWith('/api/mutate')) return { ok: true, status: 200, json: async () => ({ kind: 'chat-send' }) };
    if (url.endsWith('/api/host/control/plan')) return { ok: true, status: 200, json: async () => ({ outcome: 'approval_required', planId: 'ctl-0000000000000001', planDigest: 'x'.repeat(64), title: 'Set theme', actionId: 'ui.theme.set_preset', risk: 'low', args: {}, expiresAt: new Date(Date.now() + 60000).toISOString() }) };
    if (url.endsWith('/api/host/control/execute')) { executeCalls += 1; return { ok: true, status: 200, json: async () => ({ status: 'applied', actionId: 'ui.theme.set_preset', planId: 'ctl-0000000000000001' }) }; }
    return { ok: false, status: 404, json: async () => ({}) };
  });
  // Submit a chat message: stored, then a typed plan requiring explicit approval.
  ui.nodes.get('t').value = 'set my theme to dusk';
  await ui.nodes.get('f').trigger('submit');
  for (let i = 0; i < 20; i++) await tick();
  assert.equal(executeCalls, 0, 'no execute before approval');
  assert.match(ui.text('control-result'), /Approve & apply on PC/, 'typed plan rendered for explicit approval');
  const collect = [];
  const walk = (n) => { collect.push(n); n.children.forEach(walk); };
  walk(ui.nodes.get('control-result'));
  const approve = collect.find(n => n.textContent && n.textContent.includes('Approve & apply on PC'));
  assert.ok(approve, 'approval button rendered for typed plan');
  await approve.trigger('click');
  for (let i = 0; i < 10; i++) await tick();
  assert.equal(executeCalls, 1, 'exactly one execute after explicit approval');
  assert.match(ui.text('control-result'), /Applied by Host/);
});
