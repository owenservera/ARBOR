import { test } from 'node:test';
import assert from 'node:assert/strict';
import { journalReceiptToAsset } from '../data-intelligence/journal-adapter.mjs';

const base = { requestId: 'req-abc', provider: 'chatgpt', submitted: 'yes',
  state: 'complete', requestedModel: 'gpt-test', model: 'gpt-test',
  createdAt: '2026-10-31T18:00:00Z', updatedAt: '2026-10-31T18:00:05Z',
  replyDigest: 'private-response-digest', payloadDigest: 'private-input-digest',
  reason: 'private-error-body', routing: { suggestedModel: 'private-routing-meta' } };

test('journal metadata adapter yields a source-qualified asset without copying secrets or raw evidence', () => {
  const a = journalReceiptToAsset(base, { worldId: 'w1', capturedAt: '2026-10-31T19:00:00Z' });
  assert.equal(a.schema, 'vivim.data-asset/1');
  assert.equal(a.ingressId, 'AI03');
  assert.equal(a.model.observedState, 'verified');
  assert.equal(a.model.observed, 'gpt-test');
  assert.equal(a.model.thinkingObserved, null);
  assert.equal(a.content.digestRef, null);
  assert.equal(a.policy.rights, 'review_required');
  assert.equal(a.policy.grantRef, null);
  assert.equal(a.integrity.captureState, 'observed');
  assert.doesNotMatch(JSON.stringify(a), /private-response-digest|private-input-digest|private-error-body|private-routing-meta/);
  assert.equal(journalReceiptToAsset(base, { worldId: 'w1' }).assetId, a.assetId);
  assert.notEqual(journalReceiptToAsset(base, { worldId: 'w2' }).assetId, a.assetId);
});

test('uncertain/blocked attempts cannot masquerade as verified provider executions', () => {
  const uncertain = journalReceiptToAsset({ ...base, submitted: 'unknown', state: 'uncertain', model: 'unverified-model' });
  assert.equal(uncertain.integrity.captureState, 'uncertain');
  assert.equal(uncertain.model.observedState, 'unverified');
  assert.equal(uncertain.model.observed, null);
  const blocked = journalReceiptToAsset({ ...base, submitted: 'no', state: 'blocked' });
  assert.equal(blocked.model.observed, null);
  assert.equal(blocked.integrity.captureState, 'unverified');
  assert.throws(() => journalReceiptToAsset({ ...base, submitted: 'sent-maybe' }), /Invalid harness journal receipt/);
  assert.throws(() => journalReceiptToAsset({ ...base, requestId: '../escape' }), /Invalid harness journal receipt/);
});
