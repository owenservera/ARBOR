# File: apps/mobile-relay/goal1-wiki-chat-regression.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | apps/mobile-relay/goal1-wiki-chat-regression.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6168 B |
| Lines | 113 |
| Hash | cb111fc333db |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| here | const | 7 | no | const here = new URL(&#39;.&#39;, import.meta.url).pathname.replace(/^\\/([A-Za-z]:)/, &#39;$1&#39;); |
| appSrc | const | 8 | no | const appSrc = readFileSync(here + &#39;app.js&#39;, &#39;utf8&#39;); |
| chatSrc | const | 9 | no | const chatSrc = readFileSync(here + &#39;../vivim-host/public/pages/chat.js&#39;, &#39;utf8&#39;); |
| extractFn | function | 11 | no | function extractFn(src, name) { |
| start | variable | 13 | no | let start = src.indexOf(&#39;function &#39; + name + &#39;(&#39;); assert.notEqual(start, -1, name + &#39;() not found&#39;); if (src.slice(Math.max(0, start - 6), start) === &#39;async &#39;) start -= 6; // the body brace is the f… |
| i | variable | 18 | no | let i = src.indexOf(&#39;(&#39;, start), parens = 0; for (; i &lt; src.length; i++) { if (src[i] === &#39;(&#39;) parens++; else if (src[i] === &#39;)&#39;) parens--; else if (src[i] === &#39;{&#39; &amp;&amp; parens === 0) break; |
| depth | variable | 24 | no | let depth = 0; |
| calls | const | 33 | no | const calls = []; |
| tab | const | 34 | no | const tab = { scrollIntoView() { calls.push(&#39;scroll&#39;); } }; |
| sandbox | const | 35 | no | const sandbox = { |
| makeChatHarness | function | 56 | no | function makeChatHarness({ fail = false } = {}) { |
| els | const | 57 | no | const els = { log: { children: [], scrollTop: 0, scrollHeight: 0, get firstChild() { return this.children[0]; }, replaceChildren(...c) { this.children = c; return c[0]; }, appendChild(c) { this.child… |
| doc | const | 59 | no | const doc = { |
| sandbox | const | 63 | no | const sandbox = { |
| prelude | const | 77 | no | const prelude = &#39;var json, refresh;\\n(async () =&gt; {\\n&#39;; const epilogue = &#39;\\njson = json; refresh = refresh; globalThis.refresh = refresh;\\n})();&#39;; |
| epilogue | const | 78 | no | const epilogue = &#39;\\njson = json; refresh = refresh; globalThis.refresh = refresh;\\n})();&#39;; |
| h | const | 84 | no | const h = makeChatHarness({ fail: true }); |
| h | const | 94 | no | const h = makeChatHarness({ fail: true }); |
| text | const | 96 | no | const text = h.els.rev.textContent; |
| revEl | const | 100 | no | const revEl = h.els.rev; |
| hasRetry | const | 101 | no | const hasRetry = /retry/i.test(text) \|\| typeof revEl.onclick === &#39;function&#39;; |
| hasStamp | const | 102 | no | const hasStamp = /\\d{1,2}:\\d{2}/.test(text); |
| h | const | 110 | no | const h = makeChatHarness({ fail: false }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 2 | external |
| node:assert/strict | import | 3 | external |
| node:fs | import | 4 | external |
| node:vm | import | 5 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 113 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
