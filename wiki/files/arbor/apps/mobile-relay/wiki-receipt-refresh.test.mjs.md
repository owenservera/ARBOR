# File: apps/mobile-relay/wiki-receipt-refresh.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | apps/mobile-relay/wiki-receipt-refresh.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2974 B |
| Lines | 62 |
| Hash | 229b5226317a |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| chatSource | const | 5 | no | const chatSource = readFileSync(new URL(&#39;./control-chat.mjs&#39;, import.meta.url), &#39;utf8&#39;); |
| appSource | const | 6 | no | const appSource = readFileSync(new URL(&#39;./app.js&#39;, import.meta.url), &#39;utf8&#39;); |
| functionSource | function | 8 | no | function functionSource(source, name) { |
| start | const | 9 | no | const start = source.indexOf(&#39;function &#39; + name + &#39;(&#39;); assert.notEqual(start, -1, name + &#39; source missing&#39;); const body = source.indexOf(&#39;{&#39;, start); let depth = 0; for (let i = body; i &lt; source.len… |
| body | const | 11 | no | const body = source.indexOf(&#39;{&#39;, start); |
| depth | variable | 12 | no | let depth = 0; |
| events | const | 21 | no | const events = []; |
| TestEvent | class | 22 | no | class TestEvent { |
| constructor | method | 23 | yes | constructor(type, options) { |
| notifier | const | 29 | no | const notifier = new Function(&#39;host&#39;, &#39;CustomEvent&#39;, functionSource(chatSource, &#39;notifyWikiCommitted&#39;) + &#39;\\nreturn notifyWikiCommitted;&#39;)( { dispatchEvent: event =&gt; events.push(event) }, TestEvent); |
| Source | function | 30 | no | functionSource(chatSource, &#39;notifyWikiCommitted&#39;) + &#39;\\nreturn notifyWikiCommitted;&#39;)( |
| listeners | const | 47 | no | const listeners = {}; |
| S | const | 48 | no | const S = { tab: &#39;talk&#39; }; |
| reads | variable | 49 | no | let reads = 0; |
| listener | const | 55 | no | const listener = listeners[&#39;vivim:wiki-committed&#39;]; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const chatSource = readFileSync(new URL('./control-chat.mjs', import.meta.url), 'utf8');
const appSource = readFileSync(new URL('./app.js', import.meta.url), 'utf8');

function functionSource(source, name) {
  const start = source.indexOf('function ' + name + '(');
  assert.notEqual(start, -1, name + ' source missing');
  const body = source.indexOf('{', start);
  let depth = 0;
  for (let i = body; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error('Unclosed ' + name);
}

test('only an applied Wiki receipt with Host revision notifies live Wiki', () => {
  const events = [];
  class TestEvent {
    constructor(type, options) {
      this.type = type;
      this.detail = options.detail;
      this.bubbles = options.bubbles;
    }
  }
  const notifier = new Function('host', 'CustomEvent',
    functionSource(chatSource, 'notifyWikiCommitted') + '\nreturn notifyWikiCommitted;')(
      { dispatchEvent: event => events.push(event) }, TestEvent);
  notifier({ status: 'uncertain', actionId: 'wiki.section.edit', result: { wikiRevision: 4 } });
  notifier({ status: 'failed', actionId: 'wiki.section.edit', result: { wikiRevision: 4 } });
  notifier({ status: 'applied', actionId: 'ui.theme.set_preset', result: { wikiRevision: 4 } });
  notifier({ status: 'applied', actionId: 'wiki.section.edit', result: {} });
  assert.equal(events.length, 0, 'no notification for unproven Wiki changes');
  notifier({ status: 'applied', actionId: 'wiki.section.edit', result: { wikiRevision: 5 } });
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'vivim:wiki-committed');
  assert.equal(events[0].detail.revision, 5);
  assert.equal(events[0].bubbles, true);
});

test('existing PWA Wiki tab re-reads only while visible', () => {
  const match = appSource.match(/document\.addEventListener\('vivim:wiki-committed', \(\) => \{[\s\S]*?\n\}\);/);
  assert.ok(match, 'Wiki readback listener missing from real PWA');
  const listeners = {};
  const S = { tab: 'talk' };
  let reads = 0;
  // the listener body (app.js:2158-2161) also resets the module-scope dockAssist/compose
  // (app.js:136 / :1676), so the harness must bind them alongside document/S/refreshWiki
  new Function('document', 'S', 'refreshWiki', 'dockAssist', 'compose', match[0])(
    { addEventListener: (name, fn) => { listeners[name] = fn; } },
    S, () => { reads++; }, { reset() {} }, { resetAssist() {} });
  const listener = listeners['vivim:wiki-committed'];
  assert.equal(typeof listener, 'function');
  listener();
  assert.equal(reads, 0, 'do not read Wiki on unrelated tab');
  S.tab = 'wiki';
  listener();
  assert.equal(reads, 1, 'live Wiki tab refreshes after committed Host change');
});
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
