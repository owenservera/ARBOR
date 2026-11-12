// Sprint 01 Lane 3 deterministic tests. Synthetic visits are not real owner history.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openLedger } from './ledger.mjs';
import { createWebMemory, projectionId, normalizeRustQuery, readMemoryParams } from './web-memory.mjs';

const install = '12345678-1234-4234-8234-123456789012';
const firstId = '22345678-1234-4234-8234-123456789012';
const secondId = '32345678-1234-4234-8234-123456789012';
const stamp = '2026-11-04T08:00:00.000Z';
const fixture = (items, extra = {}) => ({ schema: 'vivim.web-memory-query/1', authority: 'synthetic',
  cursor: null, items, ...extra });
const visit = (eventId = firstId, url = 'https://example.org/article', observedAt = stamp) =>
  ({ eventId, installationId: install, site: 'example.org', url, observedAt });
function fresh(t, options = {}) {
  const ledger = openLedger({ file: options.file ?? ':memory:' });
  t.after(() => ledger.close());
  const memory = createWebMemory({ ledger, worldId: 'world-local',
    now: options.now ?? (() => '2026-11-04T12:00:00.000Z') });
  return { ledger, memory };
}

test('stable Rust-linked projection ID, duplicate batches and conflicting replay', t => {
  const { memory } = fresh(t);
  const batch = fixture([visit()]);
  assert.equal(projectionId(install, firstId), 'web:visit:' + install + ':' + firstId);
  assert.equal(memory.project(batch).inserted, 1);
  assert.equal(memory.project(batch).duplicates, 1);
  const out = memory.recent({ day: '2026-11-04' });
  assert.equal(out.items.length, 1);
  assert.equal(out.items[0].sourceRef, 'browser:' + install + ':' + firstId);
  assert.equal(out.items[0].trust, 'synthetic_unverified');
  assert.equal(out.coverage, 'synthetic_fixture');
  assert.throws(() => memory.project(fixture([visit(firstId, 'https://example.org/else')])),
    { code: 'WEB_EVIDENCE_CONFLICT' });
  assert.equal(memory.recent({ day: '2026-11-04' }).items.length, 1);
});

test('sensitive URLs reject credentials, query, fragments, mismatched sites and unsafe schemes', () => {
  for (const url of ['https://example.org/?token=secret',
    'https://example.org/article#fragment', 'https://user@example.org/article',
    'https://other.org/article', 'javascript:alert(1)',
    'https://example.org:8443/article']) {
    assert.throws(() => normalizeRustQuery(fixture([visit(firstId, url)]),
      { worldId: 'world-local', now: '2026-11-04T12:00:00.000Z' }),
      { code: 'WEB_URL_UNSAFE' });
  }
  const x = normalizeRustQuery(fixture([visit(firstId, 'https://example.org/reset/someid')]),
    { worldId: 'world-local', now: '2026-11-04T12:00:00.000Z' });
  assert.equal(x.items[0].url, 'https://example.org/');
  assert.equal(x.items[0].reduced, true);
});

test('day and site filters, stable time cursor and small bounded response', t => {
  const { memory } = fresh(t);
  memory.project(fixture([
    visit(firstId, 'https://example.org/earlier', '2026-11-04T07:00:00.000Z'),
    visit(secondId, 'https://example.org/later', '2026-11-04T09:00:00.000Z')
  ]));
  const first = memory.recent({ day: '2026-11-04', site: 'example.org', limit: 1 });
  assert.equal(first.items[0].eventId, secondId);
  assert.ok(first.nextCursor);
  const second = memory.recent({ day: '2026-11-04', site: 'example.org', limit: 1, cursor: first.nextCursor });
  assert.equal(second.items[0].eventId, firstId);
  assert.equal(second.nextCursor, null);
  assert.equal(memory.recent({ day: '2026-11-03' }).items.length, 0);
  assert.equal(memory.recent({ day: '2026-11-04', site: 'other.org' }).items.length, 0);
  assert.throws(() => memory.recent({ limit: 1000 }), { code: 'WEB_LIMIT_INVALID' });
  assert.throws(() => memory.recent({ cursor: '!wrong!' }), { code: 'WEB_PAGE_CURSOR_INVALID' });
  assert.throws(() => readMemoryParams(new URLSearchParams('limit=20&limit=30')),
    { code: 'WEB_FILTER_INVALID' });
});

test('source retraction tombstones cannot be undone by stale replay', t => {
  const { memory } = fresh(t);
  const b = fixture([visit()]);
  memory.project(b);
  const id = projectionId(install, firstId);
  memory.project(fixture([], { retractedIds: [id] }));
  assert.equal(memory.recent({ day: '2026-11-04' }).items.length, 0);
  assert.equal(memory.project(b).retracted, 1);
  assert.equal(memory.recent({ day: '2026-11-04' }).items.length, 0);
});

test('owner opt-out blocks new projection and hides previously observed data', t => {
  const { memory } = fresh(t);
  memory.project(fixture([visit()]));
  assert.deepEqual(memory.setOptOut(true), { optOut: true });
  assert.equal(memory.project(fixture([visit(secondId)])).state, 'disabled');
  assert.equal(memory.recent({ day: '2026-11-04' }).state, 'disabled');
  assert.equal(memory.recent({ day: '2026-11-04' }).items.length, 0);
  memory.setOptOut(false);
  assert.equal(memory.recent({ day: '2026-11-04' }).items.length, 1);
});

test('stale and missing query bridges never claim complete coverage', t => {
  let time = '2026-11-04T12:00:00.000Z';
  const { memory } = fresh(t, { now: () => time });
  assert.equal(memory.recent({ day: '2026-11-04' }).state, 'bridge-unavailable');
  memory.project(fixture([visit()]));
  time = '2026-11-04T12:16:00.000Z';
  const result = memory.recent({ day: '2026-11-04' });
  assert.equal(result.state, 'stale');
  assert.equal(result.coverage, 'synthetic_fixture');
});

test('signed-in context preview requires explicit approval and Rust-backed observed source', t => {
  const { memory } = fresh(t);
  const id = projectionId(install, firstId);
  memory.project(fixture([visit()]));
  const approval = { approved: true, allowWebHistory: true, provider: 'chatgpt', conversationId: 'signed-in-thread' };
  assert.throws(() => memory.contextPreview({ ids: [id], authorization: approval }),
    { code: 'WEB_CONTEXT_SOURCE_UNVERIFIED' });
  assert.throws(() => memory.contextPreview({ ids: [id], authorization: { ...approval, approved: false } }),
    { code: 'WEB_CONTEXT_APPROVAL_REQUIRED' });
  // Synthetic Rust CLI response simulates L1 readback; it is not a device acceptance proof.
  const { memory: rustMemory } = fresh(t);
  rustMemory.project({ ...fixture([{ ...visit(), verified: true }]), authority: 'hqkg' }, { sourceKind: 'rust-cli' });
  const preview = rustMemory.contextPreview({ ids: [id], authorization: approval });
  assert.equal(preview.transmitted, false);
  assert.equal(preview.items.length, 1);
  assert.equal(preview.items[0].sourceRef, 'browser:' + install + ':' + firstId);
});

test('SQLite Host restart rehydrates projection without reimport or duplicate', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'vivim-web-memory-test-'));
  const file = path.join(dir, 'ledger.db');
  try {
    let ledger = openLedger({ file });
    createWebMemory({ ledger, now: () => '2026-11-04T12:00:00.000Z' }).project(fixture([visit()]));
    ledger.close();
    ledger = openLedger({ file });
    const memory = createWebMemory({ ledger, now: () => '2026-11-04T12:00:00.000Z' });
    assert.equal(memory.recent({ day: '2026-11-04' }).items.length, 1);
    assert.equal(memory.project(fixture([visit()])).duplicates, 1);
    ledger.close();
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
