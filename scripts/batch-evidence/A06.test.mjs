// scripts/batch-evidence/A06.test.mjs
// Acceptance tests for item A06 "Incremental RDCB context with reuse receipts".
// Drives apps/vivim-host/control/rdcb-incremental.mjs (incremental cache on top of
// the deterministic RDCB generator's bundles + rdcb-cache.mjs primitives).
// Native HQKG/Rust side (invalidate.rs fail-closed semantics) is covered by
// native/hqkg/tests/invalidate-revision.test.mjs (A06 partition 5) — cargo, not run here.

import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';
import {
  REUSE_SCHEMA, SEED_FILES, canonicalReuseDigest, IncrementalRdcbCache
} from '../../apps/vivim-host/control/rdcb-incremental.mjs';

const sha = d => createHash('sha256').update(d).digest('hex');

function fakeBundle(relPath, rev) {
  return {
    schema: 'vivim.rdcb/1',
    sources: [{ path: relPath, sha256: rev, estimatedTokens: 3, excerpt: { kind: 'vlang-surface-header', lines: [1, 2], text: '/* @vlang:surface */' } }],
    digest: sha(relPath + rev)
  };
}

function setup(caller) {
  const dir = mkdtempSync(join(os.tmpdir(), 'arbor-a06-'));
  return { dir, cache: new IncrementalRdcbCache({ cacheDir: dir, caller }) };
}

test('A06: reuse digest is stable across reruns over unchanged inputs', () => {
  const a = setup('ns-a');
  const b = setup('ns-b');
  try {
    const entries = SEED_FILES.map(p => ({ path: p, revision: sha(p) }));
    assert.equal(canonicalReuseDigest(entries), canonicalReuseDigest([...entries].reverse()));
    const store = new IncrementalRdcbCache({ cacheDir: a.dir, caller: 'ns-c' });
    for (const p of SEED_FILES) store.store(p, sha(p), fakeBundle(p, sha(p)));
    const d1 = store.reuseDigest();
    const again = new IncrementalRdcbCache({ cacheDir: a.dir, caller: 'ns-c' });
    assert.equal(again.reuseDigest(), d1); // identical digest on re-open
  } finally { rmSync(a.dir, { recursive: true, force: true }); rmSync(b.dir, { recursive: true, force: true }); }
});

test('A06: cache hit serves bundle verbatim with a reuse receipt, no execution claim', () => {
  const { dir, cache } = setup('ns-a');
  try {
    const p = SEED_FILES[0];
    const rev = sha('v1');
    cache.store(p, rev, fakeBundle(p, rev));
    const hit = cache.lookup(p, rev);
    assert.ok(hit.bundle, 'bundle served');
    assert.equal(hit.receipt.schema, REUSE_SCHEMA);
    assert.equal(hit.receipt.servedFromCache, true);
    assert.equal(hit.receipt.providerCostsMeasured, 0);
    assert.equal(hit.receipt.executionClaimed, false);
    assert.equal(hit.receipt.vlangExecution, false);
    assert.equal(hit.receipt.sourceRevision, rev);
    assert.equal(hit.receipt.item, 'A06');
    assert.equal(hit.receipt.reuseDigest, cache.reuseDigest()); // receipt carries the stable reuse digest
    assert.deepEqual(hit.invalidated, []);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('A06: selective invalidation — only the drifted entry is dropped, others still hit', () => {
  const { dir, cache } = setup('ns-a');
  try {
    const [p1, p2] = SEED_FILES;
    const r1 = sha('a'), r2 = sha('b');
    cache.store(p1, r1, fakeBundle(p1, r1));
    cache.store(p2, r2, fakeBundle(p2, r2));
    const miss = cache.lookup(p1, sha('a-changed')); // p1 drifted
    assert.equal(miss.bundle, null);
    assert.deepEqual(miss.invalidated, [p1]); // only affected entry
    const still = cache.lookup(p2, r2); // unrelated entry untouched
    assert.ok(still.bundle && still.receipt.servedFromCache, 'p2 still a hit');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('A06: identity isolation — cross-caller reuse is refused fail-closed', () => {
  const { dir } = setup('ns-a');
  try {
    const p = SEED_FILES[0];
    const rev = sha('v1');
    const a = new IncrementalRdcbCache({ cacheDir: dir, caller: 'ns-a' });
    a.store(p, rev, fakeBundle(p, rev));
    const b = new IncrementalRdcbCache({ cacheDir: dir, caller: 'ns-b' });
    const miss = b.lookup(p, rev); // same bytes, different caller
    assert.equal(miss.bundle, null, 'no bundle served cross-caller');
    assert.equal(miss.receipt, null, 'no reuse receipt fabricated');
    assert.deepEqual(miss.invalidated, [], 'other caller entry not invalidated');
    const a2 = new IncrementalRdcbCache({ cacheDir: dir, caller: 'ns-a' });
    assert.ok(a2.lookup(p, rev).bundle, 'owner still hits');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('A06: drift then regenerate — miss invalidates only drifted entry, re-store hits again with new revision', () => {
  const { dir, cache } = setup('ns-a');
  try {
    const [p1, p2] = SEED_FILES;
    const r1 = sha('a'), r2 = sha('b');
    cache.store(p1, r1, fakeBundle(p1, r1));
    cache.store(p2, r2, fakeBundle(p2, r2));
    const drifted = sha('a2');
    assert.equal(cache.lookup(p1, drifted).bundle, null, 'drifted revision misses');
    cache.store(p1, drifted, fakeBundle(p1, drifted));
    const hit = cache.lookup(p1, drifted);
    assert.ok(hit.bundle, 'regenerated bundle served');
    assert.equal(hit.receipt.sourceRevision, drifted);
    assert.equal(hit.receipt.executionClaimed, false);
    assert.ok(cache.lookup(p2, r2).bundle, 'untouched entry still hits');
    const entries = SEED_FILES.slice(0, 2).map(p => ({ path: p, revision: p === p1 ? drifted : r2 }));
    assert.equal(cache.reuseDigest(), canonicalReuseDigest(entries), 'digest tracks current revisions');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('A06: caller identity is required (no ambient auth)', () => {
  const dir = mkdtempSync(join(os.tmpdir(), 'arbor-a06-'));
  try {
    assert.throws(() => new IncrementalRdcbCache({ cacheDir: dir, caller: '' }), /caller identity required/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
