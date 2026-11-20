# File: apps/mobile-relay/test/goal2-arbor-progress.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/goal2-arbor-progress.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3732 B |
| Lines | 78 |
| Hash | 3a7a5b4a6845 |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| app | const | 6 | no | const app = readFileSync(new URL(&#39;../app.js&#39;, import.meta.url), &#39;utf8&#39;); |
| renderSrc | const | 7 | no | const renderSrc = readFileSync(new URL(&#39;../ux/render.mjs&#39;, import.meta.url), &#39;utf8&#39;); |
| welcome | const | 8 | no | const welcome = readFileSync(new URL(&#39;../welcome.mjs&#39;, import.meta.url), &#39;utf8&#39;); |
| FakeNode | class | 11 | no | class FakeNode { |
| constructor | method | 12 | yes | constructor(tag, ownerDocument) { |
| appendChild | method | 17 | yes | appendChild(x) { this.children.push(x); return x; } |
| append | method | 18 | yes | append(...xs) { for (const x of xs) this.children.push(x); } |
| replaceChildren | method | 19 | yes | replaceChildren(...xs) { this.children = xs; } |
| setAttribute | method | 20 | yes | setAttribute(k, v) { this.attrs[k] = v; } |
| addEventListener | method | 21 | yes | addEventListener(k, fn) { this.events[k] = fn; } |
| fakeHost | function | 23 | no | function fakeHost() { |
| doc | const | 24 | no | const doc = { createElement(tag) { return new FakeNode(tag, doc); } }; |
| host | const | 25 | no | const host = new FakeNode(&#39;section&#39;, doc); |
| textOf | function | 29 | no | function textOf(node) { |
| out | variable | 31 | no | let out = node.textContent ? String(node.textContent) : &#39;&#39;; |
| menu | const | 39 | no | const menu = app.match(/for \\(const \\[label, href\\] of \\[([\\s\\S]*?)\\]\\) \\{/); |
| hrefs | const | 41 | no | const hrefs = [...menu[1].matchAll(/&#39;([^&#39;]+)&#39;/g)].map(m =&gt; m[1]).filter(h =&gt; h.startsWith(&#39;/&#39;)); |
| host | const | 55 | no | const host = fakeHost(); |
| text | const | 57 | no | const text = textOf(host); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| ../ux/render.mjs | import | 4 | [apps/mobile-relay/ux/render.mjs](../ux/render.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderWorld } from '../ux/render.mjs';

const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const renderSrc = readFileSync(new URL('../ux/render.mjs', import.meta.url), 'utf8');
const welcome = readFileSync(new URL('../welcome.mjs', import.meta.url), 'utf8');

/* ---------- small fake DOM, same shape as ux-surfaces.test.mjs ---------- */
class FakeNode {
  constructor(tag, ownerDocument) {
    this.tag = tag; this.ownerDocument = ownerDocument; this.style = {};
    this.children = []; this.attrs = {}; this.events = {}; this.className = ''; this.textContent = '';
    this.hidden = false; this.type = '';
  }
  appendChild(x) { this.children.push(x); return x; }
  append(...xs) { for (const x of xs) this.children.push(x); }
  replaceChildren(...xs) { this.children = xs; }
  setAttribute(k, v) { this.attrs[k] = v; }
  addEventListener(k, fn) { this.events[k] = fn; }
}
function fakeHost() {
  const doc = { createElement(tag) { return new FakeNode(tag, doc); } };
  const host = new FakeNode('section', doc);
  host.ownerDocument = doc;
  return host;
}
function textOf(node) {
  if (!node) return '';
  let out = node.textContent ? String(node.textContent) : '';
  for (const child of node.children || []) out += ' ' + textOf(child);
  return out;
}

/* ---------- GOAL-2 acceptance: live ARBOR progress + blockers reachable from the PWA ---------- */

test('host menu links the /wiki surface that renders owner Wiki, with unique hrefs', () => {
  const menu = app.match(/for \(const \[label, href\] of \[([\s\S]*?)\]\) \{/);
  assert.ok(menu, 'installHostMenu must keep its label/href table');
  const hrefs = [...menu[1].matchAll(/'([^']+)'/g)].map(m => m[1]).filter(h => h.startsWith('/'));
  for (const href of ['/onboarding', '/host/control', '/api/host/status']) {
    assert.ok(hrefs.includes(href), `existing host menu link ${href} must stay`);
  }
  assert.ok(hrefs.includes('/wiki'), 'host menu must link /wiki (owner Wiki surface)');
  assert.equal(new Set(hrefs).size, hrefs.length, 'host menu must not carry duplicate hrefs');
});

test('production PWA has no historical roadmap dependency', () => {
  assert.doesNotMatch(app, /\/api\/roadmap|refreshRoadmap/);
  assert.doesNotMatch(renderSrc, /\/api\/roadmap|roadmapCard/);
});

test('World keeps committed revision and live empty state', () => {
  const host = fakeHost();
  renderWorld(host, { revision: { revision: 7, surfaceId: 'world', status: 'applied' } });
  const text = textOf(host);
  assert.match(text, /Host revision 7/);
  assert.match(text, /Nothing here yet/);
  assert.doesNotMatch(text, /ARBOR progress|Loading the live roadmap/);
});

/* ---------- confirmed defect: readGraphContext silent no-op in host preview (app.js:226-227) ---------- */

test('gated readGraphContext gives visible feedback instead of a bare silent return', () => {
  assert.doesNotMatch(
    app,
    /if\(HOST_PREVIEW\|\|!transport\.direct\|\|!S\.paired\|\|!device\)\s*\{\s*chatContext=null;\s*renderFocusPanel\(\);\s*return;\s*\}/,
    'gated branch must not be chatContext=null;renderFocusPanel();return;'
  );
});

/* ---------- confirmed defect: welcome tour sheet churn on bootstrap-status (welcome.mjs:69) ---------- */

test('bootstrap-status does not re-render the open tour sheet; Next still advances', () => {
  assert.doesNotMatch(welcome, /if \(!host\.hidden\) renderTour\(\);/, 'listener must not re-render the visible tour');
  assert.match(welcome, /index\+\+;\s*renderTour\(\);/, 'Next handler must keep advancing the tour');
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
