import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync,
  symlinkSync, unlinkSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDevIntelligence } from '../lib/arbor-service.mjs';

function fixture(run) {
  const tmp = mkdtempSync(join(tmpdir(), 'arbor-dev-boundary-'));
  const source = join(tmp, 'source');
  const dataDir = join(tmp, 'data');
  const privateWorld = join(tmp, 'private-world');
  mkdirSync(source);
  mkdirSync(privateWorld);
  writeFileSync(join(source, 'example.mjs'),
    'export function uniqueBoundarySignal() { return "PUBLIC_CODE"; }\n');
  writeFileSync(join(privateWorld, 'personal.txt'), 'PERSONAL_WORLD_SENTINEL');
  try { return run({ tmp, source, dataDir, privateWorld }); }
  finally { rmSync(tmp, { recursive: true, force: true }); }
}

test('explicit mode and Host callback are mandatory', () => fixture(({ source, dataDir }) => {
  assert.throws(() => createDevIntelligence({ dataDir, approvedRoots: [source] }), /HQ_MODE_REQUIRED/);
  assert.throws(() => createDevIntelligence({ dataDir, approvedRoots: [source], mode: 'host' }),
    /HQ_HOST_AUTHORITY_REQUIRED/);
  const seen = [];
  let allow = true;
  const api = createDevIntelligence({
    dataDir, approvedRoots: [source], mode: 'host',
    actorId: 'host-actor', sessionId: 'host-session',
    authorize: request => { seen.push(request); return allow; },
  });
  api.registerSource({ name: 'fixture', path: source });
  api.index();
  assert.ok(api.search({ query: 'uniqueBoundarySignal' }).total >= 1);
  allow = false;
  assert.throws(() => api.search({ query: 'uniqueBoundarySignal' }), /HQ_HOST_PERMISSION_DENIED/);
  assert.ok(seen.some(x => x.operation === 'source.index' && x.actorId === 'host-actor'
    && x.sessionId === 'host-session' && x.domain === 'development'
    && x.sourceId.startsWith('dev-source:')));
}));

test('index, source evidence and semantic read port have explicit revision/freshness', () => fixture(({ source, dataDir }) => {
  const api = createDevIntelligence({ mode: 'diagnostic', dataDir, approvedRoots: [source] });
  const identity = api.registerSource({ name: 'fixture', path: source }).sourceId;
  api.index();
  const first = api.sourceEvidence({ project: 'fixture', path: 'example.mjs' });
  assert.equal(first.schema, 'arbor.dev-source-evidence/1');
  assert.equal(first.status, 'indexed');
  assert.equal(first.devSourceId, identity);
  assert.equal(first.indexedHash, first.currentHash);
  assert.equal(api.indexWatermarks()[0].sourceId, identity);
  assert.ok(api.graph({ kind: 'projects' }));
  assert.ok(api.context({ task: 'uniqueBoundarySignal', project: 'fixture' }).sources.length > 0);
  writeFileSync(join(source, 'example.mjs'), 'export function uniqueBoundarySignal() { return "CHANGED"; }\n');
  const stale = api.sourceEvidence({ project: 'fixture', path: 'example.mjs' });
  assert.equal(stale.status, 'stale');
  assert.notEqual(stale.indexedHash, stale.currentHash);
  api.index({ force: true });
  assert.equal(api.sourceEvidence({ project: 'fixture', path: 'example.mjs' }).status, 'indexed');
  assert.throws(() => api.sourceEvidence({ project: 'fixture', path: '../personal.txt' }),
    /HQ_INVALID_RELATIVE_PATH/);
  assert.throws(() => api.sourceEvidence({ project: 'fixture', path: 'C:\\private\\file' }),
    /HQ_INVALID_RELATIVE_PATH/);
}));

test('bundle supplied absolute path cannot override indexed source scope', () => fixture(({ source, dataDir, privateWorld }) => {
  const api = createDevIntelligence({ mode: 'diagnostic', dataDir, approvedRoots: [source] });
  api.registerSource({ name: 'fixture', path: source });
  api.index();
  const bundle = api.context({ task: 'uniqueBoundarySignal', project: 'fixture' });
  assert.ok(bundle.sources.length);
  assert.equal(api.verifyContext(bundle).valid, true);
  const poisoned = { ...bundle, sources: bundle.sources.map(item => ({
    ...item, absPath: join(privateWorld, 'personal.txt'),
  })) };
  assert.equal(api.verifyContext(poisoned).valid, true);
  assert.throws(() => api.verifyContext({
    ...bundle, sources: [{ ...bundle.sources[0], path: '../private-world/personal.txt' }],
  }), /HQ_INVALID_RELATIVE_PATH/);
}));

test('tracked or local symlink escapes are never indexed or read', t => fixture(({ source, dataDir, privateWorld }) => {
  try { symlinkSync(join(privateWorld, 'personal.txt'), join(source, 'linked.txt'), 'file'); }
  catch (error) {
    if (['EPERM', 'EACCES', 'ENOTSUP'].includes(error.code)) { t.skip('symlinks unavailable'); return; }
    throw error;
  }
  const api = createDevIntelligence({ mode: 'diagnostic', dataDir, approvedRoots: [source] });
  api.registerSource({ name: 'fixture', path: source });
  api.index();
  assert.equal(api.search({ query: 'PERSONAL_WORLD_SENTINEL' }).total, 0);
  assert.equal(api.sourceEvidence({ project: 'fixture', path: 'linked.txt' }).status, 'unavailable');
  assert.ok(!JSON.stringify(api.wiki()).includes('PERSONAL_WORLD_SENTINEL'));
}));

test('revocation removes FTS content and generated wiki; read grant can already be revoked', () => fixture(({ source, dataDir }) => {
  const operations = [];
  let readRevoked = false;
  const api = createDevIntelligence({
    mode: 'host', dataDir, approvedRoots: [source], actorId: 'a', sessionId: 's',
    authorize: request => {
      operations.push(request.operation);
      return !readRevoked || request.operation === 'source.revoke';
    },
  });
  api.registerSource({ name: 'fixture', path: source });
  api.index();
  assert.ok(api.wiki());
  readRevoked = true;
  assert.throws(() => api.search({ query: 'uniqueBoundarySignal' }), /HQ_HOST_PERMISSION_DENIED/);
  assert.equal(api.removeSource('fixture'), true);
  assert.ok(operations.includes('source.revoke'));
  assert.equal(existsSync(join(dataDir, 'wiki')), false);
  assert.deepEqual(api.status().sources, []);
  assert.equal(api.search({ query: 'uniqueBoundarySignal' }).total, 0);
}));

test('fixed local database ignores legacy absolute db config', () => fixture(({ source, dataDir, privateWorld }) => {
  const api = createDevIntelligence({ mode: 'diagnostic', dataDir, approvedRoots: [source] });
  api.registerSource({ name: 'fixture', path: source });
  mkdirSync(join(dataDir, '.hq'), { recursive: true });
  writeFileSync(join(dataDir, '.hq', 'config.json'),
    JSON.stringify({ db: join(privateWorld, 'unauthorized.db') }));
  api.index();
  assert.equal(existsSync(join(privateWorld, 'unauthorized.db')), false);
  assert.equal(existsSync(join(dataDir, '.hq', 'index.db')), true);
  assert.throws(() => createDevIntelligence({
    mode: 'diagnostic', dataDir: source, approvedRoots: [source],
  }), /HQ_SOURCE_DATA_OVERLAP/);
}));

test('missing disposable index can be rebuilt; corrupt index fails closed', () => fixture(({ source, dataDir }) => {
  const api = createDevIntelligence({ mode: 'diagnostic', dataDir, approvedRoots: [source] });
  api.registerSource({ name: 'fixture', path: source });
  api.index();
  const db = join(dataDir, '.hq', 'index.db');
  unlinkSync(db);
  assert.ok(api.index().totals.files > 0);
  assert.ok(api.search({ query: 'uniqueBoundarySignal' }).total > 0);
  writeFileSync(db, 'not a sqlite index');
  assert.throws(() => api.search({ query: 'uniqueBoundarySignal' }));
}));

test.todo('Windows packaged Host actor/session and NTFS junction tests require device integration');
test.todo('ENOSPC/SQLITE_FULL write rollback requires injectable fault or disk-quota runner');
test.todo('Physical donor-offline install and full legacy CLI tests require G merged workspace');
