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
  assert.equal(created.status,201);
  assert.equal(created.body.action,'apply-proposal');
  assert.equal(created.body.proposal,proposal);
  assert.equal(created.body.text,'apply-proposal');
  // Missing proposal rejected; non-object proposal rejected; wrong text rejected.
  await assert.rejects(relay({method:'POST',path:'commands',req:phone,body:{ text:'apply-proposal', kind:'command', consumer:'bootstrap', mode:'bootstrap', action:'apply-proposal' }}),{status:400});
  await assert.rejects(relay({method:'POST',path:'commands',req:phone,body:{ text:'apply-proposal', kind:'command', consumer:'bootstrap', mode:'bootstrap', action:'apply-proposal', proposal:'not-an-object' }}),{status:400});
  await assert.rejects(relay({method:'POST',path:'commands',req:phone,body:{ text:'free-form', kind:'command', consumer:'bootstrap', mode:'bootstrap', action:'apply-proposal', proposal }}),{status:400});
});
