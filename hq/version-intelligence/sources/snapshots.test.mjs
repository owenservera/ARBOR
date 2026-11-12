import test from 'node:test';
import assert from 'node:assert/strict';
import { resolvePin, snapshotAt, verifyPin, readPinnedBlob, manifestDigestOf } from './snapshots.mjs';
import { syntheticSource, SYNTHETIC_SHAS } from './fixtures.mjs';
import { gitBlobSha, safePath } from './common.mjs';

const scope = (f, overrides = {}) => ({ ...f.scope, ...overrides });
const pin = (f, overrides = {}) => resolvePin(scope(f, overrides), {
  adapter: f.adapter, authorize: f.authorize, acquiredAt: '2026-11-12T00:00:00.000Z',
});
const snapshot = (f, p, overrides = {}) => snapshotAt(p, {
  adapter: f.adapter, authorize: f.authorize, ...overrides,
});

test('T01 immutable branch pin, frozen root tree and strict 40hex identity', async () => {
  const f = syntheticSource();
  const p = await pin(f);
  assert.equal(p.resolvedCommitSha, SYNTHETIC_SHAS.v1);
  assert.equal(p.rootTreeSha, '1'.repeat(40));
  assert.equal(p.scope, 'development');
  assert.equal(p.completeness, 'partial');
  assert.equal(await verifyPin(p, { adapter: f.adapter, authorize: f.authorize }), true);
  assert(Object.isFrozen(p));
  await assert.rejects(pin(f, { sha: 'not-a-sha', ref: null }), { code: 'PIN_NOT_FOUND' });
  await assert.rejects(pin(f, { ref: 'missing' }), { code: 'PIN_NOT_FOUND' });
});

test('T02 same repo at three SHAs and same repo name in separate namespaces', async () => {
  const f = syntheticSource();
  const pins = await Promise.all(['v1', 'v2', 'v3'].map(ref => pin(f, { ref })));
  assert.equal(new Set(pins.map(p => p.pinId)).size, 3);
  assert.equal(new Set(pins.map(p => p.repoIdentity)).size, 1);
  const other = await pin(f, { ref: 'v1', repo: 'Other/ARBOR' });
  assert.notEqual(other.pinId, pins[0].pinId);
  const sub = await pin(f, { ref: 'v1', subPath: 'src' });
  assert.notEqual(sub.pinId, pins[0].pinId);
});

test('T04/T05 pinned manifests ignore dirty worktree, repeat, input order and paginate', async () => {
  const a = syntheticSource(), b = syntheticSource({ flipped: true });
  const pa = await pin(a), pb = await pin(b);
  const ma = await snapshot(a, pa, { limits: { pageSize: 2 } });
  const mb = await snapshot(b, pb, { limits: { pageSize: 2 } });
  assert.equal(ma.completeness, 'complete');
  assert.equal(ma.manifestDigest, mb.manifestDigest);
  assert.equal(ma.manifestDigest, manifestDigestOf(ma));
  assert(ma.entries.length >= 6);
  assert(a.calls.tree.length >= 3);
  assert.deepEqual(a.calls.refs, ['main']); // snapshot never resolves HEAD again
  assert.equal(ma.entries.some(e => e.path === 'UNTRACKED_DIRTY.mjs'), false);
});

test('T07 inspect real Git blob bytes for symlink, LFS pointer and binary', async () => {
  const f = syntheticSource();
  const p = await pin(f);
  const m = await snapshot(f, p, { inspectContent: true });
  const byPath = name => m.entries.find(e => e.path === name);
  assert.equal(byPath('links/outside').kind, 'symlink');
  assert.equal(byPath('links/outside').symlinkTarget, '../../private');
  assert.equal(byPath('assets/big.dat').parseStatus, 'lfs_pointer');
  assert.equal(byPath('assets/binary.bin').parseStatus, 'binary');
  assert.equal(byPath('.env.production').excludedReason, 'sensitive_path');
  assert(!f.calls.blobs.includes(byPath('.env.production').blobSha));
  await assert.rejects(readPinnedBlob(p, '.env.production', {
    adapter: f.adapter, authorize: f.authorize, manifest: m,
  }), { code: 'SOURCE_UNAUTHORIZED' });
  await assert.rejects(readPinnedBlob(p, 'links/outside', {
    adapter: f.adapter, authorize: f.authorize, manifest: m,
  }), { code: 'SOURCE_UNAUTHORIZED' });
  const bytes = await readPinnedBlob(p, 'src/first.mjs', {
    adapter: f.adapter, authorize: f.authorize, manifest: m,
  });
  assert.equal(gitBlobSha(bytes), byPath('src/first.mjs').blobSha);
});

test('T07 submodule gitlink is metadata, never followed', async () => {
  const f = syntheticSource();
  const p = await pin(f, { ref: 'v2' });
  const m = await snapshot(f, p, { inspectContent: true });
  const sub = m.entries.find(e => e.path === 'vendor/submodule');
  assert.equal(sub.kind, 'submodule');
  assert.equal(sub.parseStatus, 'gitlink_only');
});

test('T17 deny unapproved provider/scope and unsafe ref or path', async () => {
  const f = syntheticSource();
  await assert.rejects(pin(f, { approvedScope: 'personal' }), { code: 'SOURCE_UNAUTHORIZED' });
  await assert.rejects(resolvePin(f.scope, { adapter: f.adapter }), { code: 'SOURCE_UNAUTHORIZED' });
  await assert.rejects(pin(f, { ref: '--upload-pack=evil' }), { code: 'SOURCE_UNAUTHORIZED' });
  await assert.rejects(pin(f, { ref: '../secret' }), { code: 'SOURCE_UNAUTHORIZED' });
  await assert.rejects(pin(f, { subPath: '../outside' }), { code: 'SCOPE_ESCAPE' });
  await assert.rejects(pin(f, { provider: 'ambient-browser' }), { code: 'SOURCE_UNAUTHORIZED' });
  assert.throws(() => safePath('folder/../../oops'), { code: 'SCOPE_ESCAPE' });
  const p = await pin(f);
  await assert.rejects(snapshotAt(p, { adapter: f.adapter, authorize: () => false }), { code: 'SOURCE_UNAUTHORIZED' });
});

test('T17 injected adversarial Git tree path fails closed', async () => {
  const f = syntheticSource({ malicious: { path: '../outside', type: 'blob',
    mode: '100644', sha: 'e'.repeat(40), size: 1 } });
  const p = await pin(f);
  await assert.rejects(snapshot(f, p), { code: 'SCOPE_ESCAPE' });
});

test('T19 exact bounds, pagination truncation and subPath', async () => {
  const f = syntheticSource();
  const p = await pin(f);
  const m = await snapshot(f, p, { limits: { maxEntries: 2, pageSize: 2 } });
  assert.equal(m.completeness, 'partial');
  assert.equal(m.truncated, true);
  assert.equal(m.observedEntries, 2);
  assert(m.omittedMinimum >= 1);
  assert(m.errors.some(e => e.code === 'RESOURCE_LIMIT'));
  const onlySrc = await pin(f, { subPath: 'src' });
  const srcManifest = await snapshot(f, onlySrc);
  assert(srcManifest.entries.every(e => e.path.startsWith('src/')));
});

test('T20 moved ref rejected, pinned original commit still readable', async () => {
  const f = syntheticSource();
  const p = await pin(f);
  f.refTable.set('main', SYNTHETIC_SHAS.v2);
  await assert.rejects(verifyPin(p, { adapter: f.adapter, authorize: f.authorize }), { code: 'PIN_MOVED' });
  const old = await snapshot(f, p);
  assert.equal(old.resolvedCommitSha, SYNTHETIC_SHAS.v1);
  const tampered = { ...old, entries: [...old.entries, { ...old.entries[0], mode: 'evil' }] };
  await assert.rejects(verifyPin(old.pin, { adapter: f.adapter, authorize: f.authorize,
    checkRef: false, manifest: tampered }), { code: 'DIGEST_CONFLICT' });
});

test('T20 missing/rebased tree and corrupted blob fail closed', async () => {
  const f = syntheticSource();
  const p = await pin(f);
  f.commits.set(SYNTHETIC_SHAS.v1, 'f'.repeat(40));
  await assert.rejects(snapshot(f, p), { code: 'PIN_MOVED' });
  f.commits.set(SYNTHETIC_SHAS.v1, p.rootTreeSha);
  const m = await snapshot(f, p);
  const original = f.adapter.readBlob;
  const corrupt = { ...f.adapter, readBlob: async i => {
    if (i.blobSha === m.entries.find(e => e.path === 'src/first.mjs').blobSha) return Buffer.from('CORRUPT');
    return original(i);
  }};
  await assert.rejects(readPinnedBlob(p, 'src/first.mjs', {
    adapter: corrupt, authorize: f.authorize, manifest: m,
  }), { code: 'DIGEST_CONFLICT' });
});

test('T24 source paths are inert data; no scripts, provider calls or checkout', async () => {
  const f = syntheticSource();
  const p = await pin(f);
  const m = await snapshot(f, p);
  assert.equal(m.entries.some(e => e.path.includes('src/')), true);
  assert.equal(f.calls.blobs.length, 0); // metadata scan does not even read blob contents
});
