// GOAL-1 regression — confirmed defects: Wiki rail tab dead end + /chat bare "state error".
// Harness: node:vm slices of the two scope files (no browser, no Host boot).
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
  let i = src.indexOf('{', start), depth = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') { depth--; if (depth === 0) return src.slice(start, j + 1); }
  }
  throw new Error('unbalanced braces in ' + name);
}

// ---- app.js harness: openWiki + goTab + renderTabs against a mock DOM ----
function makeAppHarness({ popupResult = null, popupThrows = false } = {}) {
  const body = {
    tabButtons: ['talk', 'wiki'].map(t => ({ dataset: { tab: t }, setAttribute() { this.attrs ||= {}; this.attrs[String(arguments[0])] = String(arguments[1]); }, removeAttribute() {} })),
    toasts: [],
  };
  let opened = null;
  const window = {
    open: (...a) => { if (popupThrows) throw new Error('refused'); opened = a; return popupResult; },
    location: { search: '', hostname: 'localhost', pathname: '/mobile/', href: '' },
    isSecureContext: false,
  };
  const doc = {
    body: { classList: { toggle() {} }, after(node) { body.byId[node.id] = node; } },
    querySelectorAll: () => body.tabButtons,
    getElementById: id => body.byId[id],
    createElement: tag => {
      const node = { tag, id: '', href: '', target: '', rel: '', className: '', textContent: '', style: {},
        setAttribute(k, v) { this[k] = v; } };
      body.created.push(node);
      return node;
    },
  };
  body.created = []; body.byId = {};
  const sandbox = {
    window, document: doc, location: window.location,
    setTimeout: () => 0, clearTimeout: () => {},
    navigator: { onLine: true }, console,
    toast: msg => body.toasts.push(msg),
    $: id => doc.getElementById(id),
    TABS: ['talk', 'wiki'], HOST_PREVIEW: false,
    S: { tab: 'talk' },
    closeDrawer() {}, renderTabs() {}, renderSurfaces() {},
    renderTabsReal: null,
    playerActive: false, stopMediaPlayer() {}, chatContextEpoch: 0,
    refreshHostPreview() {}, refreshMedia() {},
  };
  sandbox.globalThis = sandbox;
  const src = extractFn(appSrc, 'openWiki') + '\n' + extractFn(appSrc, 'goTab');
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox, { filename: 'app-slice.js' });
  return { sandbox, body, opened: () => opened };
}

test('GOAL-1 defect: goTab("wiki") popup-opened path toasts success and never touches local tab state', () => {
  const h = makeAppHarness({ popupResult: {} });
  h.sandbox.goTab('wiki');
  assert.deepEqual(h.opened(), ['/wiki', '_blank', 'noopener']);
  assert.equal(h.sandbox.S.tab, 'talk', 'S.tab must not be left mid-switch by the wiki branch');
  assert.ok(h.body.toasts.some(t => /Wiki opened in a new browser tab/.test(t)), 'success toast present');
});

test('GOAL-1 defect: popup-blocked path — no top-level nav, no dead-end-only toast (fallback must be actionable)', () => {
  const h = makeAppHarness({ popupResult: null }); // sandboxed preview: window.open returns null
  h.sandbox.goTab('wiki');
  assert.equal(h.sandbox.S.tab, 'talk');
  const blocked = h.body.toasts.filter(t => /Popups blocked here/.test(t));
  assert.equal(blocked.length, 1, 'one blocked toast');
  // Regression contract: the blocked path must offer more than a dead-end toast —
  // a rendered inline /wiki link (visible, focusable) or a real top-level
  // navigation (location.assign/href). Toast-only is the defect.
  const loc = h.sandbox.window.location;
  const navigated = typeof loc.assign === 'function' || (typeof loc.href === 'string' && loc.href !== '');
  const link = h.body.created.find(n => n.tag === 'a' && /\/wiki/.test(n.href || ''));
  const rendered = !!link;
  assert.ok(navigated || rendered,
    'popup-blocked path must render an inline /wiki link or navigate; toast-only is the defect; toast was: ' + JSON.stringify(blocked[0]));
});

test('GOAL-1 defect: goTab returns before renderTabs so S.tab never set for wiki (aria-selected stays false) — wiki tab state contract', () => {
  // renderTabs() is the only writer of aria-selected (app.js:370). goTab('wiki')
  // returns at :425 before S.tab assignment. Assert the wiring: every tab the
  // rail can select must land in renderTabs via S.tab, EXCEPT wiki which is
  // exempt only while openWiki is a true handoff (new tab). If the fixer makes
  // wiki a local surface, it must set S.tab and call renderTabs.
  const h = makeAppHarness({ popupResult: {} });
  h.sandbox.goTab('wiki');
  // after the fix, either the phone stays on Talk with an explicit handoff
  // (tab unchanged, handoff complete) OR wiki becomes selected in-tab.
  const st = h.sandbox.S.tab;
  assert.ok(st === 'talk' || st === 'wiki', 'S.tab valid after goTab("wiki")');
  if (st === 'wiki') assert.ok(h.body.renderedWiki === true, 'wiki selection must render a surface');
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
    rev: els.rev, log: els.log, POLL_MS: 1500, STATE_URL: '/api/state', MUTATE_URL: '/api/mutate',
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  const prelude = 'var fetchJson, refresh;\n(async () => {\n';
  const epilogue = '\nfetchJson = fetchJson; refresh = refresh; globalThis.refresh = refresh;\n})();';
  vm.runInContext(prelude + extractFn(chatSrc, 'fetchJson') + '\n' + extractFn(chatSrc, 'refresh') + epilogue, sandbox, { filename: 'chat-slice.js' });
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