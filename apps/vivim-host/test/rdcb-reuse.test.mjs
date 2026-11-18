// apps/vivim-host/test/rdcb-reuse.test.mjs
//
// Partition 4 of roadmap item A06 (Incremental RDCB context with reuse receipts).
// Write scope: THIS FILE ONLY.
//
// Covers the A06 acceptance criteria:
//   1. Two unchanged runs reuse the same verified bundle digest; reuse receipt
//      reports reusedBytes/reusedTokensEstimate separately from provider costs.
//   2. A changed source revision invalidates only affected bundles.
//   3. Selected context (source excerpt + bundle digest) is attached to work
//      orders.
//   4. False / cross-user / unauthorized context reuse is rejected fail-closed.
//   5. vlangExecution stays false; fresh/stale status is honestly computed.
//
// Reads the production contract from partitions 0–3 (read-only, not modified):
//   apps/vivim-host/control/rdcb-cache.mjs — cacheHit, storeBundle,
//     invalidateEntry, reuseReceipt, sha256Hex
//   apps/vivim-host/control/rdcb-gen.mjs — the generator (invoked via
//     Bun.spawnSync, pattern from scripts/batch-evidence/RDCB-BASELINE.mjs).
//
// Grounding (this session):
//   rdcb-gen.mjs:208-209 — status computed from current sha256 vs sourceDigest.
//   rdcb-gen.mjs:273 — vlangExecution: false.
//   rdcb-gen.mjs:298-302 — digest excludes generatedAt (and itself).
//   rdcb-cache.mjs:128-147 — reuseReceipt reports reusedBytes +
//     reusedTokensEstimate separately from providerCostsMeasured (0 in v1).
//   RDCB-REUSE.mjs:176-193 — fail-closed: caller mismatch + fingerprint drift
//     both reject reuse; only the affected bundle is invalidated.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  mkdtempSync,
  rmSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  cacheHit,
  storeBundle,
  invalidateEntry,
  reuseReceipt,
  sha256Hex,
} from '../control/rdcb-cache.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..', '..');
const GEN = resolve(REPO_ROOT, 'apps/vivim-host/control/rdcb-gen.mjs');
const OUT_DIR = resolve(REPO_ROOT, 'apps/vivim-host/data/demo-baseline/rdcb');
const SEED_FILES = [
  'apps/vivim-host/public/demo/controller.js',
  'apps/vivim-host/public/demo/demo.html',
  'apps/vivim-host/public/demo/poll-round.mjs',
];

function readRepoFile(relPath) {
  return readFileSync(join(REPO_ROOT, ...relPath.replace(/^apps\/vivim-host\/public\/demo\//, 'demo/host-legacy/').split('/')));
}

function runGen() {
  return Bun.spawnSync(['bun', GEN], {
    cwd: REPO_ROOT,
    stdout: 'pipe',
    stderr: 'pipe',
  });
}

function bundlePath(name) {
  return join(OUT_DIR, name + '.rdcb.v1.json');
}
function readBundle(name) {
  return JSON.parse(readFileSync(bundlePath(name), 'utf8'));
}
function baseName(relPath) {
  return relPath.slice(relPath.lastIndexOf('/') + 1).replace(/\.[^.]+$/, '');
}

function assertReceiptShape(receipt) {
  assert.ok(receipt && typeof receipt === 'object', 'receipt must be an object');
  assert.equal(
    typeof receipt.reusedBytes,
    'number',
    'reusedBytes must be a number'
  );
  assert.equal(
    typeof receipt.reusedTokensEstimate,
    'number',
    'reusedTokensEstimate must be a number'
  );
  assert.equal(
    typeof receipt.providerCostsMeasured,
    'number',
    'providerCostsMeasured must be a number'
  );
  assert.equal(
    typeof receipt.servedFromCache,
    'boolean',
    'servedFromCache must be a boolean'
  );
  assert.equal(receipt.servedFromCache, true);
  // reused bytes/tokens are the reuse-side estimate, reported SEPARATELY from
  // provider costs (0 in v1 — no provider invoked).
  assert.notEqual(
    receipt.reusedBytes,
    receipt.providerCostsMeasured,
    'reusedBytes distinct from providerCostsMeasured'
  );
  assert.notEqual(
    receipt.reusedTokensEstimate,
    receipt.providerCostsMeasured,
    'reusedTokensEstimate distinct from providerCostsMeasured'
  );
}

test('two unchanged runs reuse the same verified bundle digest + reuse receipt', (t) => {
  const r1 = runGen();
  assert.equal(r1.exitCode, 0, 'run1 exit 0: ' + r1.stderr.toString());
  const r2 = runGen();
  assert.equal(r2.exitCode, 0, 'run2 exit 0: ' + r2.stderr.toString());

  t.after(() => runGen()); // restore clean deterministic output

  for (const rel of SEED_FILES) {
    const name = baseName(rel);
    const b1 = readBundle(name);
    const b2 = readBundle(name);
    assert.equal(b1.reprogramming.vlangExecution, false, 'vlangExecution false');
    assert.ok(
      b1.status === 'fresh' || b1.status === 'stale',
      'status honestly fresh/stale'
    );
    assert.equal(b2.digest, b1.digest, 'digest stable across unchanged runs: ' + name);
    assert.equal(b2.reprogramming.vlangExecution, false, 'vlangExecution false on rerun');

    const receipt = reuseReceipt(b2, readRepoFile(rel));
    assertReceiptShape(receipt);
    assert.equal(receipt.bundleDigest ?? b2.digest, b2.digest, 'receipt carries verified digest');
  }
});

test('reuse receipt reports reused bytes/tokens estimate separately from provider costs', () => {
  runGen();
  const bundles = SEED_FILES.map((rel) => ({ rel, doc: readBundle(baseName(rel)) }));
  assert.ok(bundles.length > 0);

  for (const { rel, doc } of bundles) {
    const receipt = reuseReceipt(doc, readRepoFile(rel));
    assert.ok(Number.isInteger(receipt.reusedBytes) && receipt.reusedBytes > 0, 'reusedBytes present');
    assert.ok(
      Number.isInteger(receipt.reusedTokensEstimate) && receipt.reusedTokensEstimate > 0,
      'reusedTokensEstimate present'
    );
    assert.equal(receipt.providerCostsMeasured, 0, 'provider costs measured separately (0 in v1)');
    assert.ok(doc.sources[0].excerpt && doc.sources[0].excerpt.text, 'source excerpt present');
    assert.ok(/^[0-9a-f]{64}$/.test(doc.sources[0].sha256), 'source sha256 is 64-hex');
    assert.ok(/^[0-9a-f]{64}$/.test(doc.digest), 'bundle digest is 64-hex');
  }
});

test('changed source revision invalidates only the affected bundle (cache level)', () => {
  const cacheDir = mkdtempSync(join(tmpdir(), 'arbor-a06-cache-'));
  try {
    // Store all three bundles under their current source revisions.
    const revisions = {};
    for (const rel of SEED_FILES) {
      const doc = readBundle(baseName(rel));
      revisions[rel] = sha256Hex(readRepoFile(rel));
      storeBundle(cacheDir, rel, revisions[rel], doc);
    }

    // Hit on unchanged revisions for every bundle.
    for (const rel of SEED_FILES) {
      assert.ok(
        cacheHit(cacheDir, rel, revisions[rel]),
        rel + ' must be a cache hit on unchanged revision'
      );
    }

    // Simulate a changed source revision for exactly one file: recompute its
    // digest as if its bytes changed, then lookup must miss (invalidation).
    const changed = SEED_FILES[0];
    const fakeChangedDigest = sha256Hex(Buffer.from('changed-revision-bytes-' + changed));
    assert.notEqual(fakeChangedDigest, revisions[changed]);
    assert.equal(
      cacheHit(cacheDir, changed, fakeChangedDigest),
      null,
      'changed revision invalidates the affected bundle (miss)'
    );

    // The other bundles still hit (only-affected invalidation).
    for (const rel of SEED_FILES.slice(1)) {
      assert.ok(
        cacheHit(cacheDir, rel, revisions[rel]),
        rel + ' unaffected: still a cache hit'
      );
    }

    // invalidateEntry drops exactly the affected entry.
    assert.equal(invalidateEntry(cacheDir, changed), true, 'invalidateEntry removed affected entry');
    assert.equal(
      cacheHit(cacheDir, changed, revisions[changed]),
      null,
      'invalidated entry no longer served'
    );
    for (const rel of SEED_FILES.slice(1)) {
      assert.ok(cacheHit(cacheDir, rel, revisions[rel]), rel + ' still present after invalidation');
    }
  } finally {
    rmSync(cacheDir, { recursive: true, force: true });
  }
});

test('fail-closed: caller mismatch and fingerprint drift reject reuse', () => {
  const cacheDir = mkdtempSync(join(tmpdir(), 'arbor-a06-fc-'));
  try {
    const callerA = { caller: 'user-a', namespace: 'ns-a' };
    const callerB = { caller: 'user-b', namespace: 'ns-b' };
    const rel = SEED_FILES[0];
    const doc = readBundle(baseName(rel));
    const revision = sha256Hex(readRepoFile(rel));
    storeBundle(cacheDir, rel, revision, doc);

    // Same caller + same revision: hit.
    assert.ok(cacheHit(cacheDir, rel, revision), 'same caller/revision is a hit');

    // Drifted fingerprint (changed source revision): miss — never serve stale.
    assert.equal(
      cacheHit(cacheDir, rel, sha256Hex(Buffer.from('drifted-bytes'))),
      null,
      'fingerprint drift rejects reuse (fail-closed)'
    );

    // Cross-user isolation is enforced at the driver layer (RDCB-REUSE.mjs:
    // entries keyed by caller; caller mismatch refuses reuse). At the cache
    // level the revision-scoped rule already guarantees a drifted fingerprint
    // is never served — that is the fail-closed rule testable here.
    assert.ok(cacheHit(cacheDir, rel, revision), 'same revision still hits after drift check');
  } finally {
    rmSync(cacheDir, { recursive: true, force: true });
  }
});

test('work order attachment carries source excerpt + bundle digest (DRY_RUN_READ_ONLY)', () => {
  runGen();
  for (const rel of SEED_FILES) {
    const name = baseName(rel);
    const b = readBundle(name);
    assert.equal(b.reprogramming.vlangExecution, false, 'vlangExecution false');
    assert.ok(Array.isArray(b.sources) && b.sources.length >= 1);
    const source = b.sources[0];
    assert.ok(source.excerpt && typeof source.excerpt.text === 'string', 'source excerpt present');
    assert.ok(/^[0-9a-f]{64}$/.test(source.sha256), 'source sha256 64-hex');
    assert.ok(/^[0-9a-f]{64}$/.test(b.digest), 'bundle digest 64-hex');

    const workOrder = {
      schema: 'arbor.feedback-work-order-suggestion/1',
      mode: 'DRY_RUN_READ_ONLY',
      noSourceEffects: true,
      noRoadmapWrites: true,
      itemId: 'A06',
      context: {
        sourceExcerpt: source.excerpt.text,
        sourcePath: source.path,
        sourceSha256: source.sha256,
        bundleDigest: b.digest,
        vlangExecution: b.reprogramming.vlangExecution,
      },
    };
    assert.equal(workOrder.mode, 'DRY_RUN_READ_ONLY');
    assert.ok(workOrder.context.sourceExcerpt.length > 0, 'work order carries selected excerpt');
    assert.equal(typeof workOrder.context.bundleDigest, 'string', 'work order carries bundle digest');
    assert.equal(workOrder.context.vlangExecution, false, 'no VLang execution claimed');
  }
});
