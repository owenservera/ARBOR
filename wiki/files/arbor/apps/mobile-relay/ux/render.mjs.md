# File: apps/mobile-relay/ux/render.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/ux/render.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 21791 B |
| Lines | 468 |
| Hash | c3067eb373a6 |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| NOT_AVAILABLE_TITLE | const | 6 | no | const NOT_AVAILABLE_TITLE = &#39;Not available yet&#39;; |
| dom | function | 8 | no | function dom(host) { |
| make | function | 12 | no | function make(doc, tag, cls, text) { |
| node | const | 13 | no | const node = doc.createElement(tag); |
| card | function | 18 | no | function card(doc, title) { |
| section | const | 19 | no | const section = make(doc, &#39;section&#39;, &#39;ux-card&#39;); |
| rows | function | 23 | no | function rows(doc, items) { |
| list | const | 24 | no | const list = make(doc, &#39;dl&#39;, &#39;ux-rows&#39;); |
| row | const | 26 | no | const row = make(doc, &#39;div&#39;, &#39;ux-row&#39;); |
| items | function | 32 | no | function items(doc, entries, options = {}) { |
| list | const | 33 | no | const list = make(doc, &#39;ul&#39;, &#39;ux-list&#39;); |
| row | const | 35 | no | const row = make(doc, &#39;li&#39;, &#39;ux-item&#39;); |
| open | const | 40 | no | const open = make(doc, &#39;button&#39;, &#39;btn sm ux-secondary&#39;, entry.action.label \|\| &#39;Open&#39;); |
| jump | const | 46 | no | const jump = make(doc, &#39;button&#39;, &#39;btn sm ux-secondary&#39;, &#39;Jump&#39;); |
| gaps | function | 55 | no | function gaps(doc, lines) { |
| section | const | 56 | no | const section = card(doc, NOT_AVAILABLE_TITLE); |
| foot | function | 60 | no | function foot(doc, action) { |
| wrap | const | 61 | no | const wrap = make(doc, &#39;div&#39;, &#39;ux-foot&#39;); |
| button | const | 62 | no | const button = make(doc, &#39;button&#39;, &#39;btn pri ux-primary&#39;, action.label); |
| shell | function | 69 | no | function shell(doc) { |
| wrap | const | 70 | no | const wrap = make(doc, &#39;section&#39;, &#39;ux&#39;); |
| scroll | const | 71 | no | const scroll = make(doc, &#39;div&#39;, &#39;ux-scroll&#39;); |
| renderToday | function | 79 | yes | export function renderToday(host, model, options = {}) { |
| doc | const | 80 | no | const doc = dom(host); |
| m | const | 82 | no | const m = model \|\| {}; |
| connection | const | 85 | no | const connection = card(doc, &#39;Connection&#39;); |
| tone | const | 86 | no | const tone = m.connection?.tone === &#39;bad&#39; ? &#39;bad&#39; : m.connection?.tone === &#39;warn&#39; ? &#39;warn&#39; : &#39;ok&#39;; |
| explore | const | 97 | no | const explore = card(doc, &#39;Explore your VIVIM&#39;); |
| shortcuts | const | 100 | no | const shortcuts = make(doc, &#39;div&#39;, &#39;ux-surface-tiles&#39;); |
| routes | const | 101 | no | const routes = [ |
| button | const | 110 | no | const button = make(doc, &#39;button&#39;, &#39;ux-surface-tile&#39;); |
| search | const | 121 | no | const search = make(doc, &#39;button&#39;, &#39;btn sm ux-secondary&#39;, &#39;Find any feature&#39;); |
| capture | const | 127 | no | const capture = make(doc, &#39;button&#39;, &#39;btn sm ux-secondary&#39;, &#39;Quick capture · works offline&#39;); |
| voice | const | 133 | no | const voice = make(doc,&#39;button&#39;,&#39;btn sm ux-secondary&#39;,&#39;Record voice · local only&#39;); |
| mission | const | 144 | no | const mission = m.mission; |
| section | const | 145 | no | const section = card(doc, &#39;Your request&#39;); |
| details | const | 156 | no | const details = make(doc, &#39;details&#39;, &#39;ux-details&#39;); |
| ask | const | 169 | no | const ask = card(doc, &#39;Ask VIVIM&#39;); |
| open | const | 171 | no | const open = make(doc, &#39;button&#39;, &#39;btn sm ux-secondary&#39;, &#39;Ask about my PC&#39;); |
| attention | const | 178 | no | const attention = card(doc, &#39;Needs you&#39;); |
| pocket | const | 184 | no | const pocket = card(doc, &#39;Capture offline&#39;); |
| open | const | 186 | no | const open = make(doc, &#39;button&#39;, &#39;btn sm ux-secondary&#39;, &#39;Open Pocket&#39;); |
| running | const | 194 | no | const running = card(doc, &#39;Running&#39;); |
| replay | const | 202 | no | const replay = make(doc, &#39;button&#39;, &#39;btn sm ux-secondary&#39;, &#39;Replay the introduction&#39;); |
| next | const | 208 | no | const next = options.nextBatch \|\| m.next \|\| { label: &#39;Build something&#39;, tab: &#39;build&#39; }; |
| renderWorld | function | 220 | yes | export function renderWorld(host, model, options = {}) { |
| doc | const | 221 | no | const doc = dom(host); |
| m | const | 223 | no | const m = model \|\| {}; |
| built | const | 226 | no | const built = card(doc, &#39;What was built&#39;); |
| parts | const | 228 | no | const parts = [&#39;Host revision &#39; + (m.revision.revision ?? &#39;?&#39;)]; |
| running | const | 240 | no | const running = card(doc, &#39;What is running&#39;); |
| counts | const | 250 | no | const counts = [&#39;queued&#39;, &#39;claimed&#39;, &#39;done&#39;, &#39;failed&#39;] |
| media | const | 257 | no | const media = card(doc, &#39;My Media Library&#39;); |
| library | const | 258 | no | const library = m.media \|\| { state: &#39;idle&#39; }; |
| listed | const | 263 | no | const listed = Array.isArray(library.items) ? library.items : []; |
| rows | const | 265 | no | const rows = make(doc, &#39;ul&#39;, &#39;ux-list&#39;); |
| entry | const | 267 | no | const entry = make(doc, &#39;li&#39;, &#39;ux-item&#39;); |
| play | const | 273 | no | const play = make(doc, &#39;button&#39;, &#39;btn sm ux-secondary&#39;, &#39;Play&#39;); |
| messages | const | 290 | no | const messages = { |
| offset | const | 303 | no | const offset = Number.isSafeInteger(library.offset) ? library.offset : 0; |
| shown | const | 304 | no | const shown = Number.isSafeInteger(library.shown) ? library.shown : 0; |
| pageSize | const | 305 | no | const pageSize = Number.isSafeInteger(library.pageSize) &amp;&amp; library.pageSize &gt; 0 |
| pager | const | 308 | no | const pager = make(doc, &#39;div&#39;, &#39;ux-media-pager&#39;); |
| previous | const | 309 | no | const previous = make(doc, &#39;button&#39;, &#39;btn sm ux-secondary&#39;, &#39;Previous&#39;); |
| next | const | 318 | no | const next = make(doc, &#39;button&#39;, &#39;btn sm ux-secondary&#39;, &#39;Next&#39;); |
| refresh | const | 329 | no | const refresh = make(doc, &#39;button&#39;, &#39;btn sm ux-secondary&#39;, &#39;Refresh library&#39;); |
| ask | const | 337 | no | const ask = card(doc, &#39;Talk to VIVIM&#39;); |
| open | const | 339 | no | const open = make(doc, &#39;button&#39;, &#39;btn sm ux-secondary&#39;, &#39;What can I ask VIVIM?&#39;); |
| change | const | 344 | no | const change = card(doc, &#39;What you can change&#39;); |
| renderMe | function | 364 | yes | export function renderMe(host, model, options = {}) { |
| doc | const | 365 | no | const doc = dom(host); |
| m | const | 367 | no | const m = model \|\| {}; |
| identity | const | 370 | no | const identity = card(doc, &#39;Identity&#39;); |
| devices | const | 374 | no | const devices = card(doc, &#39;Phone Connection&#39;); |
| ask | const | 379 | no | const ask = card(doc, &#39;Ask about devices&#39;); |
| open | const | 381 | no | const open = make(doc, &#39;button&#39;, &#39;btn sm ux-secondary&#39;, &#39;Show paired phones&#39;); |
| permissions | const | 386 | no | const permissions = card(doc, &#39;Permissions&#39;); |
| memory | const | 391 | no | const memory = card(doc, &#39;Observed web memory&#39;); |
| open | const | 393 | no | const open = make(doc, &#39;button&#39;, &#39;btn sm ux-secondary&#39;, &#39;Open web memory&#39;); |
| install | const | 401 | no | const install = card(doc, &#39;Install VIVIM&#39;); |
| action | const | 404 | no | const action = make(doc, &#39;button&#39;, &#39;btn sm ux-secondary&#39;, &#39;Install on this device&#39;); |
| state | const | 412 | no | const state = card(doc, &#39;Device readiness&#39;); |
| urgent | const | 416 | no | const urgent = m.readiness.checks.filter(c=&gt;c.state===&#39;blocked&#39;\|\|c.state===&#39;attention&#39;); |
| urgentList | const | 418 | no | const urgentList = make(doc,&#39;ul&#39;,&#39;ux-list&#39;); |
| line | const | 420 | no | const line = make(doc,&#39;li&#39;,&#39;ux-item&#39;); |
| all | const | 427 | no | const all = make(doc,&#39;details&#39;,&#39;ux-details&#39;); |
| line | const | 430 | no | const line = make(doc,&#39;p&#39;,&#39;ux-note&#39;,c.label+&#39; · &#39;+c.state+&#39; — &#39;+c.detail); |
| tools | const | 434 | no | const tools = make(doc,&#39;div&#39;,&#39;readiness-actions&#39;); |
| check | const | 436 | no | const check = make(doc,&#39;button&#39;,&#39;btn sm ux-secondary&#39;,&#39;Check connection&#39;); |
| copy | const | 441 | no | const copy = make(doc,&#39;button&#39;,&#39;btn sm ux-secondary&#39;,&#39;Copy safe report&#39;); |
| activity | const | 449 | no | const activity = card(doc, &#39;Activity Record&#39;); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/app.js](../app.js.md) | ./ux/render.mjs |
| [apps/mobile-relay/test/goal2-arbor-progress.test.mjs](../test/goal2-arbor-progress.test.mjs.md) | ../ux/render.mjs |
| [apps/mobile-relay/test/mobile-orphan-exposure.test.mjs](../test/mobile-orphan-exposure.test.mjs.md) | ../ux/render.mjs |
| [apps/mobile-relay/test/ux-surfaces.test.mjs](../test/ux-surfaces.test.mjs.md) | ../ux/render.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Phone surface rendering: Today, World and Me.
// Text only. Every Host string lands in a text node, never in markup. The only controls are
// navigation and one read ("check again") — no effect, no send and no approval is issued here,
// so nothing on these screens can claim that something happened.

const NOT_AVAILABLE_TITLE = 'Not available yet';

function dom(host) {
  if (host && host.ownerDocument) return host.ownerDocument;
  return typeof document !== 'undefined' ? document : null;
}
function make(doc, tag, cls, text) {
  const node = doc.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
}
function card(doc, title) {
  const section = make(doc, 'section', 'ux-card');
  if (title) section.append(make(doc, 'h2', 'ux-card-title', title));
  return section;
}
function rows(doc, items) {
  const list = make(doc, 'dl', 'ux-rows');
  for (const item of items || []) {
    const row = make(doc, 'div', 'ux-row');
    row.append(make(doc, 'dt', 'ux-k', item.label), make(doc, 'dd', 'ux-v', item.value));
    list.append(row);
  }
  return list;
}
function items(doc, entries, options = {}) {
  const list = make(doc, 'ul', 'ux-list');
  for (const entry of entries || []) {
    const row = make(doc, 'li', 'ux-item');
    row.append(make(doc, 'strong', 'ux-item-title', entry.title));
    if (entry.detail) row.append(make(doc, 'span', 'ux-item-detail', entry.detail));
    if (entry.action?.tab && typeof options.onNavigate === 'function' &&
        ['today', 'talk', 'build', 'world', 'me', 'control'].includes(entry.action.tab)) {
      const open = make(doc, 'button', 'btn sm ux-secondary', entry.action.label || 'Open');
      open.type = 'button';
      open.addEventListener('click', () => options.onNavigate(entry.action.tab));
      row.append(open);
    }
    if (entry.jumpTarget && typeof options.onNavigate === 'function') {
      const jump = make(doc, 'button', 'btn sm ux-secondary', 'Jump');
      jump.type = 'button';
      jump.addEventListener('click', () => options.onNavigate('world'));
      row.append(jump);
    }
    list.append(row);
  }
  return list;
}
function gaps(doc, lines) {
  const section = card(doc, NOT_AVAILABLE_TITLE);
  for (const line of lines || []) section.append(make(doc, 'p', 'ux-gap', line));
  return section;
}
function foot(doc, action) {
  const wrap = make(doc, 'div', 'ux-foot');
  const button = make(doc, 'button', 'btn pri ux-primary', action.label);
  button.type = 'button';
  button.addEventListener('click', () => { if (typeof action.onClick === 'function') action.onClick(); });
  wrap.append(button);
  if (action.detail) wrap.append(make(doc, 'p', 'ux-foot-note', action.detail));
  return wrap;
}
function shell(doc) {
  const wrap = make(doc, 'section', 'ux');
  const scroll = make(doc, 'div', 'ux-scroll');
  wrap.append(scroll);
  return { wrap, scroll };
}

/* ---------------- Today ---------------- */

// Connection, what needs the owner, what is running, and one primary next action.
export function renderToday(host, model, options = {}) {
  const doc = dom(host);
```

_First 80 of 469 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
