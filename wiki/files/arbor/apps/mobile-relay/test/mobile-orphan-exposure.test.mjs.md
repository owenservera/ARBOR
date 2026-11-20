# File: apps/mobile-relay/test/mobile-orphan-exposure.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/mobile-orphan-exposure.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4380 B |
| Lines | 90 |
| Hash | 45fed1e9aabf |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| FakeNode | class | 6 | no | class FakeNode { |
| constructor | method | 7 | yes | constructor(tag, doc) { |
| append | method | 14 | yes | append(...children) { this.children.push(...children); } |
| replaceChildren | method | 15 | yes | replaceChildren(...children) { this.children = children; } |
| addEventListener | method | 16 | yes | addEventListener(name, callback) { this.events[name] = callback; } |
| setAttribute | method | 17 | yes | setAttribute(name, value) { this.attrs.set(name, String(value)); } |
| getAttribute | method | 18 | yes | getAttribute(name) { return this.attrs.has(name) ? this.attrs.get(name) : null; } |
| removeAttribute | method | 19 | yes | removeAttribute(name) { this.attrs.delete(name); } |
| hasAttribute | method | 20 | yes | hasAttribute(name) { return this.attrs.has(name); } |
| fakeHost | function | 22 | no | function fakeHost() { |
| doc | const | 23 | no | const doc = { createElement(tag) { return new FakeNode(tag, doc); } }; |
| nodes | function | 26 | no | function nodes(node, found = []) { |
| shown | function | 31 | no | const shown = node =&gt; nodes(node).map(item =&gt; item.textContent).join(&#39; &#39;); |
| button | function | 32 | no | const button = (host, title) =&gt; nodes(host).find(n =&gt; n.tag === &#39;button&#39; &amp;&amp; n.textContent === title); |
| host | const | 35 | no | const host = fakeHost(); |
| yes | const | 36 | no | const yes = todayModel(null, [], { nativePocket: true }); |
| calls | variable | 37 | no | let calls = 0; |
| host | const | 48 | no | const host = fakeHost(); |
| snapshot | const | 49 | no | const snapshot = { snapshot: { |
| model | const | 53 | no | const model = todayModel(snapshot, [], {}); |
| visited | const | 54 | no | const visited = []; |
| host | const | 62 | no | const host = fakeHost(); |
| media | const | 63 | no | const media = { state: &#39;ready&#39;, total: 2, shown: 2, hasMore: false, favorites: 1, |
| refreshed | variable | 66 | no | let refreshed = 0; |
| host | const | 82 | no | const host = fakeHost(); |
| nav | const | 83 | no | const nav = []; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../ux/model.mjs | import | 3 | [apps/mobile-relay/ux/model.mjs](../ux/model.mjs.md) |
| ../ux/render.mjs | import | 4 | [apps/mobile-relay/ux/render.mjs](../ux/render.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { todayModel, meModel, worldModel } from '../ux/model.mjs';
import { renderToday, renderWorld, renderMe } from '../ux/render.mjs';

class FakeNode {
  constructor(tag, doc) {
    this.tag = tag; this.ownerDocument = doc; this.children = [];
    this.className = ''; this.textContent = ''; this.events = {}; this.type = '';
    // The renderer sets attributes (aria-label, hidden, …) directly on elements.
    // A fake DOM that omits them fails on the renderer, not on product code.
    this.attrs = new Map();
  }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  addEventListener(name, callback) { this.events[name] = callback; }
  setAttribute(name, value) { this.attrs.set(name, String(value)); }
  getAttribute(name) { return this.attrs.has(name) ? this.attrs.get(name) : null; }
  removeAttribute(name) { this.attrs.delete(name); }
  hasAttribute(name) { return this.attrs.has(name); }
}
function fakeHost() {
  const doc = { createElement(tag) { return new FakeNode(tag, doc); } };
  return new FakeNode('section', doc);
}
function nodes(node, found = []) {
  found.push(node);
  for (const child of node.children || []) nodes(child, found);
  return found;
}
const shown = node => nodes(node).map(item => item.textContent).join(' ');
const button = (host, title) => nodes(host).find(n => n.tag === 'button' && n.textContent === title);

test('Today exposes the existing signed native Pocket only when the APK reported it', () => {
  const host = fakeHost();
  const yes = todayModel(null, [], { nativePocket: true });
  let calls = 0;
  renderToday(host, yes, { onNavigate: () => {}, onOpenPocket: () => { calls++; } });
  assert.match(shown(host), /Capture offline/);
  button(host, 'Open Pocket').events.click();
  assert.equal(calls, 1);
  renderToday(host, todayModel(null, [], { nativePocket: false }), { onOpenPocket: () => { calls++; } });
  assert.equal(button(host, 'Open Pocket'), undefined);
  assert.equal(calls, 1);
});

test('Today attention becomes navigable but does not send or approve an effect', () => {
  const host = fakeHost();
  const snapshot = { snapshot: {
    live: { conversations: [{id:'c1', provider:'chatgpt',
      messages:[{id:'m1',state:'uncertain',requiresReview:true}]}] }
  } };
  const model = todayModel(snapshot, [], {});
  const visited = [];
  renderToday(host, model, { onNavigate: tab => visited.push(tab) });
  assert.match(shown(host), /A send is uncertain/);
  button(host, 'Open Talk').events.click();
  assert.deepEqual(visited, ['talk']);
});

test('World renders only bounded Host-returned media titles as plain text and never claims playback', () => {
  const host = fakeHost();
  const media = { state: 'ready', total: 2, shown: 2, hasMore: false, favorites: 1,
    items: [{title:'A Film',kind:'movie',state:'complete',favorite:true},
      {title:'B Show',kind:'show',state:'seeded',favorite:false}] };
  let refreshed = 0;
  renderWorld(host, worldModel(null, [], {media}), { onRefreshMedia: () => { refreshed++; } });
  assert.match(shown(host), /My Media Library/);
  assert.match(shown(host), /A Film/);
  assert.match(shown(host), /B Show/);
  // The renderer's canonical wording (also asserted by ux-surfaces.test.mjs):
  // a complete file with no verified playable mapping is never presented as playable.
  assert.match(shown(host), /No verified playable file mapped/);
  button(host, 'Refresh library').events.click();
  assert.equal(refreshed, 1);
  renderWorld(host, worldModel(null, [], {media:{state:'direct-only'}}), {});
  assert.match(shown(host), /Connect directly/);
  assert.doesNotMatch(shown(host), /A Film/);
});
```

_First 80 of 91 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
