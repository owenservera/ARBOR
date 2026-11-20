// Unit gate for the NEXT:CONSOLIDATE:studio/src/replay lane acceptance:
// "Replay parity on saved session, digest equality and benchmark."
//
// Covers the owned replay/derive.mjs surfaces:
//   - derive @ L30: deterministic native transformation/cache reuse for replay; keeps capture authority.
//   - buildReceipt @ L319: deterministic receipt; keeps receipt authority.
//
// These are pure over the session's raw log + kv: no browser, no Host effect, no second persistence
// owner. Re-deriving the same saved session must write an identical receipt (digest equality).
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { derive, buildReceipt } from '../../src/replay/derive.mjs';
import { StreamReducer } from '../../src/replay/reducer.mjs';
import { Session } from '../../src/store/session.mjs';

// ---- buildReceipt: deterministic receipt (digest equality) -----------------

function makeReducer() {
  const r = new StreamReducer();
  r.ingest({ k: 'run.start', t: 1000 });
  r.ingest({ k: 'req', sid: 's1', url: 'https://example.com/api', method: 'GET', t: 1001 });
  r.ingest({ k: 'res', sid: 's1', status: 200, mime: 'application/json', t: 1002 });
  r.ingest({ k: 'stream.armed', sid: 's1', mode: 'stream', t: 1003 });
  const b = Buffer.from(JSON.stringify({ ok: true }));
  r.ingest({ k: 'chunk', sid: 's1', b64: b.toString('base64'), t: 1004 });
  r.ingest({ k: 'done', sid: 's1', t: 1005 });
  return r;
}

const sessionMeta = {
  id: 'sess-determinism',
  createdAt: '2026-01-01T00:00:00.000Z',
  os: 'Windows 10',
  browser: 'Chrome 120',
  collector: { sourceSha: 'test-sha' },
  profile: { name: 'test', version: '1' },
  target: { url: 'https://example.com/' },
};

test('buildReceipt produces a deterministic receipt with no wall-clock dependency', () => {
  const session = { meta: sessionMeta };
  const reducer = makeReducer();
  const summary = reducer.summary();
  const a = buildReceipt(session, reducer, summary);
  // Re-run after a turn: if Date.now() were used, date_utc would drift and deepEqual would fail.
  assert.deepEqual(buildReceipt(session, reducer, summary), a);
  assert.equal(a.date_utc, '2026-01-01T00:00:00.000Z');
  assert.equal(a.verdict, 'A1_RAW_CAPTURE_VIABLE');
  assert.equal(a.transport_counts.HTTP, 1);
});

test('buildReceipt falls back deterministically when createdAt and run time are absent', () => {
  const session = { meta: { id: 'sess-no-time' } };
  const reducer = new StreamReducer();
  const a = buildReceipt(session, reducer, reducer.summary());
  assert.equal(a.date_utc, '1970-01-01T00:00:00.000Z');
});

// ---- derive: replay parity on a saved session ------------------------------

async function makeSessionWithRecords(dir) {
  const s = Session.create(dir, { site: 'example' });
  s.meta.os = 'Windows 10';
  s.meta.browser = 'Chrome 120';
  s.meta.collector = { sourceSha: 'test-sha' };
  s.meta.profile = { name: 'test', version: '1' };
  s.meta.target = { url: 'https://example.com/' };
  s.saveMeta();
  const raw = s.raw;
  raw.append({ k: 'run.start', t: 1000 });
  raw.append({ k: 'req', sid: 's1', url: 'https://example.com/api', method: 'GET', t: 1001 });
  raw.append({ k: 'res', sid: 's1', status: 200, mime: 'application/json', t: 1002 });
  raw.append({ k: 'stream.armed', sid: 's1', mode: 'stream', t: 1003 });
  const b = Buffer.from(JSON.stringify({ ok: true }));
  raw.append({ k: 'chunk', sid: 's1', b64: b.toString('base64'), t: 1004 });
  raw.append({ k: 'done', sid: 's1', t: 1005 });
  await raw.close();
  return s;
}

function receiptDigest(receipt) {
  // Canonical stable digest of the receipt for equality comparison across replays.
  return JSON.stringify(receipt, Object.keys(receipt).sort());
}

test('derive replay parity: re-deriving a saved session writes an identical receipt', async (t) => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'replay-derive-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const session = await makeSessionWithRecords(root);

  const profile = {};
  const first = await derive(session, profile);
  const firstReceipt = session.kv.get('RECEIPT');
  const firstDigest = receiptDigest(firstReceipt);

  // Second derivation of the same saved session must be byte-identical (digest equality).
  const second = await derive(session, profile);
  const secondReceipt = session.kv.get('RECEIPT');
  const secondDigest = receiptDigest(secondReceipt);

  assert.equal(secondDigest, firstDigest);
  assert.equal(second.receipt.verdict, first.receipt.verdict);
  assert.equal(second.receipt.raw_chunks_received, first.receipt.raw_chunks_received);
  assert.equal(second.receipt.raw_bytes_received, first.receipt.raw_bytes_received);
  assert.equal(second.records, first.records);
  assert.ok(firstReceipt);
  assert.ok(firstReceipt.date_utc);
});
