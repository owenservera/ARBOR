// Unit gate for VERIFY:D06-B-ALTERNATE-SEND-AUTHORITY.
//
// Covers studio/src/studio/bootstrap-owner-adapter.mjs :: createStudioBootstrapOwnerAdapter -> dispatch.
//
// The bootstrap adapter is the alternate send authority: it sends through Studio's existing
// conversation port (Host custody, never a native direct browser), after Host authorization
// (verifyOwner / verifyApproval) and evidence binding (turnKey / conversationId / targetId /
// promptDigest). This test proves revoked data is excluded: a revoked request never reaches the
// single Studio submit.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createStudioBootstrapOwnerAdapter } from '../../src/studio/bootstrap-owner-adapter.mjs';

// Matches the adapter's own sha(): bare lowercase hex (no 'sha256:' prefix).
const digest = (text) => createHash('sha256').update(text, 'utf8').digest('hex');

const packet = () => {
  const prompt = 'bootstrap probe';
  return {
    schema: 'vivim.bootstrap-dispatch/1',
    provider: 'chatgpt',
    thread: 'new',
    worldId: 'w-1',
    generationId: 'g-1',
    requestId: 'req-bootstrap-1',
    pass: 'D06',
    authorizationRef: 'appr-1',
    prompt,
    promptDigest: digest(prompt),
  };
};

const validApproval = (overrides = {}) => ({
  ownerApproved: true,
  scope: 'full-bootstrap',
  source: 'owner',
  approvalRef: 'appr-1',
  worldId: 'w-1',
  generationId: 'g-1',
  requestId: 'req-bootstrap-1',
  provider: 'chatgpt',
  pass: 'D06',
  promptDigest: digest('bootstrap probe'),
  expiresAt: new Date(Date.now() + 3600_000).toISOString(),
  ...overrides,
});

function conversationSpy() {
  const calls = { create: [], submit: [], get: [] };
  return {
    calls,
    create: async () => { calls.create.push(true); return { id: 'c-1', revision: 1, binding: { targetId: 't-1' }, state: 'ready' }; },
    submit: async (id, body) => { calls.submit.push({ id, body }); },
    get: async () => null,
  };
}

function bindingStore() {
  const records = new Map();
  return {
    read: (id) => records.get(id) ?? null,
    reserve: (record) => { if (records.has(record.requestId)) return false; records.set(record.requestId, record); return true; },
    update: (record) => { records.set(record.requestId, record); },
  };
}

test('revoked request is excluded: no Studio create or submit, state revoked', async () => {
  const conversation = conversationSpy();
  const store = bindingStore();
  let isRevokedCalls = 0;
  const revocations = {
    async isRevoked(requestId) { isRevokedCalls++; return requestId === 'req-bootstrap-1'; },
  };
  const adapter = createStudioBootstrapOwnerAdapter({
    conversation, store,
    verifyOwner: async () => true,
    verifyApproval: async () => validApproval(),
    revocations,
  });
  const result = await adapter.dispatch(packet());
  assert.equal(result.state, 'revoked');
  assert.equal(result.submitted, 'no');
  assert.equal(result.reason, 'REVOKED');
  assert.equal(isRevokedCalls, 1); // checked immediately before the send
  assert.equal(conversation.calls.create.length, 0); // no conversation opened for revoked data
  assert.equal(conversation.calls.submit.length, 0); // no submit: revoked data never sends
});

test('non-revoked request proceeds to the single Studio submit', async () => {
  const conversation = conversationSpy();
  const store = bindingStore();
  const revocations = { async isRevoked() { return false; } };
  const adapter = createStudioBootstrapOwnerAdapter({
    conversation, store,
    verifyOwner: async () => true,
    verifyApproval: async () => validApproval(),
    revocations,
  });
  const result = await adapter.dispatch(packet());
  assert.equal(conversation.calls.create.length, 1);
  assert.equal(conversation.calls.submit.length, 1);
  assert.equal(conversation.calls.submit[0].body.key, 'bootstrap-req-bootstrap-1');
  assert.equal(conversation.calls.submit[0].body.confirm, true);
  // Not revoked, so the adapter did not short-circuit to the revoked receipt.
  assert.notEqual(result.state, 'revoked');
});
