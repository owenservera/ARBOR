# File: apps/mobile-relay/test/relay-core.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/relay-core.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6853 B |
| Lines | 89 |
| Hash | e67b8098ac49 |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| env | const | 3 | no | const env = { VIVIM_RELAY_PAIR_SECRET: &#39;p&#39;.repeat(43), VIVIM_RELAY_HOST_SECRET: &#39;h&#39;.repeat(43) }; |
| phone | const | 4 | no | const phone = { headers: { cookie: `${COOKIE}=${sessionValue(env.VIVIM_RELAY_PAIR_SECRET)}` } }, host = { headers: { authorization: &#39;Bearer &#39; + env.VIVIM_RELAY_HOST_SECRET } }, anon = { headers: {} }; |
| r | const | 6 | no | const r = createRelay({ store: memoryStore(), env }); |
| p | const | 8 | no | const p = await r({ method: &#39;POST&#39;, path: &#39;pair&#39;, req: anon, body: { secret: env.VIVIM_RELAY_PAIR_SECRET } }); |
| c | const | 13 | no | const c = (await r({ method: &#39;POST&#39;, path: &#39;commands&#39;, req: phone, body: { text: &#39; hello &#39; } })).body; |
| seen | const | 19 | no | const seen = (await r({ method: &#39;GET&#39;, path: &#39;commands/&#39; + c.id, req: phone })).body; |
| r | const | 25 | no | const r = createRelay({ store: memoryStore(), env: {} }); |
| relay | const | 31 | no | const relay=createRelay({ store:memoryStore(), env }); |
| command | const | 32 | no | const command={ text:&#39;choose-preset&#39;, kind:&#39;command&#39;, consumer:&#39;bootstrap&#39;, |
| created | const | 34 | no | const created=await relay({ method:&#39;POST&#39;,path:&#39;commands&#39;,req:phone,body:command }); |
| pending | const | 40 | no | const pending=await relay({ method:&#39;GET&#39;,path:&#39;host/pending&#39;,req:host }); |
| relay | const | 56 | no | const relay=createRelay({ store:memoryStore(), env }); |
| created | const | 57 | no | const created=await relay({ method:&#39;POST&#39;,path:&#39;commands&#39;,req:phone, body:{ text:&#39;undo-ui-revision&#39;, kind:&#39;command&#39;, consumer:&#39;bootstrap&#39;, mode:&#39;bootstrap&#39;, action:&#39;undo-ui-revision&#39; } }); |
| pending | const | 64 | no | const pending=await relay({ method:&#39;GET&#39;,path:&#39;host/pending&#39;,req:host }); |
| relay | const | 75 | no | const relay=createRelay({ store:memoryStore(), env }); |
| proposal | const | 76 | no | const proposal={ schema:&#39;vivim.ui-proposal/1&#39;, surfaceId:&#39;my-space&#39;, baseRevision:0, |
| created | const | 79 | no | const created=await relay({method:&#39;POST&#39;,path:&#39;commands&#39;,req:phone,body:{ text:&#39;apply-proposal&#39;, kind:&#39;command&#39;, consumer:&#39;bootstrap&#39;, mode:&#39;bootstrap&#39;, action:&#39;apply-proposal&#39;, proposal }}); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| ../lib/relay-core.mjs | import | 2 | [apps/mobile-relay/lib/relay-core.mjs](../lib/relay-core.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test'; import assert from 'node:assert/strict';
import { createRelay, memoryStore, sessionValue, COOKIE } from '../lib/relay-core.mjs';
const env = { VIVIM_RELAY_PAIR_SECRET: 'p'.repeat(43), VIVIM_RELAY_HOST_SECRET: 'h'.repeat(43) };
const phone = { headers: { cookie: `${COOKIE}=${sessionValue(env.VIVIM_RELAY_PAIR_SECRET)}` } }, host = { headers: { authorization: 'Bearer ' + env.VIVIM_RELAY_HOST_SECRET } }, anon = { headers: {} };
test('pair, create, host claim/reply, phone sees result, auth separation', async () => {
  const r = createRelay({ store: memoryStore(), env });
  await assert.rejects(r({ method: 'POST', path: 'pair', req: anon, body: { secret: 'wrong' } }), { status: 401 });
  const p = await r({ method: 'POST', path: 'pair', req: anon, body: { secret: env.VIVIM_RELAY_PAIR_SECRET } });
  assert.match(p.cookie, /HttpOnly; Secure; SameSite=Strict/); assert.ok(!p.cookie.includes(env.VIVIM_RELAY_PAIR_SECRET));
  await assert.rejects(r({ method: 'GET', path: 'commands', req: anon }), { status: 401 });
  await assert.rejects(r({ method: 'GET', path: 'host/pending', req: phone }), { status: 401 });
  await assert.rejects(r({ method: 'GET', path: 'commands', req: { headers: { cookie: `${COOKIE}=x` } } }), { status: 401 });
  const c = (await r({ method: 'POST', path: 'commands', req: phone, body: { text: ' hello ' } })).body;
  assert.equal(c.status, 'queued'); assert.equal(c.text, 'hello');
  assert.equal((await r({ method: 'GET', path: 'host/pending', req: host })).body.commands.length, 1);
  await r({ method: 'POST', path: 'host/update', req: host, body: { id: c.id, status: 'claimed', by: 'grokbot' } });
  assert.equal((await r({ method: 'GET', path: 'host/pending', req: host })).body.commands.length, 0);
  await r({ method: 'POST', path: 'host/update', req: host, body: { id: c.id, status: 'done', result: 'ok' } });
  const seen = (await r({ method: 'GET', path: 'commands/' + c.id, req: phone })).body;
  assert.equal(seen.status, 'done'); assert.equal(seen.result, 'ok'); assert.equal(seen.rev, 3);
  await r({ method: 'POST', path: 'host/status', req: host, body: { stage: 'x' } });
  assert.deepEqual((await r({ method: 'GET', path: 'status', req: phone })).body.snapshot, { stage: 'x' });
});
test('no secrets configured -> everything locked', async () => {
  const r = createRelay({ store: memoryStore(), env: {} });
  await assert.rejects(r({ method: 'POST', path: 'pair', req: anon, body: { secret: '' } }), { status: 401 });
  await assert.rejects(r({ method: 'GET', path: 'host/pending', req: { headers: { authorization: 'Bearer ' } } }), { status: 401 });
});

test('paired Bootstrap commands are routed exclusively and reject arbitrary actions', async () => {
  const relay=createRelay({ store:memoryStore(), env });
  const command={ text:'choose-preset', kind:'command', consumer:'bootstrap',
    mode:'bootstrap', action:'choose-preset', preset:'dusk' };
  const created=await relay({ method:'POST',path:'commands',req:phone,body:command });
  assert.equal(created.status,201);
  assert.equal(created.body.mode,'bootstrap');
  assert.equal(created.body.action,'choose-preset');
  assert.equal(created.body.consumer,'bootstrap');
  assert.equal(created.body.preset,'dusk');
  const pending=await relay({ method:'GET',path:'host/pending',req:host });
  assert.equal(pending.body.commands[0].consumer,'bootstrap');
  for(const bad of [
    {...command,consumer:'harness'},
    {...command,action:'run-shell',text:'run-shell'},
    {...command,preset:'unknown'},
    {...command,secret:'injected'},
    {...command,target:{provider:'chatgpt'}},
    {...command,text:'free form'}
  ]) {
    await assert.rejects(relay({method:'POST',path:'commands',req:phone,body:bad}),{status:400});
  }
  await assert.rejects(relay({method:'POST',path:'commands',req:anon,body:command}),{status:401});
});

test('paired Bootstrap undo-ui-revision command is created and arbitrary actions still fail', async () => {
  const relay=createRelay({ store:memoryStore(), env });
  const created=await relay({ method:'POST',path:'commands',req:phone,
    body:{ text:'undo-ui-revision', kind:'command', consumer:'bootstrap', mode:'bootstrap', action:'undo-ui-revision' } });
  assert.equal(created.status,201);
  assert.equal(created.body.action,'undo-ui-revision');
  assert.equal(created.body.text,'undo-ui-revision');
  assert.equal(created.body.mode,'bootstrap');
  assert.equal(created.body.consumer,'bootstrap');
  const pending=await relay({ method:'GET',path:'host/pending',req:host });
  assert.equal(pending.body.commands[0].action,'undo-ui-revision');
  await assert.rejects(relay({ method:'POST',path:'commands',req:phone,
    body:{ text:'undo-something', kind:'command', consumer:'bootstrap', mode:'bootstrap', action:'undo-something' } }),{status:400});
  await assert.rejects(relay({ method:'POST',path:'commands',req:phone,
    body:{ text:'undo-ui-revision', kind:'command', consumer:'bootstrap', mode:'bootstrap', action:'undo-ui-revision', preset:'dusk' } }),{status:400});
  await assert.rejects(relay({ method:'POST',path:'commands',req:phone,
    body:{ text:'undo-ui-revision', kind:'command', consumer:'harness', mode:'bootstrap', action:'undo-ui-revision' } }),{status:400});
});

test('paired Bootstrap apply-proposal carries a structured proposal and is validated', async () => {
  const relay=createRelay({ store:memoryStore(), env });
  const proposal={ schema:'vivim.ui-proposal/1', surfaceId:'my-space', baseRevision:0,
    operations:[{opId:'op.tap',type:'replace-props',componentId:'item1',props:{density:'comfortable'}}],
    explanation:'Tap', assumptions:[], unknowns:[] };
  const created=await relay({method:'POST',path:'commands',req:phone,body:{ text:'apply-proposal', kind:'command', consumer:'bootstrap',
    mode:'bootstrap', action:'apply-proposal', proposal }});
```

_First 80 of 90 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
