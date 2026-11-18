// GOAL-1 regression — "Open the Wiki from Chat" rail tab (apps/mobile-relay/app.js:425, :448-474).
// Confirmed defect: wiki tab = popup-only handoff. Popup blocked in a sandboxed embed
// (no allow-popups) => silent dead click: no toast, no fallback link.
// Harness: node:vm slices of app.js only — no browser, no Host boot.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const here = new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const appSrc = readFileSync(here + 'app.js', 'utf8');
const htmlSrc = readFileSync(here + 'index.html', 'utf8');

function extractFn(src, name) {
  src = src.replace(/\r\n/g, '\n');
  const start = src.indexOf('function ' + name + '(');
  assert.notEqual(start, -1, name + '() not found');
  let i = src.indexOf('{', start), depth = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') { depth--; if (depth === 0) return src.slice(start, j + 1); }
  }
  throw new Error('unbalanced braces in ' + name);
}

// ---- app.js harness: openWiki + goTab against a mock DOM ----
// popupResult: whatever window.open returns; popupThrows: window.open throws.
function makeAppHarness({ popupResult = null, popupThrows = false } = {}) {
  const toasts = [];
  const afterNodes = [];
  const created = [];
  const tabButtons = ['talk', 'wiki'].map(t => ({
    dataset: { tab: t }, attrs: {},
    setAttribute(k, v) { this.attrs[k] = v; }, removeAttribute() {},
  }));
  const toastEl = { after(node) { afterNodes.push(node); } };
  const byId = { toast: toastEl };
  const doc = {
    getElementById: id => (id in byId ? byId[id] : null),
    querySelectorAll: () => tabButtons,
    createElement: tag => {
      // style/className/textContent are part of the anchor contract:
      // openWiki sets link.style.cssText (app.js:475) to keep the fallback
      // visible in the fixed 100dvh flex shell — a node without `style`
      // makes openWiki throw TypeError, which was the harness defect.
      const n = { tag, hidden: false, after() {}, style: {}, className: '', textContent: '' };
      let id = '';
      Object.defineProperty(n, 'id', {
        get: () => id,
        set: v => { id = v; byId[v] = n; },
      });
      created.push(n);
      return n;
    },
    body: { classList: { toggle() {} } },
  };
  let opened = null;
  const window = {
    open: (...a) => {
      if (popupThrows) throw new Error('refused');
      opened = a; return popupResult;
    },
    location: { search: '', hostname: 'localhost', pathname: '/mobile/', href: '' },
  };
  const sandbox = {
    window, document: doc, location: window.location,
    $: id => (id in byId ? byId[id] : null),
    toast: msg => { toasts.push(msg); },
    TABS: ['talk', 'wiki'], HOST_PREVIEW: false,
    S: { tab: 'talk' },
    closeDrawer() {}, renderTabs() {}, renderSurfaces() {},
    playerActive: false, stopMediaPlayer() {}, chatContextEpoch: 0,
    refreshHostPreview() {}, refreshMedia() {},
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  const src = extractFn(appSrc, 'openWiki') + '\n' + extractFn(appSrc, 'goTab');
  vm.runInContext(src, sandbox, { filename: 'app-slice.js' });
  return { sandbox, toasts, created, afterNodes, opened: () => opened };
}

const BLOCKED_TOAST = /Popups blocked here/i;
const OK_TOAST = /Wiki opened in a new browser tab/i;

test('GOAL-1: goTab("wiki") opens /wiki in a new tab and reports success', () => {
  const h = makeAppHarness({ popupResult: {} });
  h.sandbox.goTab('wiki');
  assert.deepEqual(h.opened(), ['/wiki', '_blank', 'noopener']);
  assert.equal(h.toasts.filter(t => OK_TOAST.test(t)).length, 1, 'success toast');
  assert.equal(h.toasts.filter(t => BLOCKED_TOAST.test(t)).length, 0, 'no blocked toast');
});

test('GOAL-1: popup-opened handoff never mutates local tab state (aria-selected untouched)', () => {
  const h = makeAppHarness({ popupResult: {} });
  h.sandbox.goTab('wiki');
  assert.equal(h.sandbox.S.tab, 'talk', 'S.tab unchanged: wiki is a handoff, not a surface');
  assert.equal(h.created.length, 0, 'no fallback link on the success path');
});

test('GOAL-1 defect: popup blocked => blocked toast + inline actionable /wiki link', () => {
  const h = makeAppHarness({ popupResult: null }); // sandboxed embed: window.open returns null
  h.sandbox.goTab('wiki');
  assert.equal(h.toasts.filter(t => BLOCKED_TOAST.test(t)).length, 1, 'exactly one blocked toast');
  const link = h.created.find(n => n.id === 'wiki-fallback-link');
  assert.ok(link, 'fallback anchor created: toast-only is the defect');
  assert.equal(link.href, '/wiki');
  assert.equal(link.target, '_top', 'top-level nav survives the embed');
  assert.match(String(link.rel), /noopener/, 'rel noopener');
  assert.match(String(link.textContent), /wiki/i);
  assert.equal(link.hidden, false, 'link visible, not hidden');
  assert.equal(h.afterNodes.length, 1, 'link inserted after the toast');
  assert.equal(h.afterNodes[0], link);
});

test('GOAL-1 defect: popup blocked must not throw out of goTab (no dead click, no unhandled error)', () => {
  const h = makeAppHarness({ popupResult: null, popupThrows: true });
  assert.doesNotThrow(() => h.sandbox.goTab('wiki'));
  assert.equal(h.toasts.filter(t => BLOCKED_TOAST.test(t)).length, 1);
  assert.ok(h.created.some(n => n.id === 'wiki-fallback-link'), 'fallback still rendered when window.open throws');
});

test('GOAL-1: fallback link is reusable — repeated blocked clicks do not duplicate it', () => {
  const h = makeAppHarness({ popupResult: null });
  h.sandbox.goTab('wiki');
  h.sandbox.goTab('wiki');
  assert.equal(h.created.filter(n => n.id === 'wiki-fallback-link').length, 1, 'single anchor, re-shown');
  assert.equal(h.toasts.filter(t => BLOCKED_TOAST.test(t)).length, 2, 'toast on every blocked attempt');
});

test('GOAL-1 acceptance: wiki tab reachable from any local tab without leaving the current surface', () => {
  const h = makeAppHarness({ popupResult: {} });
  h.sandbox.S.tab = 'world';
  h.sandbox.goTab('wiki');
  assert.equal(h.sandbox.S.tab, 'world', 'phone session stays on its current surface');
  assert.deepEqual(h.opened(), ['/wiki', '_blank', 'noopener']);
});

// ---- defect: fallback anchor must be on screen, not a zero-height flex item ----
test('GOAL-1: fallback anchor is styled fixed above the toast (index.html fixed 100dvh shell)', () => {
  const h = makeAppHarness({ popupResult: null });
  h.sandbox.goTab('wiki');
  const link = h.created.find(n => n.id === 'wiki-fallback-link');
  assert.ok(link, 'fallback anchor created');
  assert.match(String(link.style.cssText), /position:fixed/, 'fixed, not collapsed in the flex column');
  assert.match(String(link.style.cssText), /z-index:6\d/, 'above the toast layer');
  assert.ok(String(link.textContent).length > 0, 'labelled');
});

// ---- defect: wiki rail tab advertises a tabpanel it never renders (index.html:389) ----
function wikiTabTag() {
  const m = htmlSrc.match(/<button[^>]*id="tab-wiki"[^>]*>/);
  assert.ok(m, 'tab-wiki button still present in index.html');
  return m[0];
}

test('GOAL-1 defect: wiki rail tab does not point at a panel that does not exist', () => {
  const tag = wikiTabTag();
  const controls = tag.match(/aria-controls="([^"]+)"/);
  if (!controls) return; // no panel advertised: nothing to dangle
  const id = controls[1];
  assert.ok(
    htmlSrc.includes('id="' + id + '"'),
    'aria-controls=' + id + ' but no such panel in index.html — dead-end affordance'
  );
});

test('GOAL-1 defect: a tab that never becomes selected must not claim role=tab', () => {
  const tag = wikiTabTag();
  const isTab = /role="tab"/.test(tag);
  const controls = tag.match(/aria-controls="([^"]+)"/);
  const panelExists = !!controls && htmlSrc.includes('id="' + controls[1] + '"');
  // Either it is a real tab with a real panel, or it is a handoff control
  // (button/link) that never claims a selected tabpanel.
  assert.ok(
    panelExists || !isTab,
    'wiki control is role="tab" with no rendered panel: tab advertises a surface it never renders'
  );
  if (isTab) assert.match(tag, /aria-selected="false"/, 'handoff tab never selected');
});

// ---- defect: first-time surface gated behind a read-only preview label (app.js:798) ----
test('GOAL-1 defect: first-time surface is not labelled "Phone preview only" in the composer', () => {
  assert.ok(
    !appSrc.includes('Phone preview only · open Host menu to pair and connect'),
    'HOST_PREVIEW composer note still gates the first-run surface as preview-only (app.js:798-799)'
  );
});