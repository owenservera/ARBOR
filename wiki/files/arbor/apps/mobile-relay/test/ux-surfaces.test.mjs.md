# File: apps/mobile-relay/test/ux-surfaces.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/ux-surfaces.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 27559 B |
| Lines | 509 |
| Hash | 78a9f32c5e24 |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| html | const | 7 | no | const html = readFileSync(new URL(&#39;../index.html&#39;, import.meta.url), &#39;utf8&#39;); |
| app | const | 8 | no | const app = readFileSync(new URL(&#39;../app.js&#39;, import.meta.url), &#39;utf8&#39;); |
| modelSrc | const | 9 | no | const modelSrc = readFileSync(new URL(&#39;../ux/model.mjs&#39;, import.meta.url), &#39;utf8&#39;); |
| renderSrc | const | 10 | no | const renderSrc = readFileSync(new URL(&#39;../ux/render.mjs&#39;, import.meta.url), &#39;utf8&#39;); |
| FakeNode | class | 13 | no | class FakeNode { |
| constructor | method | 14 | yes | constructor(tag, ownerDocument) { |
| appendChild | method | 19 | yes | appendChild(x) { this.children.push(x); return x; } |
| append | method | 20 | yes | append(...xs) { for (const x of xs) this.children.push(x); } |
| replaceChildren | method | 21 | yes | replaceChildren(...xs) { this.children = xs; } |
| setAttribute | method | 22 | yes | setAttribute(k, v) { this.attrs[k] = v; } |
| addEventListener | method | 23 | yes | addEventListener(k, fn) { this.events[k] = fn; } |
| fakeHost | function | 25 | no | function fakeHost() { |
| doc | const | 26 | no | const doc = { createElement(tag) { return new FakeNode(tag, doc); } }; |
| host | const | 27 | no | const host = new FakeNode(&#39;section&#39;, doc); |
| findAll | function | 31 | no | function findAll(node, predicate, out = []) { |
| byClass | function | 37 | no | function byClass(node, cls) { |
| textOf | function | 40 | no | function textOf(node) { |
| out | variable | 42 | no | let out = node.textContent ? String(node.textContent) : &#39;&#39;; |
| committed | function | 48 | no | const committed = (children) =&gt; ({ schema: &#39;vivim.ui-surface/1&#39;, surfaceId: &#39;my-space&#39;, revision: 3, catalogVersion: 1, theme: { background: &#39;#111722&#39;, secondary: &#39;#243146&#39;, accent: &#39;#78b8f6&#39;, appear… |
| cardNode | function | 55 | no | const cardNode = (id, title, description) =&gt; ({ id, type: &#39;card&#39;, props: { title, description }, children: [] }); |
| uiRevision | function | 56 | no | const uiRevision = (children) =&gt; { |
| base | const | 57 | no | const base = committed(children); |
| statusOf | function | 60 | no | const statusOf = snapshot =&gt; ({ at: &#39;2026-11-05T10:00:00.000Z&#39;, snapshot }); |
| tabsIn | function | 63 | no | const tabsIn = () =&gt; [...html.matchAll(/&lt;button[^&gt;]*\\bdata-tab=&quot;([^&quot;]+)&quot;/g)].map(m =&gt; m[1]); |
| stubHiddenTabs | function | 64 | no | const stubHiddenTabs = () =&gt; { |
| rule | const | 65 | no | const rule = app.match(/\\$\\(&#39;v-soon&#39;\\)\\.hidden\\s*=\\s*\\[([^\\]]*)\\]\\.includes\\(S\\.tab\\)/); |
| status | const | 100 | no | const status = statusOf({ bootstrap: { schema: &#39;vivim.bootstrap-phone/1&#39;, worldId: &#39;world-1&#39;, observedAt: &#39;2026-11-05T10:00:00.000Z&#39;, uiRevision: uiRevision([cardNode(&#39;research&#39;, &#39;Research&#39;, &#39;Questio… |
| model | const | 104 | no | const model = worldModel(status, []); |
| model | const | 114 | no | const model = worldModel(null, []); |
| model | const | 128 | no | const model = worldModel(statusOf({ bootstrap: { schema: &#39;vivim.bootstrap-phone/1&#39;, worldId: &#39;w&#39;, observedAt: &#39;2026-11-05T10:00:00.000Z&#39; } }), []); |
| status | const | 135 | no | const status = statusOf({ live: { schema: &#39;vivim.world-conversation-timeline/1&#39;, state: &#39;source-backed&#39;, worldId: &#39;w&#39;, revision: 4, conversations: [{ id: &#39;c-1&#39;, provider: &#39;chatgpt&#39;, model: null, revi… |
| model | const | 140 | no | const model = worldModel(status, []); |
| status | const | 148 | no | const status = statusOf({ personalAgent: { initialized: true, agentId: &#39;personal-agent&#39;, scope: &#39;local-data-directory&#39;, identityAssurance: &#39;local-instance-only; no remote account claim&#39; }, bootstrap:… |
| commands | const | 154 | no | const commands = [{ id: &#39;cmd-1&#39;, kind: &#39;command&#39;, consumer: &#39;harness&#39;, mode: &#39;relay-chat&#39;, status: &#39;done&#39;, |
| model | const | 156 | no | const model = meModel(status, commands, { paired: true, mode: &#39;direct&#39;, deviceStatus: &#39;active&#39;, scopes: [&#39;relay:read&#39;, &#39;relay:write&#39;] }); |
| model | const | 168 | no | const model = meModel(null, [], { paired: false, mode: &#39;cloud&#39; }); |
| model | const | 179 | no | const model = todayModel(null, [], { connection: &#39;Connecting…&#39;, connectionTone: &#39;ok&#39; }); |
| status | const | 188 | no | const status = statusOf({ live: { schema: &#39;vivim.world-conversation-timeline/1&#39;, state: &#39;source-backed&#39;, worldId: &#39;w&#39;, revision: 2, conversations: [{ id: &#39;c-1&#39;, provider: &#39;chatgpt&#39;, model: null, revi… |
| model | const | 193 | no | const model = todayModel(status, [], { connection: &#39;Connected to PC&#39; }); |
| commands | const | 201 | no | const commands = [{ id: &#39;cmd-9&#39;, kind: &#39;command&#39;, consumer: &#39;harness&#39;, mode: &#39;relay-chat&#39;, status: &#39;failed&#39;, |
| model | const | 203 | no | const model = todayModel(statusOf({}), commands, { connection: &#39;Connected to PC&#39; }); |
| failed | const | 204 | no | const failed = model.attention.find(a =&gt; a.kind === &#39;failed&#39;); |
| bad | const | 211 | no | const bad = todayModel(null, [], { connection: &#39;Relay error: connection refused&#39;, connectionTone: &#39;bad&#39; }); |
| pending | const | 214 | no | const pending = todayModel(null, [], { connection: &#39;Connected to PC&#39;, pendingSend: true }); |
| full | const | 220 | no | const full = fakeHost(); |
| fullText | const | 225 | no | const fullText = textOf(full); |
| empty | const | 230 | no | const empty = fakeHost(); |
| emptyText | const | 232 | no | const emptyText = textOf(empty); |
| host | const | 239 | no | const host = fakeHost(); |
| text | const | 241 | no | const text = textOf(host); |
| world | const | 251 | no | const world = fakeHost(); |
| me | const | 253 | no | const me = fakeHost(); |
| today | const | 255 | no | const today = fakeHost(); |
| foot | const | 259 | no | const foot = byClass(host, &#39;ux-foot&#39;); |
| primary | const | 261 | no | const primary = byClass(foot[0], &#39;ux-primary&#39;); |
| buttons | const | 264 | no | const buttons = findAll(host, n =&gt; n.tag === &#39;button&#39;); |
| routes | const | 269 | no | const routes = []; |
| external | const | 270 | no | const external = []; |
| prevLocation | const | 273 | no | const prevLocation = globalThis.location; |
| shortcuts | const | 275 | no | const shortcuts = fakeHost(); |
| tiles | const | 278 | no | const tiles = byClass(shortcuts, &#39;ux-surface-tile&#39;); |
| went | variable | 290 | no | let went = null; |
| host | const | 291 | no | const host = fakeHost(); |
| host | const | 303 | no | const host = fakeHost(); |
| model | const | 312 | no | const model = worldModel({ snapshot: { bootstrap: { uiRevision: { tree: { id: &#39;root&#39;, type: &#39;stack&#39;, props: {}, children: &#39;nope&#39; } } } } }, []); |
| played | const | 329 | no | const played = []; |
| catalog | const | 330 | no | const catalog = { state:&#39;ready&#39;, total:2, favorites:0, playback:&#39;available&#39;, items:[ |
| host | const | 334 | no | const host = fakeHost(); |
| play | const | 336 | no | const play = findAll(host,n=&gt;n.tag===&#39;button&#39;&amp;&amp;n.textContent===&#39;Play&#39;); |
| cloud | const | 341 | no | const cloud = fakeHost(); |
| control | const | 439 | no | const control = readFileSync(new URL(&#39;../control-phone.mjs&#39;, import.meta.url),&#39;utf8&#39;); |
| chat | const | 440 | no | const chat = readFileSync(new URL(&#39;../control-chat.mjs&#39;, import.meta.url),&#39;utf8&#39;); |
| chat | const | 455 | no | const chat = readFileSync(new URL(&#39;../control-chat.mjs&#39;, import.meta.url),&#39;utf8&#39;); |
| nav | const | 465 | no | const nav=[]; |
| host | const | 466 | no | const host=fakeHost(); |
| catalog | const | 467 | no | const catalog={state:&#39;ready&#39;,total:60,shown:25,pageSize:25,offset:25,hasMore:true, |
| pager | const | 474 | no | const pager=byClass(host,&#39;ux-media-pager&#39;); |
| buttons | const | 476 | no | const buttons=findAll(pager[0],n=&gt;n.tag===&#39;button&#39;); |
| requested | variable | 494 | no | let requested=0; |
| offered | const | 495 | no | const offered=fakeHost(); |
| actions | const | 497 | no | const actions=findAll(offered,n=&gt;n.tag===&#39;button&#39;&amp;&amp;n.textContent===&#39;Install on this device&#39;); |
| absent | const | 501 | no | const absent=fakeHost(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| ../ux/model.mjs | import | 4 | [apps/mobile-relay/ux/model.mjs](../ux/model.mjs.md) |
| ../ux/render.mjs | import | 5 | [apps/mobile-relay/ux/render.mjs](../ux/render.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { worldModel, meModel, todayModel } from '../ux/model.mjs';
import { renderToday, renderWorld, renderMe } from '../ux/render.mjs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const modelSrc = readFileSync(new URL('../ux/model.mjs', import.meta.url), 'utf8');
const renderSrc = readFileSync(new URL('../ux/render.mjs', import.meta.url), 'utf8');

/* ---------- a small DOM the renderer can be driven with ---------- */
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
function findAll(node, predicate, out = []) {
  if (!node) return out;
  if (predicate(node)) out.push(node);
  for (const child of node.children || []) findAll(child, predicate, out);
  return out;
}
function byClass(node, cls) {
  return findAll(node, n => String(n.className || '').split(/\s+/).includes(cls));
}
function textOf(node) {
  if (!node) return '';
  let out = node.textContent ? String(node.textContent) : '';
  for (const child of node.children || []) out += ' ' + textOf(child);
  return out;
}

/* ---------- Host payload fixtures (shapes the Host really sends) ---------- */
const committed = (children) => ({
  schema: 'vivim.ui-surface/1', surfaceId: 'my-space', revision: 3, catalogVersion: 1,
  theme: { background: '#111722', secondary: '#243146', accent: '#78b8f6', appearance: 'dark', texture: 'solid',
    mood: 'focused', density: 'comfortable', motion: 'still', fontFamily: 'system', fontSizePx: 15,
    headingSizePx: 28, radiusPx: 14, spacingScale: 1 },
  tree: { id: 'root', type: 'stack', props: { direction: 'vertical', gap: 'md' }, children }
});
const cardNode = (id, title, description) => ({ id, type: 'card', props: { title, description }, children: [] });
const uiRevision = (children) => {
  const base = committed(children);
  return { ...base, surface: base, surfaceId: 'my-space', revision: 3, status: 'applied', changeId: 'chg-1', parentRevision: 2 };
};
const statusOf = snapshot => ({ at: '2026-11-05T10:00:00.000Z', snapshot });
// Only the button markup defines the tab strip; the stylesheet also contains
// .tab[data-tab=...] pseudo-element rules that must not count as tabs.
const tabsIn = () => [...html.matchAll(/<button[^>]*\bdata-tab="([^"]+)"/g)].map(m => m[1]);
const stubHiddenTabs = () => {
  const rule = app.match(/\$\('v-soon'\)\.hidden\s*=\s*\[([^\]]*)\]\.includes\(S\.tab\)/);
  assert.ok(rule, 'the retired stub panel must stay explicitly hidden');
  return [...rule[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
};

/* ---------- the tab strip ---------- */
test('the tab strip exposes Today, Talk, Build, World, Wiki, Me and Control — and no Agents or Self', () => {
  // Wiki is in the rail but has no local panel: the tab navigates to /wiki (app.js:419-421).
  assert.deepEqual(tabsIn(), ['today', 'talk', 'build', 'world', 'wiki', 'me', 'control']);
  assert.ok(!html.includes('data-tab="agents"'), 'the Agents stub tab must be gone');
  assert.ok(!html.includes('data-tab="self"'), 'the Self stub tab must be gone');
  for (const id of ['v-today', 'v-world', 'v-me']) {
    assert.match(html, new RegExp('id="' + id + '"'), id + ' must have its own panel');
    assert.match(app, new RegExp("\\$\\('" + id + "'\\)\\.hidden\\s*=\\s*S\\.tab\\s*!==\\s*'" + id.replace('v-', '') + "'"));
  }
});
```

_First 80 of 510 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
