import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';
import { createGitObjectStoreAdapter } from './adapters.mjs';
import { resolvePin, snapshotAt, readPinnedBlobs, manifestDigestOf } from './snapshots.mjs';

async function fixture(t, subPath = '') {
  const gitDir = mkdtempSync(join(tmpdir(), 'hvi-batch-'));
  t.after(() => rmSync(gitDir, { recursive: true, force: true }));
  mkdirSync(join(gitDir, 'objects'));
  const object = (type, body) => {
    const raw = Buffer.concat([Buffer.from(`${type} ${body.length}\0`), body]);
    const sha = createHash('sha1').update(raw).digest('hex');
    const dir = join(gitDir, 'objects', sha.slice(0, 2));
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, sha.slice(2)), deflateSync(raw));
    return sha;
  };
  const entry = (mode, name, sha) => Buffer.concat([Buffer.from(`${mode} ${name}\0`), Buffer.from(sha, 'hex')]);
  const a = object('blob', Buffer.from('alpha'));
  const b = object('blob', Buffer.from('beta'));
  const secret = object('blob', Buffer.from('fixture-only'));
  const src = object('tree', Buffer.concat([entry('100644', 'a.txt', a), entry('100644', 'b.txt', b)]));
  const tree = object('tree', Buffer.concat([entry('100644', '.env.fixture', secret),
    entry('120000', 'link', a), entry('40000', 'src', src)]));
  const sha = object('commit', Buffer.from(`tree ${tree}\nauthor Fixture <fixture@example.invalid> 0 +0000\ncommitter Fixture <fixture@example.invalid> 0 +0000\n\nfixture\n`));
  writeFileSync(join(gitDir, 'HEAD'), `${sha}\n`);
  const raw = createGitObjectStoreAdapter({ gitDir });
  let reads = 0;
  const adapter = { ...raw, readBlob: async input => { reads++; return raw.readBlob(input); } };
  const authorize = async () => true;
  const pin = await resolvePin({ provider: 'github', repo: 'fixture/repo', sha, subPath,
    approvedScope: 'development', sourceGrantRef: 'fixture-grant' }, { adapter, authorize });
  const manifest = await snapshotAt(pin, { adapter, authorize });
  return { pin: manifest.pin, manifest, adapter, authorize, a, b, sha, reads: () => reads };
}
const code = expected => error => error.code === expected;
const options = f => ({ adapter: f.adapter, manifest: f.manifest, authorize: f.authorize });

test('reads actual immutable Git objects in request order with per-file and source proofs', async t => {
  const f = await fixture(t);
  const result = await readPinnedBlobs(f.pin, ['src/b.txt', 'src/a.txt'], options(f));
  assert.equal(result.resolvedCommitSha, f.sha);
  assert.equal(result.manifestDigest, f.manifest.manifestDigest);
  assert.equal(result.totalBytes, 9);
  assert.deepEqual(result.files.map(x => [x.path, x.blobSha, x.bytes.toString()]),
    [['src/b.txt', f.b, 'beta'], ['src/a.txt', f.a, 'alpha']]);
  assert.equal(f.reads(), 2);
});
test('preflight rejects sensitive, missing, symlink, duplicate and traversal paths before object reads', async t => {
  const f = await fixture(t);
  for (const [path, expected] of [['.env.fixture', 'SOURCE_UNAUTHORIZED'], ['missing', 'SOURCE_UNAUTHORIZED'],
    ['link', 'SOURCE_UNAUTHORIZED'], ['src/a.txt', 'ID_CONFLICT'], ['../x', 'SCOPE_ESCAPE']])
    await assert.rejects(readPinnedBlobs(f.pin, ['src/a.txt', path], options(f)), code(expected));
  assert.equal(f.reads(), 0);
});
test('subpath and sealed manifest enforced', async t => {
  const f = await fixture(t, 'src');
  await assert.rejects(readPinnedBlobs(f.pin, ['link'], options(f)), code('SOURCE_UNAUTHORIZED'));
  await assert.rejects(readPinnedBlobs({ ...f.pin, manifestDigest: null }, ['src/a.txt'], options(f)), code('ID_CONFLICT'));
  const changed = { ...f.manifest, entries: f.manifest.entries.slice(1) };
  changed.manifestDigest = manifestDigestOf(changed);
  await assert.rejects(readPinnedBlobs(f.pin, ['src/a.txt'], { ...options(f), manifest: changed }), code('DIGEST_CONFLICT'));
  assert.equal(f.reads(), 0);
});
test('aggregate and per-file caps fail closed even for unknown tree-entry sizes', async t => {
  const f = await fixture(t);
  await assert.rejects(readPinnedBlobs(f.pin, ['src/a.txt', 'src/b.txt'], { ...options(f), maxTotalBytes: 8 }), code('RESOURCE_LIMIT'));
  await assert.rejects(readPinnedBlobs(f.pin, ['src/a.txt'], { ...options(f), maxBytesPerFile: 4 }), code('RESOURCE_LIMIT'));
  await assert.rejects(readPinnedBlobs(f.pin, Array(17).fill('src/a.txt'), options(f)), code('RESOURCE_LIMIT'));
});
test('path-specific denial preflights before any bytes and revocation after a read suppresses the batch', async t => {
  const f = await fixture(t);
  await assert.rejects(readPinnedBlobs(f.pin, ['src/a.txt', 'src/b.txt'], { ...options(f), authorize: async ctx => ctx.path !== 'src/b.txt' }), code('SOURCE_UNAUTHORIZED'));
  assert.equal(f.reads(), 0);
  await assert.rejects(readPinnedBlobs(f.pin, ['src/a.txt', 'src/b.txt'], { ...options(f), authorize: async ctx => !(ctx.path === 'src/a.txt' && f.reads() >= 2) }), code('SOURCE_UNAUTHORIZED'));
  assert.equal(f.reads(), 2);
});
test('cancellation after object I/O prevents disclosure', async t => {
  const f = await fixture(t);
  const controller = new AbortController();
  const adapter = { ...f.adapter, readBlob: async input => { const result = await f.adapter.readBlob(input); controller.abort(); return result; } };
  await assert.rejects(readPinnedBlobs(f.pin, ['src/a.txt', 'src/b.txt'], { ...options(f), adapter, signal: controller.signal }), code('RESOURCE_LIMIT'));
  assert.equal(f.reads(), 1);
});
