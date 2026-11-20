# File: apps/mobile-relay/test/a02-verify-no-change.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/a02-verify-no-change.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2550 B |
| Lines | 43 |
| Hash | 75e1b4773f51 |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| env | const | 9 | no | const env = { VIVIM_RELAY_PAIR_SECRET: &#39;p&#39;.repeat(43), VIVIM_RELAY_HOST_SECRET: &#39;h&#39;.repeat(43) }; |
| phone | const | 10 | no | const phone = { headers: { cookie: `${COOKIE}=${sessionValue(env.VIVIM_RELAY_PAIR_SECRET)}` } }; |
| host | const | 11 | no | const host = { headers: { authorization: &#39;Bearer &#39; + env.VIVIM_RELAY_HOST_SECRET } }; |
| r | const | 14 | no | const r = createRelay({ store: memoryStore(), env }); |
| created | const | 15 | no | const created = await r({ method: &#39;POST&#39;, path: &#39;commands&#39;, req: phone, body: { text: &#39;hello relay&#39;, mode: &#39;relay-chat&#39;, kind: &#39;command&#39;, consumer: &#39;grokbot&#39; } }); |
| pending | const | 20 | no | const pending = await r({ method: &#39;GET&#39;, path: &#39;host/pending&#39;, req: host }); |
| seen | const | 22 | no | const seen = await r({ method: &#39;GET&#39;, path: &#39;commands/&#39; + created.body.id, req: phone }); |
| r | const | 28 | no | const r = createRelay({ store: memoryStore(), env }); |
| postResult | const | 32 | no | const postResult = await r({ method: &#39;POST&#39;, path, req: phone, body: {} }).then( () =&gt; { throw new Error(&#39;expected refusal&#39;); }, e =&gt; e.status ); |
| getResult | const | 37 | no | const getResult = await r({ method: &#39;GET&#39;, path, req: host }).then( () =&gt; { throw new Error(&#39;expected refusal&#39;); }, e =&gt; e.status ); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 5 | external |
| node:assert/strict | import | 6 | external |
| ../lib/relay-core.mjs | import | 7 | [apps/mobile-relay/lib/relay-core.mjs](../lib/relay-core.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// A02 scope partition 5 — mobile-relay verify-no-change.
// mobile-relay has no chat↔wiki projection (wiki appears only in the unrelated
// vec/compiler.mjs domain registry). This test asserts the mobile-relay surface
// does not interpret chat as wiki edits and does not host a second interpreter.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRelay, memoryStore, sessionValue, COOKIE } from '../lib/relay-core.mjs';

const env = { VIVIM_RELAY_PAIR_SECRET: 'p'.repeat(43), VIVIM_RELAY_HOST_SECRET: 'h'.repeat(43) };
const phone = { headers: { cookie: `${COOKIE}=${sessionValue(env.VIVIM_RELAY_PAIR_SECRET)}` } };
const host = { headers: { authorization: 'Bearer ' + env.VIVIM_RELAY_HOST_SECRET } };

test('mobile-relay has no chat->wiki projection: commands are append-only relay records', async () => {
  const r = createRelay({ store: memoryStore(), env });
  const created = await r({ method: 'POST', path: 'commands', req: phone, body: { text: 'hello relay', mode: 'relay-chat', kind: 'command', consumer: 'grokbot' } });
  assert.equal(created.status, 201);
  assert.ok(!created.body.wiki, 'no wiki projection key on relay command');
  assert.ok(!created.body.edit, 'no wiki edit key on relay command');
  assert.equal(created.body.mode, 'relay-chat');
  const pending = await r({ method: 'GET', path: 'host/pending', req: host });
  assert.ok(pending.body.commands.some(c => c.text === 'hello relay'));
  const seen = await r({ method: 'GET', path: 'commands/' + created.body.id, req: phone });
  assert.equal(seen.body.text, 'hello relay');
  assert.equal(seen.body.mode, 'relay-chat');
});

test('mobile-relay does not expose wiki page or section surfaces', async () => {
  const r = createRelay({ store: memoryStore(), env });
  // wiki/page/section paths are not relay routes: they return 401 (auth
  // gating before routing) or 404 (unknown route), never a wiki projection.
  for (const path of ['wiki', 'pages', 'page/Main', 'section/HowTo', 'wiki/edit']) {
    const postResult = await r({ method: 'POST', path, req: phone, body: {} }).then(
      () => { throw new Error('expected refusal'); },
      e => e.status
    );
    assert.ok(postResult === 401 || postResult === 404, 'POST ' + path + ' refused with ' + postResult);
    const getResult = await r({ method: 'GET', path, req: host }).then(
      () => { throw new Error('expected refusal'); },
      e => e.status
    );
    assert.ok(getResult === 401 || getResult === 404, 'GET ' + path + ' refused with ' + getResult);
  }
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
