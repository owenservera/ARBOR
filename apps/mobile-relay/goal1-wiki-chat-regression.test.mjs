// Wiki now renders in the actual phone PWA. Preserve the chat error regressions below.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const here = new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const appSrc = readFileSync(here + 'app.js', 'utf8');
const chatSrc = readFileSync(here + '../vivim-host/public/pages/chat.js', 'utf8');

function extractFn(src, name) {
  src = src.replace(/\r\n/g, '\n');
  let start = src.indexOf('function ' + name + '(');
  assert.notEqual(start, -1, name + '() not found');
  if (src.slice(Math.max(0, start - 6), start) === 'async ') start -= 6;
  // the body brace is the first '{' at paren depth 0 — a naive indexOf('{') would
  // stop inside a default parameter like `options = {}` (chat.js:86)
  let i = src.indexOf('(', start), parens = 0;
  for (; i < src.length; i++) {
    if (src[i] === '(') parens++;
    else if (src[i] === ')') parens--;
    else if (src[i] === '{' && parens === 0) break;
  }
  let depth = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') { depth--; if (depth === 0) return src.slice(start, j + 1); }
  }
  throw new Error('unbalanced braces in ' + name);
}

test('Wiki is selected in the actual phone tab and refreshed', () => {
  const calls = [];
  const tab = { scrollIntoView() { calls.push('scroll'); } };
  const sandbox = {
    S: { tab: 'talk' }, TABS: ['talk', 'wiki'], HOST_PREVIEW: false,
    dockExpanded: false, chatContextEpoch: 0, chatContext: null,
    // app.js module-scope names goTab touches (app.js:136 let dockAssist, :1676 let compose,
    // plus the guarded clearWikiSources/build/$ /schedule/refreshHostPreview branches at :467-484)
    dockAssist: { reset() {} }, compose: { resetAssist() {} },
    clearWikiSources() {}, build: null, $: () => null, schedule() {}, refreshHostPreview() {},
    closeDrawer() {}, renderTabs() { calls.push('tabs'); },
    renderSurfaces() { calls.push('surface'); },
    refreshWiki() { calls.push('wiki'); },
    refreshMedia() {}, playerActive: false, stopMediaPlayer() {},
    document: { getElementById: () => tab }
  };
  vm.createContext(sandbox);
  vm.runInContext(extractFn(appSrc, 'goTab'), sandbox);
  sandbox.goTab('wiki');
  assert.equal(sandbox.S.tab, 'wiki');
  assert.deepEqual(calls, ['tabs', 'surface', 'scroll', 'wiki']);
});

// ---- chat.js harness: refresh() against a mock DOM + failing /api/state ----
function makeChatHarness({ fail = false } = {}) {
  const els = { log: { children: [], scrollTop: 0, scrollHeight: 0, get firstChild() { return this.children[0]; }, replaceChildren(...c) { this.children = c; return c[0]; }, appendChild(c) { this.children.push(c); } },
                rev: { textContent: '' }, f: { addEventListener() {} }, t: { value: '' }, send: { disabled: false } };
  const doc = {
    getElementById: id => els[id],
    createElement: () => ({ textContent: '', innerHTML: '', className: '', children: [], appendChild(c) { this.children.push(c); } }),
  };
  const sandbox = {
    document: doc,
    fetch: async () => fail
      ? { ok: false, status: 500, json: async () => ({ error: 'Product projection unavailable' }) }
      : { ok: true, status: 200, json: async () => ({ revision: 7, wikiRevision: 3, chat: [] }) },
    setInterval: () => 1, clearInterval() {},
    // chat.js:86 helper is `json`; refresh() (chat.js:155-167) closes over json/STATE_URL/rev/log
    // and the render helpers element/messageNode/intentNode (chat.js:41/148/140)
    rev: els.rev, log: els.log, POLL_MS: 1500, STATE_URL: '/api/state', MUTATE_URL: '/api/mutate',
    element: (tag, className, value) => ({ tag, className: className || '', textContent: value ?? '', children: [], append() {} }),
    messageNode: () => ({}), intentNode: () => ({}),
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  const prelude = 'var json, refresh;\n(async () => {\n';
  const epilogue = '\njson = json; refresh = refresh; globalThis.refresh = refresh;\n})();';
  vm.runInContext(prelude + extractFn(chatSrc, 'json') + '\n' + extractFn(chatSrc, 'refresh') + epilogue, sandbox, { filename: 'chat-slice.js' });
  return { sandbox, els, ready: new Promise(r => setImmediate(r)) };
}

test('GOAL-1 defect: /chat refresh() failure must NOT render the bare literal "state error"', async () => {
  const h = makeChatHarness({ fail: true });
  await h.sandbox.refresh();
  assert.notEqual(h.els.rev.textContent, 'state error',
    'bare "state error" literal is the defect; banner must carry the HTTP status or error message');
  // Contract: message text includes something actionable — status code or error body.
  assert.match(h.els.rev.textContent, /\d{3}|Product projection unavailable|HTTP/i,
    'failure banner must surface the HTTP status or server error message; got: ' + JSON.stringify(h.els.rev.textContent));
});

test('GOAL-1 defect: /chat refresh() failure banner is dismissible/retryable — actionable, not persistent bare banner', async () => {
  const h = makeChatHarness({ fail: true });
  await h.sandbox.refresh();
  const text = h.els.rev.textContent;
  // retry affordance: banner names the retry cadence ("retrying every Ns") or a
  // retry control is wired; a timestamp also marks it as per-attempt. Bare
  // literal on repeat polls is the defect.
  const revEl = h.els.rev;
  const hasRetry = /retry/i.test(text) || typeof revEl.onclick === 'function';
  const hasStamp = /\d{1,2}:\d{2}/.test(text);
  assert.ok(hasRetry || hasStamp, 'failure banner must offer retry or timestamp; got: ' + JSON.stringify(text));
  // second poll with same failure: still no bare literal
  await h.sandbox.refresh();
  assert.notEqual(revEl.textContent, 'state error');
});

test('GOAL-1 acceptance: healthy /api/state renders rev + chat without error', async () => {
  const h = makeChatHarness({ fail: false });
  await h.sandbox.refresh();
  assert.match(h.els.rev.textContent, /state rev 7 · wiki rev 3/);
});