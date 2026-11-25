import { test } from 'node:test';
import assert from 'node:assert/strict';
import { digest, SOURCE_SCHEMA, MANIFEST_SCHEMA } from './common.mjs';
import { queryPinnedEntries, manifestDigestOf } from './snapshots.mjs';

function fixture(subPath = '') {
  const pin = { schema: SOURCE_SCHEMA, provider: 'github', scope: 'development', repoIdentity: 'fixture/repo',
    resolvedCommitSha: 'a'.repeat(40), rootTreeSha: 'b'.repeat(40), subPath, sourceGrantRef: 'fixture-grant' };
  pin.pinId = digest({ provider: pin.provider, repoIdentity: pin.repoIdentity,
    commitSha: pin.resolvedCommitSha, subPath });
  const entry = (path, kind = 'file') => ({ path, kind, mode: kind === 'file' ? '100644' : '120000',
    blobSha: 'c'.repeat(40), bytes: 4, parseStatus: 'uninspected', symlinkTarget: 'omit' });
  const manifest = { schema: MANIFEST_SCHEMA, pinId: pin.pinId, repoIdentity: pin.repoIdentity,
    resolvedCommitSha: pin.resolvedCommitSha, rootTreeSha: pin.rootTreeSha, subPath,
    completeness: 'complete', entries: [entry('src/b.rs'), entry('src/a.rs'), entry('src/.env'),
      entry('src/link', 'symlink'), entry('src2/other.rs')] };
  manifest.manifestDigest = pin.manifestDigest = manifestDigestOf(manifest);
  const adapter = { authorizedDevelopmentSource: true, resolveRef: async () => null,
    readCommit: async () => ({ sha: pin.resolvedCommitSha, treeSha: pin.rootTreeSha }),
    listTree: async () => assert.fail('unexpected tree read'), readBlob: async () => assert.fail('unexpected blob read') };
  return { pin, manifest, adapter, authorize: async () => true };
}
const run = (f, query, overrides = {}) => queryPinnedEntries(f.pin, query, { ...f, ...overrides });
const paths = page => page.entries.map(e => e.path);
test('prefix and literal path search give stable bounded pages without reading content', async () => {
  const f = fixture();
  const a = await run(f, { prefix: 'src', contains: '.RS', limit: 1 });
  assert.deepEqual(paths(a), ['src/a.rs']); assert.equal(a.nextAfter, 'src/a.rs');
  const b = await run(f, { prefix: 'src', contains: '.RS', limit: 1, after: a.nextAfter });
  assert.deepEqual(paths(b), ['src/b.rs']);
  const c = await run(f, { prefix: 'src', contains: '.RS', limit: 1, after: b.nextAfter });
  assert.deepEqual(paths(c), []); assert.equal(c.nextAfter, null);
  assert.equal(a.manifestDigest, f.pin.manifestDigest);
});
test('exact inspection returns allowlisted metadata, never symlink destination', async () => {
  const f = fixture();
  const page = await run(f, { exactPath: 'src/link' });
  assert.deepEqual(paths(page), ['src/link']);
  assert.equal(page.entries[0].kind, 'symlink');
  assert.equal(Object.hasOwn(page.entries[0], 'symlinkTarget'), false);
  assert.deepEqual(paths(await run(f, { exactPath: 'src/absent' })), []);
});
test('sensitive names and prefix escapes never appear', async () => {
  const f = fixture('src');
  assert.deepEqual(paths(await run(f, {})), ['src/a.rs', 'src/b.rs', 'src/link']);
  await assert.rejects(run(f, { exactPath: 'src/.env' }), { code: 'SOURCE_UNAUTHORIZED' });
  await assert.rejects(run(f, { prefix: 'src2' }), { code: 'SOURCE_UNAUTHORIZED' });
  await assert.rejects(run(f, { prefix: '../src' }), { code: 'SCOPE_ESCAPE' });
});
test('denied path and revoked source grant fail without partial result', async () => {
  const f = fixture();
  await assert.rejects(run(f, {}, { authorize: async ctx => ctx.path !== 'src/b.rs' }), { code: 'SOURCE_UNAUTHORIZED' });
  let checks = 0;
  await assert.rejects(run(f, { exactPath: 'src/a.rs' }, { authorize: async () => ++checks < 3 }), { code: 'SOURCE_UNAUTHORIZED' });
});
test('sealed manifest and current tree must agree', async () => {
  const f = fixture();
  const modified = { ...f.manifest, entries: f.manifest.entries.slice(1) };
  modified.manifestDigest = manifestDigestOf(modified);
  await assert.rejects(run(f, {}, { manifest: modified }), { code: 'DIGEST_CONFLICT' });
  await assert.rejects(run(f, {}, { adapter: { ...f.adapter, readCommit: async () => null } }), { code: 'PIN_MOVED' });
});
test('invalid query, cancellation and manifest mutation during authorization refuse', async () => {
  const f = fixture();
  await assert.rejects(run(f, { limit: 101 }), { code: 'RESOURCE_LIMIT' });
  await assert.rejects(run(f, { exactPath: 'src/a.rs', contains: 'a' }), { code: 'RESOURCE_LIMIT' });
  await assert.rejects(run(f, { command: 'not supported' }), { code: 'RESOURCE_LIMIT' });
  const controller = new AbortController();
  await assert.rejects(run(f, {}, { signal: controller.signal, authorize: async () => { controller.abort(); return true; } }), { code: 'RESOURCE_LIMIT' });
  await assert.rejects(run(f, {}, { authorize: async ctx => { if (ctx.path) f.manifest.entries.pop(); return true; } }), { code: 'DIGEST_CONFLICT' });
});
