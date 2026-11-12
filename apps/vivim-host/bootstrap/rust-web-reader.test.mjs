import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createRustWebReader } from './rust-web-reader.mjs';

const installationId = '12345678-1234-4234-8234-123456789012';
const eventId = '22345678-1234-4234-8234-123456789012';
const row = { id: eventId, installationId, site: 'example.org',
  url: 'https://example.org/article', observedAt: '2026-11-04T08:00:00.000Z',
  provenance: 'browser:' + installationId + ':' + eventId,
  cursor: 1, verified: true, source: 'vivim.browser-companion' };
const output = (patch = {}) => ({ schema: 'vivim.web-memory-query/1',
  graphEpoch: 2, cursor: 1, nextCursor: 1, hasMore: false, results: [row], ...patch });
const root = path.resolve('/tmp/vivim-rust-fixture');
const bin = path.resolve('/tmp/hqkg-web-feed');

test('missing Rust executable cannot imply live evidence', async () => {
  const read = createRustWebReader({ dataRoot: root, env: {} });
  await assert.rejects(read(0), { code: 'WEB_RUST_QUERY_UNAVAILABLE' });
});

test('read-only CLI uses shell:false, bounded output and cursor', async () => {
  let saw;
  const read = createRustWebReader({ dataRoot: root,
    env: { VIVIM_WEB_MEMORY_BIN: bin },
    execute: async (file, args, options) => {
      saw = { file, args, options }; return { stdout: JSON.stringify(output()) };
    } });
  const batch = await read(0);
  assert.equal(saw.file, bin);
  assert.deepEqual(saw.args, [
    path.join(root, 'browser-companion', 'web-memory.hqj'), 'query',
    '--after-cursor', '0', '--limit', '32'
  ]);
  assert.equal(saw.options.shell, false);
  assert.equal(saw.options.maxBuffer, 65536);
  assert.equal(batch.authority, 'hqkg');
  assert.equal(batch.items.length, 1);
  assert.equal(batch.items[0].sourceRef, row.provenance);
  assert.equal(batch.cursor, '1');
  assert.equal(batch.coverage, 'complete');
});

test('untrusted Rust source provenance is rejected, never promoted', async () => {
  const read = createRustWebReader({ dataRoot: root,
    env: { VIVIM_WEB_MEMORY_BIN: bin },
    execute: async () => ({ stdout: JSON.stringify(output({ results: [{ ...row, provenance: 'fake' }] })) }) });
  await assert.rejects(read(0), { code: 'WEB_RUST_SOURCE_UNVERIFIED' });
});

test('malformed output and stuck pagination fail closed', async () => {
  for (const body of [
    JSON.stringify(output({ schema: 'other' })),
    JSON.stringify(output({ hasMore: true, nextCursor: 0, results: [] })),
    JSON.stringify(output({ results: Array(33).fill(row) })),
    'not-json'
  ]) {
    const read = createRustWebReader({ dataRoot: root,
      env: { VIVIM_WEB_MEMORY_BIN: bin },
      execute: async () => ({ stdout: body }) });
    await assert.rejects(read(0));
  }
});

test('Rust process failure never fabricates an accepted visit', async () => {
  const read = createRustWebReader({ dataRoot: root,
    env: { VIVIM_WEB_MEMORY_BIN: bin },
    execute: async () => { throw new Error('journal unavailable'); } });
  await assert.rejects(read(0), { code: 'WEB_RUST_QUERY_FAILED' });
});
