// hq/test/check-freshness-parity.test.mjs — `hq check`/`hq verify` must judge
// freshness against the same file universe the indexer walks.
//
// Regression fixtures (Z.ai R1): cmdCheck/cmdVerify used to walk with a
// hardcoded 10MB cap and no config ignores, while the indexer caps at
// config.maxFileBytes and honours config.ignores. Files between the two caps
// were reported as forever-new on every run, so `check --strict` could never
// pass on a clean clone of this workspace (real offenders: 6.8MB
// .work/blockers/records.jsonl, 3.2MB source-dispositions.v1.json). The same
// mismatch made generated output (wiki/) reappear as stale the moment it was
// written.
//
// The tests also pin the counter-capability: parity must not make the check
// toothless. A genuine edit within the cap must still be reported as changed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, utimesSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CLI = join(REPO, 'hq', 'bin', 'hq.mjs');

function dirname(p) { return p.slice(0, Math.max(p.lastIndexOf('/'), p.lastIndexOf('\\'))); }

function run(workspace, args) {
  const out = execFileSync(process.execPath, [CLI, ...args], {
    cwd: workspace,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  return JSON.parse(out);
}

function fixedMtime(path, ms) {
  const d = new Date(ms);
  utimesSync(path, d, d);
}

function makeWorkspace() {
  // index cap 200 bytes; old hardcoded walk cap was 10_000_000 bytes.
  const ws = mkdtempSync(join(tmpdir(), 'hq-check-parity-'));
  mkdirSync(join(ws, '.hq'), { recursive: true });
  writeFileSync(join(ws, '.hq', 'config.json'), JSON.stringify({
    db: '.hq/index.db',
    maxFileBytes: 200,
    ignores: ['generated-out'],
  }), 'utf8');
  // one registered space, relative path like real clean-clone registrations
  writeFileSync(join(ws, 'projects.json'), JSON.stringify({
    version: 1,
    projects: [{ name: 'demo', path: 'demo', tags: [], addedAt: '2026-11-10T00:00:00.000Z' }],
  }), 'utf8');
  // the space: one indexable file, one over the cap, one under an ignored dir
  mkdirSync(join(ws, 'demo', 'src'), { recursive: true });
  mkdirSync(join(ws, 'demo', 'big'), { recursive: true });
  mkdirSync(join(ws, 'demo', 'generated-out'), { recursive: true });
  writeFileSync(join(ws, 'demo', 'src', 'small.mjs'), 'export const one = 1;\n');
  writeFileSync(join(ws, 'demo', 'big', 'huge.mjs'), 'export const two = 2;\n'.repeat(40)); // ~640B > 200B cap, < 10MB
  writeFileSync(join(ws, 'demo', 'generated-out', 'page.md'), '# generated page\n');
  return ws;
}

test('check --strict is current when over-cap and ignored files are excluded by the index', () => {
  const ws = makeWorkspace();
  try {
    const indexed = run(ws, ['index', '--json']);
    assert.equal(indexed.totals.errors, 0);
    assert.deepEqual(indexed.projects.map((p) => p.added).sort(), [1], 'only src/small.mjs is indexable');

    const check = run(ws, ['check', '--strict', '--json']);
    assert.equal(check.ok, true);
    assert.equal(check.staleCount, 0);
    assert.equal(check.stale.filter((s) => s.path === 'big/huge.mjs').length, 0, 'over-cap file must not be forever-new');
    assert.equal(check.stale.filter((s) => s.path === 'generated-out/page.md').length, 0, 'config-ignored file must not be forever-new');

    const verify = run(ws, ['verify', '--json']);
    assert.equal(verify.staleCount, 0, 'verify uses the same parity rule');
  } finally {
    rmSync(ws, { recursive: true, force: true });
  }
});

test('parity does not blind the check: a real edit within the cap is still stale', () => {
  const ws = makeWorkspace();
  try {
    run(ws, ['index', '--json']);
    const before = run(ws, ['check', '--strict', '--json']);
    assert.equal(before.ok, true);

    writeFileSync(join(ws, 'demo', 'src', 'small.mjs'), 'export const one = 2;\n');
    fixedMtime(join(ws, 'demo', 'src', 'small.mjs'), Date.now() + 5000);
    const after = run(ws, ['check', '--json']);
    assert.equal(after.ok, false);
    assert.ok(after.stale.some((s) => s.path === 'src/small.mjs' && s.reason === 'changed'), 'genuine change must be reported');
  } finally {
    rmSync(ws, { recursive: true, force: true });
  }
});

test('an indexable file created after indexing is reported as new', () => {
  const ws = makeWorkspace();
  try {
    run(ws, ['index', '--json']);
    writeFileSync(join(ws, 'demo', 'src', 'late.mjs'), 'export const late = 3;\n');
    const check = run(ws, ['check', '--json']);
    assert.equal(check.ok, false);
    assert.ok(check.stale.some((s) => s.path === 'src/late.mjs' && s.reason === 'new'), 'new file must be reported');
  } finally {
    rmSync(ws, { recursive: true, force: true });
  }
});
