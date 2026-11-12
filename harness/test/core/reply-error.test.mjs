import test from 'node:test'; import assert from 'node:assert/strict';
import { readReply } from '../../src/core/reply.mjs';
import { digestPayload } from '../../src/core/journal.mjs';
test('readReply stops on a provider error text with no new reply', async () => {
  const rec = { boundary:{ assistantTurns:0 } }; const ups = [];
  const journal = { read: async () => rec, update: async (_, u) => ups.push(u) };
  const page = { evaluate: async () => ({ text:'', streaming:false, count:0, error:'Model is currently at capacity' }) };
  const r = await readReply({ page, provider:{}, journal, requestId:'x', timeoutMs:5000 });
  assert.equal(r.error, 'Model is currently at capacity'); assert.equal(r.complete, false);
  assert.equal(ups[0].reason, 'PROVIDER_ERROR');
});

for (const text of ['', ' \t\n\u00a0']) test(`empty reply ${JSON.stringify(text)} is not complete or digested`, async () => {
  const updates = [];
  const journal = { read: async () => ({ boundary: { assistantTurns: 0 } }), update: async (_, patch) => updates.push(patch) };
  const page = { evaluate: async () => ({ text, streaming: false, count: 1 }) };
  const reply = await readReply({ page, provider: {}, journal, requestId: 'x', timeoutMs: 0, stableSamples: 1 });
  assert.equal(reply.complete, false); assert.equal(reply.digest, null); assert.deepEqual(updates, []);
});

test('whitespace does not hide a provider error', async () => {
  const updates = [];
  const journal = { read: async () => ({ boundary: { assistantTurns: 0 } }), update: async (_, patch) => updates.push(patch) };
  const page = { evaluate: async () => ({ text: ' \n', streaming: false, count: 1, error: 'capacity' }) };
  const reply = await readReply({ page, provider: {}, journal, requestId: 'x', timeoutMs: 0, stableSamples: 1 });
  assert.equal(reply.error, 'capacity'); assert.equal(reply.complete, false); assert.equal(reply.digest, null);
  assert.deepEqual(updates, [{ reason: 'PROVIDER_ERROR' }]);
});

test('nonempty reply preserves its original text and digest', async () => {
  const updates = [];
  const journal = { read: async () => ({ boundary: { assistantTurns: 0 } }), update: async (_, patch) => updates.push(patch) };
  const text = '  answer\n';
  const page = { evaluate: async () => ({ text, streaming: false, count: 1 }) };
  const reply = await readReply({ page, provider: {}, journal, requestId: 'x', timeoutMs: 0, stableSamples: 1 });
  assert.equal(reply.complete, true); assert.equal(reply.text, text); assert.equal(reply.digest, digestPayload(text));
  assert.deepEqual(updates, [{ replyDigest: digestPayload(text) }]);
});
