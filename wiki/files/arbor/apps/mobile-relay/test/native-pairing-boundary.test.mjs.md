# File: apps/mobile-relay/test/native-pairing-boundary.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/native-pairing-boundary.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 17874 B |
| Lines | 383 |
| Hash | b7a0dfdab24d |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| app | const | 10 | no | const app = readFileSync(new URL(&#39;../app.js&#39;, import.meta.url), &#39;utf8&#39;); |
| indexHtml | const | 11 | no | const indexHtml = readFileSync(new URL(&#39;../index.html&#39;, import.meta.url), &#39;utf8&#39;); |
| declSource | function | 15 | no | function declSource(source, name) { |
| re | const | 16 | no | const re = new RegExp( &#39;(?:async[ \\\\t]+)?function[ \\\\t]+&#39; + name + &#39;[ \\\\t]*\\\\(&#39; + &#39;\|(?:const\|let\|var)[ \\\\t]+&#39; + name + &#39;[ \\\\t]*=[ \\\\t]*(?:async[ \\\\t]*)?\\\\([^)]*\\\\)[ \\\\t]*=&gt;&#39;); |
| m | const | 19 | no | const m = re.exec(source); |
| depth | variable | 23 | no | let depth = 0; |
| callersOf | function | 31 | no | function callersOf(symbol) { |
| re | const | 32 | no | const re = /(?:^\|\\n)[ \\t]*(?:async[ \\t]+)?function[ \\t]+([A-Za-z_$][\\w$]*)[ \\t]*\\(/g; const names = []; let m; while ((m = re.exec(app))) { const from = app.indexOf(&#39;{&#39;, m.index + m[0].length - 1); |
| names | const | 33 | no | const names = []; |
| m | variable | 34 | no | let m; |
| depth | variable | 37 | no | let depth = 0, end = -1; |
| memStorage | function | 49 | no | function memStorage(initial = {}) { |
| map | const | 50 | no | const map = new Map(Object.entries(initial)); |
| makeNode | function | 59 | no | function makeNode(tag) { |
| textOf | function | 70 | no | function textOf(node) { |
| out | variable | 71 | no | let out = String(node.textContent \|\| &#39;&#39;); |
| makeDom | function | 76 | no | function makeDom(ids) { |
| reg | const | 77 | no | const reg = {}; |
| document | const | 79 | no | const document = { |
| elStub | function | 88 | no | const elStub = (tag, cls, text) =&gt; { |
| n | const | 89 | no | const n = makeNode(tag); |
| body | const | 124 | no | const body = declSource(app, &#39;renderNative&#39;); |
| body | const | 132 | no | const body = declSource(app, name); |
| callers | const | 144 | no | const callers = callersOf(&#39;clearPrivatePhoneState&#39;); |
| body | const | 154 | no | const body = declSource(app, f); |
| sessionStorage | const | 163 | no | const sessionStorage = memStorage(); |
| env | const | 164 | no | const env = { N: { pending: { id: &#39;m1&#39;, text: &#39;hi&#39; } }, sessionStorage }; |
| store | const | 176 | no | const store = memStorage(); |
| env | const | 177 | no | const env = { |
| revokeEnv | function | 191 | no | function revokeEnv() { |
| dom | const | 192 | no | const dom = makeDom([&#39;msgs&#39;, &#39;title&#39;, &#39;native-status&#39;, &#39;text&#39;, &#39;dbg&#39;, &#39;app&#39;, &#39;pairbox&#39;]); |
| pendingItem | const | 193 | no | const pendingItem = { id: &#39;msg_deadbeef&#39;, session: &#39;sess-1&#39;, text: &#39;SECRET-PENDING-TEXT&#39;, accepted: true }; |
| sessionStorage | const | 194 | no | const sessionStorage = memStorage({ &#39;vivim.phone.pending.v1&#39;: JSON.stringify(pendingItem) }); |
| clearedTimers | const | 195 | no | const clearedTimers = []; |
| env | const | 196 | no | const env = { |
| shown | const | 249 | no | const shown = textOf(dom.reg.msgs); |
| shown | variable | 263 | no | let shown = textOf(dom.reg.msgs); |
| sendEnv | function | 278 | no | function sendEnv(ack) { |
| dom | const | 279 | no | const dom = makeDom([&#39;text&#39;, &#39;msgs&#39;, &#39;title&#39;, &#39;native-status&#39;]); |
| sessionStorage | const | 280 | no | const sessionStorage = memStorage(); |
| calls | const | 281 | no | const calls = []; |
| env | const | 282 | no | const env = { |
| refreshEnv | function | 339 | no | function refreshEnv(messages, paired = true) { |
| dom | const | 340 | no | const dom = makeDom([&#39;msgs&#39;, &#39;title&#39;, &#39;native-status&#39;]); |
| sessionStorage | const | 341 | no | const sessionStorage = memStorage({ &#39;vivim.phone.pending.v1&#39;: JSON.stringify({ id: &#39;m1&#39;, session: &#39;sess-1&#39;, accepted: true }) }); |
| calls | const | 342 | no | const calls = []; |
| cleared | const | 343 | no | const cleared = []; |
| armed | variable | 344 | no | let armed = null; |
| env | const | 345 | no | const env = { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 5 | external |
| node:assert/strict | import | 6 | external |
| node:fs | import | 7 | external |
| node:vm | import | 8 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// NEXT:D14.device-pairing — native-panel boundary and revoked-grant acceptance.
// Every behavioral assertion below executes the *committed* app.js function
// (extracted from ../app.js and run in a vm sandbox), not a copy of it, so the
// same source that index.html loads is the source under test.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

/* ---------- source extraction (same approach as wiki-live-context.test.mjs) ---------- */

function declSource(source, name) {
  const re = new RegExp(
    '(?:async[ \\t]+)?function[ \\t]+' + name + '[ \\t]*\\(' +
    '|(?:const|let|var)[ \\t]+' + name + '[ \\t]*=[ \\t]*(?:async[ \\t]*)?\\([^)]*\\)[ \\t]*=>');
  const m = re.exec(source);
  assert.ok(m, name + ' must exist in the committed PWA source (app.js)');
  const from = source.indexOf('{', m.index + m[0].length - 1);
  assert.notEqual(from, -1, name + ' must have a block body');
  let depth = 0;
  for (let i = from; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}' && --depth === 0) return source.slice(m.index, i + 1);
  }
  throw new Error('Unbalanced ' + name);
}

function callersOf(symbol) {
  const re = /(?:^|\n)[ \t]*(?:async[ \t]+)?function[ \t]+([A-Za-z_$][\w$]*)[ \t]*\(/g;
  const names = [];
  let m;
  while ((m = re.exec(app))) {
    const from = app.indexOf('{', m.index + m[0].length - 1);
    let depth = 0, end = -1;
    for (let i = from; i < app.length; i++) {
      if (app[i] === '{') depth++;
      else if (app[i] === '}' && --depth === 0) { end = i; break; }
    }
    if (end > 0 && app.slice(from, end).includes(symbol)) names.push(m[1]);
  }
  return names.sort();
}

/* ---------- tiny DOM / storage shims ---------- */

function memStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: k => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: k => map.delete(k),
    keys: () => [...map.keys()]
  };
}

function makeNode(tag) {
  return {
    tagName: tag, children: [], className: '', textContent: '', value: '', hidden: false,
    style: {}, attrs: {}, scrollHeight: 1000, scrollTop: 0, clientHeight: 100,
    append(...n) { this.children.push(...n); },
    setAttribute(k, v) { this.attrs[k] = v; },
    replaceChildren(...n) { this.children = n; },
    classList: { add() {}, remove() {}, toggle() {} }
  };
}

function textOf(node) {
  let out = String(node.textContent || '');
  for (const c of node.children || []) out += '|' + textOf(c);
  return out;
}

function makeDom(ids) {
  const reg = {};
  for (const id of ids) reg[id] = makeNode('div#' + id);
  const document = {
    hidden: false,
```

_First 80 of 384 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
