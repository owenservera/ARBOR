import test from 'node:test';
import assert from 'node:assert/strict';
import { createTabLifecycle } from '../../src/core/tab-lifecycle.mjs';

function makeStore() {
  const data = new Map();
  return {
    read: (key) => data.get(key) ?? null,
    write: (key, value) => { data.set(key, value); },
  };
}

function makeOwner() {
  const owned = new Set(['tab-1', 'tab-2']);
  return {
    isOwned: async (id) => owned.has(id),
    targets: async () => [...owned].map(id => ({ id })),
    closeOwned: async (id) => { owned.delete(id); },
  };
}

test('reserve creates a tab in open state', async () => {
  const store = makeStore();
  const owner = makeOwner();
  const tl = createTabLifecycle({ stateStore: store, owner });
  const r = await tl.reserve({ requestId: 't1', provider: 'chatgpt', jobKind: 'chat' });
  assert.equal(r.state, 'open');
  assert.equal(r.provider, 'chatgpt');
  assert.equal(r.targetId, null);
  assert.equal(r.transitions.length, 1);
  assert.equal(r.transitions[0].to, 'open');
});

test('bind transitions open -> ready', async () => {
  const store = makeStore();
  const owner = makeOwner();
  const tl = createTabLifecycle({ stateStore: store, owner });
  await tl.reserve({ requestId: 't1', provider: 'chatgpt' });
  const r = await tl.bind({ requestId: 't1', targetId: 'tab-1' });
  assert.equal(r.state, 'ready');
  assert.equal(r.targetId, 'tab-1');
});

test('bind fails for unowned target', async () => {
  const store = makeStore();
  const owner = makeOwner();
  const tl = createTabLifecycle({ stateStore: store, owner });
  await tl.reserve({ requestId: 't1', provider: 'chatgpt' });
  await assert.rejects(tl.bind({ requestId: 't1', targetId: 'unowned-tab' }), { code: 'TAB_NOT_OWNED' });
});

test('advance transitions open -> ready -> sending with proof', async () => {
  const store = makeStore();
  const owner = makeOwner();
  const tl = createTabLifecycle({ stateStore: store, owner });
  await tl.reserve({ requestId: 't1', provider: 'chatgpt' });
  await tl.bind({ requestId: 't1', targetId: 'tab-1' });
  const r = await tl.advance({
    requestId: 't1', to: 'sending',
    proof: { requestId: 't1', targetId: 'tab-1', ownerVerified: true },
  });
  assert.equal(r.state, 'sending');
});

test('advance rejects without proof for sending', async () => {
  const store = makeStore();
  const owner = makeOwner();
  const tl = createTabLifecycle({ stateStore: store, owner });
  await tl.reserve({ requestId: 't1', provider: 'chatgpt' });
  await tl.bind({ requestId: 't1', targetId: 'tab-1' });
  await assert.rejects(tl.advance({ requestId: 't1', to: 'sending' }), { code: 'TAB_PROOF_REQUIRED' });
});

test('heartbeat updates lastHeartbeatAt', async () => {
  const store = makeStore();
  const owner = makeOwner();
  const tl = createTabLifecycle({ stateStore: store, owner });
  await tl.reserve({ requestId: 't1', provider: 'chatgpt' });
  await tl.bind({ requestId: 't1', targetId: 'tab-1' });
  const before = (await tl.records()).find(r => r.id === 't1').lastHeartbeatAt;
  await new Promise(r => setTimeout(r, 10));
  await tl.heartbeat({ requestId: 't1', targetId: 'tab-1' });
  const after = (await tl.records()).find(r => r.id === 't1').lastHeartbeatAt;
  assert.ok(after > before);
});

test('sweep marks expired open tab as failed', async () => {
  const store = makeStore();
  const owner = makeOwner();
  const tl = createTabLifecycle({ stateStore: store, owner, now: () => 35000 });
  await tl.reserve({ requestId: 't1', provider: 'chatgpt' });
  const recs = JSON.parse(store.read('tab.lifecycle.v1'));
  recs[0].createdAt = 0;
  recs[0].changedAt = 0;
  recs[0].lastHeartbeatAt = 0;
  store.write('tab.lifecycle.v1', JSON.stringify(recs));
  const r = await tl.sweep({ restarting: false });
  assert.equal(r.changes.length, 1);
  assert.equal(r.changes[0].state, 'failed');
  assert.equal(r.changes[0].reason, 'watchdog_expired');
});

test('per-provider cap enforced', async () => {
  const store = makeStore();
  const owner = makeOwner();
  const tl = createTabLifecycle({ stateStore: store, owner, policy: { maxPerProvider: 1 } });
  await tl.reserve({ requestId: 't1', provider: 'chatgpt' });
  await assert.rejects(tl.reserve({ requestId: 't2', provider: 'chatgpt' }), { code: 'TAB_CAPACITY' });
  await tl.reserve({ requestId: 't3', provider: 'claude' });
  assert.equal((await tl.records()).length, 2);
});

test('closeCompleted closes terminal tab', async () => {
  const store = makeStore();
  const owner = makeOwner();
  const tl = createTabLifecycle({ stateStore: store, owner });
  await tl.reserve({ requestId: 't1', provider: 'chatgpt' });
  await tl.bind({ requestId: 't1', targetId: 'tab-1' });
  await tl.advance({ requestId: 't1', to: 'sending', proof: { requestId: 't1', targetId: 'tab-1', ownerVerified: true } });
  await tl.advance({ requestId: 't1', to: 'sent', proof: { requestId: 't1', targetId: 'tab-1', ownerVerified: true } });
  await tl.advance({ requestId: 't1', to: 'streaming', proof: { requestId: 't1', targetId: 'tab-1', ownerVerified: true } });
  await tl.advance({ requestId: 't1', to: 'done', proof: { requestId: 't1', targetId: 'tab-1', ownerVerified: true, replySettled: true } });
  const r = await tl.closeCompleted({ requestId: 't1' });
  assert.equal(r.state, 'closed');
});

test('snapshot returns clone of all records', async () => {
  const store = makeStore();
  const owner = makeOwner();
  const tl = createTabLifecycle({ stateStore: store, owner });
  await tl.reserve({ requestId: 't1', provider: 'chatgpt' });
  const snap = tl.records();
  assert.equal(snap.length, 1);
  assert.equal(snap[0].id, 't1');
  snap[0].state = 'hacked';
  assert.equal((await tl.records())[0].state, 'open');
});
