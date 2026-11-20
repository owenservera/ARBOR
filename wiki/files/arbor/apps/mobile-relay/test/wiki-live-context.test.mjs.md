# File: apps/mobile-relay/test/wiki-live-context.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/wiki-live-context.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4176 B |
| Lines | 97 |
| Hash | 42eae9d7b46d |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| app | const | 7 | no | const app = readFileSync(new URL(&#39;../app.js&#39;, import.meta.url), &#39;utf8&#39;); |
| functionSource | function | 9 | no | function functionSource(source, name) { |
| start | variable | 10 | no | let start = source.indexOf(&#39;function &#39; + name + &#39;(&#39;); assert.notEqual(start, -1, name + &#39; must exist in the real PWA&#39;); if (source.slice(start - 6, start) === &#39;async &#39;) start -= 6; const from = sourc… |
| depth | variable | 14 | no | let depth = 0; |
| readCount | variable | 23 | no | let readCount = 0; |
| armed | variable | 24 | no | let armed = null; |
| armedCount | variable | 25 | no | let armedCount = 0; |
| env | const | 26 | no | const env = { |
| response | variable | 53 | no | let response = { ok: true, json: async () =&gt; ({ revision: 3, pages: { Main: { sections: { About: &#39;&lt;b&gt;literal user content&lt;/b&gt;&#39; } } } }) }; |
| calls | const | 56 | no | const calls = []; |
| env | const | 57 | no | const env = { |

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

// Execute the actual PWA functions, not a second Wiki implementation.
const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');

function functionSource(source, name) {
  let start = source.indexOf('function ' + name + '(');
  assert.notEqual(start, -1, name + ' must exist in the real PWA');
  if (source.slice(start - 6, start) === 'async ') start -= 6;
  const from = source.indexOf('{', start);
  let depth = 0;
  for (let i = from; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error('Unbalanced ' + name);
}

test('mounted Wiki reuses existing PWA timer and stops when hidden or leaving tab', () => {
  let readCount = 0;
  let armed = null;
  let armedCount = 0;
  const env = {
    S: { tab: 'wiki', paired: true, timer: 0 },
    N: { target: 'phone' },
    HOST_PREVIEW: false,
    document: { hidden: false },
    clearTimeout() {},
    setTimeout(fn, delay) { armedCount++; armed = { fn, delay }; return armedCount; },
    refreshWiki() { readCount++; },
    refresh() {}, pending() { return false }
  };
  vm.createContext(env);
  vm.runInContext(functionSource(app, 'schedule'), env);
  env.schedule();
  assert.equal(armed.delay, 8000);
  armed.fn();
  assert.equal(readCount, 1, 'live Host read on a mounted Wiki');
  assert.equal(armedCount, 2, 'timer re-armed through existing scheduling path');
  env.document.hidden = true;
  env.schedule();
  assert.equal(armedCount, 2, 'hidden Wiki starts no new polling');
  env.document.hidden = false;
  env.S.tab = 'talk';
  env.schedule();
  assert.equal(armedCount, 2, 'leaving Wiki stops native-phone Wiki polling');
});

test('real PWA Wiki HTTP projection rejects rollback and revocation, without storing a copy', async () => {
  let response = { ok: true, json: async () => ({
    revision: 3, pages: { Main: { sections: { About: '<b>literal user content</b>' } } }
  }) };
  const calls = [];
  const env = {
    HOST_PREVIEW: false,
    wikiReadSequence: 0,
    S: { tab: 'wiki', paired: true, wiki: null, wikiError: '',
      device: { scopes: ['control:read'] } },
    transport: { direct: true, deviceHeaders: () => ({
      'x-vivim-device-session': 'session-1', 'x-vivim-grant-id': 'grant-1'
    }) },
    renderWiki() { calls.push('render'); },
    clearWiki(reason) { env.wikiReadSequence++; env.S.wiki = null;
      env.S.wikiError = reason; calls.push('clear'); },
    clearPrivatePhoneState() { env.S.wiki = null; env.S.paired = false; calls.push('revoke'); },
    isInvalidDeviceSession(code) { return code === 'GRANT_REVOKED'; },
    fetch: async (url, opts) => {
      assert.equal(url, '/mobile/api/wiki');
      assert.equal(opts.headers['x-vivim-device-session'], 'session-1');
      return response;
    }
  };
  vm.createContext(env);
  vm.runInContext(functionSource(app, 'refreshWiki'), env);
  await env.refreshWiki();
  assert.equal(env.S.wiki.revision, 3);
  assert.equal(env.S.wiki.pages.Main.sections.About, '<b>literal user content</b>');
```

_First 80 of 98 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
