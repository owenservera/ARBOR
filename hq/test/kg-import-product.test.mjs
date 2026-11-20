// hq/test/kg-import-product.test.mjs — the packaged native-import path.
//
// @hq:context A registered source change must reach the native graph through the
//   frozen package's own hqkg-import binary, with no Cargo on the machine, and
//   the exchange state may advance only on the importer's verified
//   acknowledgment.
// @hq:invariant No new graph, journal or interpreter: the exchange comes from the
//   incumbent producer (hq/lib/kg-export.mjs) and the journal is the one the
//   importer already owns.
// @hq:invariant Every database is in-memory and every fixture lives under a
//   disposable temp directory.
// @hq:see hq/lib/kg-export.mjs · native/hqkg/src/bin/hqkg-import.rs ·
//   tools/packaging/prepare-host-runtime.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { openMemoryDb } from '../lib/schema.mjs';
import { indexProject } from '../lib/indexer.mjs';
import {
  acknowledgeGraphExport, exportGraphExchange, importGraphExchange, parseImporterOutput,
  resolveGraphImporter, SOURCE_NAMESPACE, PACKAGED_NATIVE_BIN_DIR,
  IMPORT_MODE_ENV, IMPORTER_BIN_DIR_ENV,
} from '../lib/kg-export.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CLI = join(REPO, 'hq', 'bin', 'hq.mjs');

function temp(prefix) {
  return mkdtempSync(join(tmpdir(), prefix));
}

function workspace(files) {
  const root = temp('hq-kg-import-product-');
  const project = join(root, 'demo');
  mkdirSync(join(project, 'src'), { recursive: true });
  for (const [rel, text] of Object.entries(files)) writeFileSync(join(project, rel), text, 'utf8');
  const db = openMemoryDb();
  indexProject({ root, db, project: { name: 'demo', path: project }, options: { useGit: false } });
  return { root, project, db };
}

function exportOf(db, root) {
  const dir = join(root, '.hq');
  mkdirSync(dir, { recursive: true });
  const outPath = join(dir, 'kg-exchange.jsonl');
  const statePath = join(dir, 'kg-export-state.json');
  const exported = exportGraphExchange({ db, outPath, statePath });
  return { exported, outPath, statePath, journal: join(dir, 'kg-journal.hqj') };
}

/** Existing local importer binary, if the checkout has one built. */
function localImporterDir() {
  const dirs = [
    process.env[IMPORTER_BIN_DIR_ENV],
    join(REPO, 'target', 'release'),
    join(REPO, 'target', 'debug'),
    join(REPO, 'native', 'hqkg', 'target', 'release'),
    join(REPO, 'native', 'hqkg', 'target', 'debug'),
  ].filter(Boolean);
  const names = process.platform === 'win32' ? ['hqkg-import.exe', 'hqkg-import'] : ['hqkg-import', 'hqkg-import.exe'];
  for (const dir of dirs) if (names.some((name) => existsSync(join(dir, name)))) return dir;
  return null;
}

function cliWorkspace() {
  const ws = temp('hq-kg-cli-');
  mkdirSync(join(ws, '.hq'), { recursive: true });
  writeFileSync(join(ws, '.hq', 'config.json'), JSON.stringify({ db: '.hq/index.db', maxFileBytes: 200000, ignores: [] }));
  writeFileSync(join(ws, 'projects.json'), JSON.stringify({
    version: 1,
    projects: [{ name: 'demo', path: 'demo', tags: [], addedAt: '2026-11-10T00:00:00.000Z' }],
  }));
  mkdirSync(join(ws, 'demo', 'src'), { recursive: true });
  writeFileSync(join(ws, 'demo', 'src', 'one.mjs'), 'export const alpha = 1;\n');
  return ws;
}

// ---------------------------------------------------------------------------
// resolution: packaged first, Cargo only when explicitly selected
// ---------------------------------------------------------------------------

test('packaged mode resolves the frozen runtime binary and never probes Cargo', () => {
  const root = temp('hq-kg-resolve-');
  const runtimeRoot = join(root, 'runtime');
  const exeName = process.platform === 'win32' ? 'hqkg-import.exe' : 'hqkg-import';

  // The frozen package's own layout: <runtime>/native/bin.
  const productDir = join(runtimeRoot, 'native', 'bin');
  mkdirSync(productDir, { recursive: true });
  const productExe = join(productDir, exeName);
  writeFileSync(productExe, '');
  const product = resolveGraphImporter({ root, env: {}, runtimeRoot });
  assert.equal(product.mode, 'packaged');
  assert.equal(product.available, true);
  assert.equal(product.program, productExe);
  assert.deepEqual(product.args, [], 'a packaged binary is invoked directly, not through a build tool');
  assert.equal(product.source, 'packaged:native/bin');

  // A source checkout staged by the packaging gate: src-tauri/resources/runtime.
  rmSync(productExe);
  const stagedDir = join(root, ...PACKAGED_NATIVE_BIN_DIR.split('/'));
  mkdirSync(stagedDir, { recursive: true });
  const stagedExe = join(stagedDir, exeName);
  writeFileSync(stagedExe, '');
  const staged = resolveGraphImporter({ root, env: {}, runtimeRoot });
  assert.equal(staged.available, true);
  assert.equal(staged.program, stagedExe);
  assert.equal(staged.source, `packaged:${PACKAGED_NATIVE_BIN_DIR}`);
});

test('an un-packaged runtime reports importer_not_packaged and spawns nothing', () => {
  const root = temp('hq-kg-resolve-missing-');
  let spawns = 0;
  const out = importGraphExchange({
    root, journal: join(root, 'kg.hqj'), exchange: join(root, 'exchange.jsonl'), env: {},
    spawn: () => { spawns += 1; throw new Error('must not spawn'); },
  });
  assert.equal(spawns, 0, 'no Cargo, no shell: the missing binary is a resolution result');
  assert.equal(out.ok, false);
  assert.equal(out.mode, 'packaged');
  assert.equal(out.reason, 'importer_not_packaged');
  assert.equal(out.epochAfter, null);
});

const SEP = process.platform === 'win32' ? '\\' : '/';

test('the cargo development fallback is used only when explicitly selected', () => {
  const calls = [];
  const out = importGraphExchange({
    root: REPO, journal: 'J', exchange: 'E',
    env: { [IMPORT_MODE_ENV]: 'cargo' },
    spawn: (program, args) => {
      calls.push({ program, args });
      return {
        status: 0,
        stdout: `schema=x source=${SOURCE_NAMESPACE} namespace=${SOURCE_NAMESPACE} digest=d\n`
          + 'node inserted=1 updated=0 unchanged=0 deleted=0 edge inserted=0 updated=0 unchanged=0 deleted=0\n'
          + 'epoch before=0 after=1 dry_run=false wrote_snapshot=true\n',
        stderr: '',
      };
    },
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].program, 'cargo');
  assert.ok(calls[0].args.includes('--manifest-path'), 'the crate is addressed by manifest, not by a hard-coded checkout path');
  assert.ok(calls[0].args.some((arg) => arg.endsWith(`native${SEP}hqkg${SEP}Cargo.toml`)));
  assert.deepEqual(calls[0].args.slice(-2), ['J', 'E'], 'journal and exchange stay the trailing positional args');
  assert.equal(out.ok, true);
  assert.equal(out.epochBefore, 0);
  assert.equal(out.epochAfter, 1);
  assert.equal(out.namespaceOk, true);
  assert.equal(out.wroteSnapshot, true);
});

test('the importer report is parsed from its stdout contract', () => {
  const parsed = parseImporterOutput(
    'schema=repos-hq.hqkg-exchange/1 source=repos-hq.index namespace=repos-hq.index digest=abc\n'
    + 'node inserted=2 updated=1 unchanged=0 deleted=3 edge inserted=0 updated=0 unchanged=0 deleted=0\n'
    + 'epoch before=4 after=9 dry_run=false wrote_snapshot=true\n',
  );
  assert.equal(parsed.namespace, SOURCE_NAMESPACE);
  assert.equal(parsed.epochBefore, 4);
  assert.equal(parsed.epochAfter, 9);
  assert.equal(parsed.nodesInserted, 2);
  assert.equal(parsed.nodesDeleted, 3);
  // Older binaries print `source=` only; that is still the applied namespace.
  const legacy = parseImporterOutput('schema=s source=repos-hq.index digest=d\nepoch before=1 after=2 dry_run=false wrote_snapshot=true\n');
  assert.equal(legacy.namespace, SOURCE_NAMESPACE);
});

test('a namespace mismatch is refused before any state can advance', () => {
  const out = importGraphExchange({
    root: REPO, journal: 'J', exchange: 'E', namespace: SOURCE_NAMESPACE,
    env: { [IMPORT_MODE_ENV]: 'cargo' },
    spawn: () => ({
      status: 0,
      stdout: 'schema=x source=some-other-producer namespace=some-other-producer digest=d\n'
        + 'node inserted=1 updated=0 unchanged=0 deleted=0 edge inserted=0 updated=0 unchanged=0 deleted=0\n'
        + 'epoch before=0 after=1 dry_run=false wrote_snapshot=true\n',
      stderr: '',
    }),
  });
  assert.equal(out.ok, false);
  assert.equal(out.reason, 'namespace_mismatch');
  assert.equal(out.namespaceOk, false);
});

// ---------------------------------------------------------------------------
// the real acceptance: registered source sync without Cargo, state advances
// ---------------------------------------------------------------------------

test('a registered source change imports through the packaged binary and advances the verified state', (t) => {
  const importerDir = localImporterDir();
  if (!importerDir) {
    t.skip('native hqkg importer not built (set VIVIM_HQKG_BIN_DIR to run this check)');
    return;
  }
  const { root, project, db } = workspace({
    'src/one.mjs': 'export const alpha = 1;\n',
    'src/two.mjs': "import { alpha } from './one.mjs';\nexport const beta = alpha;\n",
  });
  const env = { ...process.env, [IMPORTER_BIN_DIR_ENV]: importerDir, [IMPORT_MODE_ENV]: 'packaged' };
  try {
    const first = exportOf(db, root);
    const firstImport = importGraphExchange({
      root, journal: first.journal, exchange: first.outPath, namespace: SOURCE_NAMESPACE, env,
    });
    assert.equal(firstImport.ok, true, JSON.stringify(firstImport));
    assert.equal(firstImport.mode, 'packaged');
    assert.equal(firstImport.epochBefore, 0);
    assert.ok(firstImport.epochAfter >= 1, 'the graph epoch advanced');
    assert.equal(firstImport.namespaceOk, true);

    const firstAck = acknowledgeGraphExport({
      statePath: first.statePath, digest: first.exported.digest,
      acknowledgment: { epochBefore: firstImport.epochBefore, epochAfter: firstImport.epochAfter },
    });
    assert.equal(firstAck.acked, true);
    const committed = JSON.parse(readFileSync(first.statePath, 'utf8'));
    assert.equal(committed.ackedDigest, first.exported.digest, 'the delta base advanced to the imported digest');
    assert.equal(committed.entries['demo/src/one.mjs'].content_sha256 != null, true);

    // A replay of the same digest is a no-op: still verified, no epoch advance.
    const replay = importGraphExchange({
      root, journal: first.journal, exchange: first.outPath, namespace: SOURCE_NAMESPACE, env,
    });
    assert.equal(replay.ok, true);
    assert.equal(replay.epochAfter, firstImport.epochAfter, 'an idempotent replay does not advance the epoch');
    assert.equal(replay.wroteSnapshot, false);

    // Registered source edit -> same identity updated, new digest, state advances again.
    writeFileSync(join(project, 'src', 'one.mjs'), 'export const alpha = 2;\n', 'utf8');
    indexProject({ root, db, project: { name: 'demo', path: project }, options: { useGit: false } });
    const second = exportOf(db, root);
    assert.notEqual(second.exported.digest, first.exported.digest);
    const secondImport = importGraphExchange({
      root, journal: second.journal, exchange: second.outPath, namespace: SOURCE_NAMESPACE, env,
    });
    assert.equal(secondImport.ok, true, JSON.stringify(secondImport));
    assert.ok(secondImport.epochAfter > firstImport.epochAfter, 'the verified exchange advanced the epoch');
    const secondAck = acknowledgeGraphExport({
      statePath: second.statePath, digest: second.exported.digest,
      acknowledgment: { epochBefore: secondImport.epochBefore, epochAfter: secondImport.epochAfter, stats: secondImport.statsLine ?? undefined },
    });
    assert.equal(secondAck.acked, true);
    assert.equal(JSON.parse(readFileSync(second.statePath, 'utf8')).ackedDigest, second.exported.digest);

    // A failed import leaves the acknowledged base untouched (tombstones replay).
    const blocked = importGraphExchange({
      root, journal: second.journal, exchange: second.outPath, namespace: 'not-our-namespace', env,
    });
    assert.equal(blocked.ok, false);
    assert.equal(JSON.parse(readFileSync(second.statePath, 'utf8')).ackedDigest, second.exported.digest,
      'a refused import never advances the state');
  } finally {
    db.close();
    rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
});

// ---------------------------------------------------------------------------
// CLI: development interface, packaged capability underneath, no Cargo
// ---------------------------------------------------------------------------

test('hq kg sync is blocked without a packaged importer and leaves the state unadvanced', () => {
  const ws = cliWorkspace();
  try {
    const env = { ...process.env, [IMPORT_MODE_ENV]: 'packaged' };
    delete env[IMPORTER_BIN_DIR_ENV];
    let payload = null;
    let status = 0;
    try {
      const out = execFileSync(process.execPath, [CLI, 'kg', 'sync', '--json'], {
        cwd: ws, encoding: 'utf8', env, stdio: ['ignore', 'pipe', 'ignore'],
      });
      payload = JSON.parse(out);
    } catch (error) {
      status = typeof error.status === 'number' ? error.status : -1;
      payload = error.stdout ? JSON.parse(String(error.stdout)) : null;
    }
    assert.equal(status, 1, 'a blocked sync is a failed command');
    assert.equal(payload.schema, 'hq.kg-sync/1');
    assert.equal(payload.imported, false);
    assert.equal(payload.reason, 'importer_unavailable');
    assert.ok(existsSync(join(ws, '.hq', 'kg-exchange.jsonl')), 'the exchange is still written for retry');
    assert.equal(existsSync(join(ws, '.hq', 'kg-export-state.json')), false,
      'the acknowledged base never advances without a verified import');
  } finally {
    rmSync(ws, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
});

test('source refresh imports through the packaged binary and advances state only on acknowledgment', (t) => {
  const importerDir = localImporterDir();
  if (!importerDir) {
    t.skip('native hqkg importer not built (set VIVIM_HQKG_BIN_DIR to run this check)');
    return;
  }
  const ws = cliWorkspace();
  const env = { ...process.env, [IMPORTER_BIN_DIR_ENV]: importerDir };
  const run = (extraEnv) => JSON.parse(execFileSync(process.execPath, [CLI, 'refresh', '--json'], {
    cwd: ws, encoding: 'utf8', env: { ...env, ...extraEnv }, stdio: ['ignore', 'pipe', 'ignore'],
  }));
  try {
    execFileSync(process.execPath, [CLI, 'index', '--json'], { cwd: ws, encoding: 'utf8', env, stdio: ['ignore', 'pipe', 'ignore'] });
    const first = run({});
    assert.equal(first.kg.exported, true);
    assert.equal(first.kg.imported, true, JSON.stringify(first.kg));
    assert.equal(first.kg.acked, true);
    assert.equal(first.kg.mode, 'packaged');
    assert.ok(first.kg.epochAfter > first.kg.epochBefore, 'the verified exchange advanced the epoch');
    const statePath = join(ws, '.hq', 'kg-export-state.json');
    const acked = JSON.parse(readFileSync(statePath, 'utf8')).ackedDigest;
    assert.match(acked, /^[a-f0-9]{64}$/);

    // Same workspace, no importer available: the exchange is re-emitted, the
    // acknowledged base is untouched.
    const blocked = run({ [IMPORTER_BIN_DIR_ENV]: '', [IMPORT_MODE_ENV]: 'packaged' });
    assert.equal(blocked.kg.exported, true);
    assert.equal(blocked.kg.imported, false);
    assert.equal(blocked.kg.reason, 'importer_not_packaged');
    assert.equal(JSON.parse(readFileSync(statePath, 'utf8')).ackedDigest, acked,
      'a blocked refresh never advances the delta base');
  } finally {
    rmSync(ws, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
});