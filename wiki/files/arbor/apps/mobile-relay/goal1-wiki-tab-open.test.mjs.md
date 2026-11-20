# File: apps/mobile-relay/goal1-wiki-tab-open.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | apps/mobile-relay/goal1-wiki-tab-open.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2791 B |
| Lines | 57 |
| Hash | 4316e4ce1b39 |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| app | const | 6 | no | const app = readFileSync(new URL(&#39;./app.js&#39;, import.meta.url), &#39;utf8&#39;); |
| html | const | 7 | no | const html = readFileSync(new URL(&#39;./index.html&#39;, import.meta.url), &#39;utf8&#39;); |
| render | const | 8 | no | const render = readFileSync(new URL(&#39;./ux/render.mjs&#39;, import.meta.url), &#39;utf8&#39;); |
| model | const | 9 | no | const model = readFileSync(new URL(&#39;./ux/model.mjs&#39;, import.meta.url), &#39;utf8&#39;); |
| functionSource | function | 11 | no | function functionSource(src, name) { |
| start | const | 12 | no | const start = src.indexOf(&#39;function &#39; + name + &#39;(&#39;); assert.notEqual(start, -1); const body = src.indexOf(&#39;{&#39;, start); let depth = 0; for (let i = body; i &lt; src.length; i++) { |
| body | const | 14 | no | const body = src.indexOf(&#39;{&#39;, start); |
| depth | variable | 15 | no | let depth = 0; |
| events | const | 30 | no | const events = []; |
| sandbox | const | 31 | no | const sandbox = { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:vm | import | 4 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const app = readFileSync(new URL('./app.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const render = readFileSync(new URL('./ux/render.mjs', import.meta.url), 'utf8');
const model = readFileSync(new URL('./ux/model.mjs', import.meta.url), 'utf8');

function functionSource(src, name) {
  const start = src.indexOf('function ' + name + '(');
  assert.notEqual(start, -1);
  const body = src.indexOf('{', start);
  let depth = 0;
  for (let i = body; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}' && --depth === 0) return src.slice(start, i + 1);
  }
  throw new Error('Unclosed function ' + name);
}

test('Wiki has an actual accessible tab panel', () => {
  assert.match(html, /id="tab-wiki"[^>]*role="tab"[^>]*aria-controls="v-wiki"/);
  assert.match(html, /id="v-wiki"[^>]*role="tabpanel"/);
  assert.match(model, /TABS[^\n]*'wiki'/);
});

test('Wiki navigation stays inside the PWA and refreshes actual Host state', () => {
  const events = [];
  const sandbox = {
    S: { tab: 'talk' }, TABS: ['talk', 'wiki'], HOST_PREVIEW: false,
    dockExpanded: false, chatContextEpoch: 0, chatContext: null,
    // app.js module-scope names goTab touches (app.js:136 let dockAssist, :1676 let compose,
    // plus the guarded clearWikiSources/build/$ /schedule/refreshHostPreview branches at :467-484)
    dockAssist: { reset() {} }, compose: { resetAssist() {} },
    clearWikiSources() {}, build: null, $: () => null, schedule() {}, refreshHostPreview() {},
    closeDrawer() {}, renderTabs() { events.push('tabs'); },
    renderSurfaces() { events.push('surface'); }, refreshWiki() { events.push('read'); },
    refreshMedia() {}, playerActive: false, stopMediaPlayer() {},
    document: { getElementById: () => ({ scrollIntoView() {} }) }
  };
  vm.createContext(sandbox);
  vm.runInContext(functionSource(app, 'goTab'), sandbox);
  sandbox.goTab('wiki');
  assert.equal(sandbox.S.tab, 'wiki');
  assert.deepEqual(events, ['tabs', 'surface', 'read']);
});

test('Wiki projection is read-only, scoped, and renders text safely', () => {
  // app.js:788 and app.js:1783 fetch the Host control wiki route under HOST_PREVIEW
  assert.match(app, /fetch\(HOST_PREVIEW\s*\?\s*'\/api\/host\/control\/wiki-view'\s*:\s*'\/mobile\/api\/wiki'/);
  assert.match(app, /control:read/);
  assert.match(functionSource(app, 'renderWiki'), /replaceChildren/);
  assert.doesNotMatch(functionSource(app, 'renderWiki'), /innerHTML|insertAdjacentHTML/);
  assert.doesNotMatch(render, /location\.assign\('\/wiki'\)/);
});
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
