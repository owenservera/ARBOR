import test from 'node:test';
import assert from 'node:assert/strict';
import { createProviderHub, HUB_SCHEMA, HUB_MODE } from './provider-hub.mjs';

const identity = { principalRef: 'person:1', worldRef: 'world:1', accountRef: 'account:1', accountEpoch: 3 };
const descriptor = { schema: HUB_SCHEMA, providerId: 'messenger', capabilities: ['streams', 'thread.read', 'search', 'action.propose', 'action.status'] };
const page = { state: 'partial', items: [{ unitRef: 'synthetic://one' }], nextCursor: null };
function fixture(overrides = {}) {
  const calls = [];
  const worldPort = { authorize: async arg => {
    calls.push(['authorize', arg]);
    return { allowed: true, ...identity };
  } };
  const sourcePort = Object.fromEntries(['listStreams', 'readThread', 'search'].map(k => [k, async arg => {
    calls.push([k, arg]); return page;
  }]));
  const actionPort = {
    propose: async arg => { calls.push(['propose', arg]); return { state: 'proposed', executionPerformed: false, planRef: 'plan:1' }; },
    status: async () => ({ state: 'uncertain', receipt: { marker: 'MOCK_RECEIPT' } })
  };
  const hub = createProviderHub({ descriptors: [descriptor], sourcePort, worldPort, actionPort, ...overrides });
  return { hub, calls, worldPort, sourcePort, actionPort };
}
const proposal = { providerId: 'messenger', accountRef: 'account:1', accountEpoch: 3,
  threadRef: 'thread:1', recipientRef: 'recipient:1', draftRef: 'draft:1', draftDigest: 'a'.repeat(64), expectedRevision: 'rev:1' };
test('capability registry and bounded source paging retain partial evidence', async () => {
  const { hub, calls } = fixture();
  assert.equal((await hub.listProviders(identity)).providers[0].verification, 'MOCK_ONLY');
  assert.deepEqual((await hub.listStreams(identity, { providerId: 'messenger', kind: 'inbox', limit: 2 })).items, page.items);
  assert.equal((await hub.readThread(identity, { providerId: 'messenger', threadRef: 'thread:1' })).state, 'partial');
  assert.equal((await hub.search(identity, { providerId: 'messenger', query: 'fixture' })).state, 'partial');
  assert.ok(calls.every(([name, arg]) => name !== 'authorize' || arg.accountEpoch === 3));
});
test('denial and account swap stop before source or action ports', async () => {
  const { hub, calls } = fixture({ worldPort: { authorize: async () => ({ ...identity, allowed: false }) } });
  await assert.rejects(hub.listStreams(identity, { providerId: 'messenger', kind: 'inbox' }), { code: 'ACCESS_DENIED' });
  assert.equal(calls.length, 0);
  const other = fixture();
  await assert.rejects(other.hub.proposeAction(identity, { ...proposal, accountEpoch: 4 }), { code: 'ACCOUNT_SWAP' });
  assert.equal(other.calls.filter(([name]) => name === 'propose').length, 0);
});
test('refuses unsupported capabilities, unbounded pages, malicious cursors and invalid queries', async () => {
  const { hub } = fixture({ descriptors: [{ ...descriptor, capabilities: ['streams'] }] });
  await assert.rejects(hub.readThread(identity, { providerId: 'messenger', threadRef: 'thread:1' }), { code: 'CAPABILITY_UNSUPPORTED' });
  await assert.rejects(hub.listStreams(identity, { providerId: 'messenger', kind: 'inbox', limit: 1000 }), { code: 'PAGE_LIMIT_INVALID' });
  await assert.rejects(hub.listStreams(identity, { providerId: 'messenger', kind: 'inbox', cursor: '../bad' }), { code: 'CURSOR_INVALID' });
  await assert.rejects(hub.search(identity, { providerId: 'messenger', query: 'anything' }), { code: 'CAPABILITY_UNSUPPORTED' });
});
test('only inert proposals; uncertain receipt remains uncertain', async () => {
  const { hub, calls } = fixture();
  const out = await hub.proposeAction(identity, proposal);
  assert.equal(out.executionPerformed, false);
  assert.equal(out.state, 'proposed');
  assert.equal((await hub.actionStatus(identity, { providerId: 'messenger', planRef: out.planRef })).state, 'uncertain');
  assert.equal(calls.filter(([name]) => name === 'propose').length, 1);
  await assert.rejects(hub.proposeAction(identity, { ...proposal, approved: true }), { code: 'PROPOSAL_AUTHORITY_INVALID' });
});
test('refuses leaked denied results, excess rows, unsafe action status and nonmock receipts', async () => {
  const bad = fixture({ sourcePort: { listStreams: async () => ({ state: 'denied', items: [{}] }) } });
  await assert.rejects(bad.hub.listStreams(identity, { providerId: 'messenger', kind: 'inbox' }), { code: 'DENIED_DATA_LEAK' });
  const overflow = fixture({ sourcePort: { listStreams: async () => ({ state: 'complete', items: Array(3).fill({}) }) } });
  await assert.rejects(overflow.hub.listStreams(identity, { providerId: 'messenger', kind: 'inbox', limit: 2 }), { code: 'PORT_PAGE_INVALID' });
  const wrong = fixture({ actionPort: { propose: async () => ({ state: 'applied', executionPerformed: true, planRef: 'plan:1' }), status: async () => ({ state: 'applied', receipt: { marker: 'LIVE_RECEIPT' } }) } });
  await assert.rejects(wrong.hub.proposeAction(identity, proposal), { code: 'ACTION_PORT_UNSAFE' });
  await assert.rejects(wrong.hub.actionStatus(identity, { providerId: 'messenger', planRef: 'plan:1' }), { code: 'MOCK_RECEIPT_REQUIRED' });
});
test('live mode never silently falls back to mock', async () => {
  const { hub } = fixture({ mode: HUB_MODE.LIVE, sourcePort: { listStreams: async () => { throw new Error('SOURCE_OFFLINE'); } } });
  await assert.rejects(hub.listStreams(identity, { providerId: 'messenger', kind: 'inbox' }), /SOURCE_OFFLINE/);
  assert.equal(hub.mode, 'LIVE_UNVERIFIED');
});
