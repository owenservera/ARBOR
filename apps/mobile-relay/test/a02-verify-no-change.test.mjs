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
