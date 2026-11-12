import test from 'node:test';
import assert from 'node:assert/strict';
import { comparePinned, digestManifest, HviCompareError, MANIFEST_SCHEMA } from './index.mjs';

const h = c => c.repeat(40);
const file = (path, c = 'a', capabilityIds = []) => ({ path, mode: '100644', kind: 'file', blobSha: h(c), capabilityIds });
function fixture(id, repo, rev, entries, completeness = 'complete', truncated = false) {
  const manifest = { schema: MANIFEST_SCHEMA, pinId: id, completeness, entries, truncated };
  manifest.digest = digestManifest(manifest);
  const pin = { pinId: id, provider: 'github', repoIdentity: repo, requestedRef: 'branch',
    resolvedCommitSha: h(rev), rootTreeSha: h('f'), manifestDigest: manifest.digest,
    acquiredAt: '2026-11-12T20:00:00Z', completeness, scope: 'development' };
  return { pin, manifest };
}
function run(fixtures, targetPinId, options = {}) {
  return comparePinned({ pins: fixtures.map(x => x.pin), manifests: fixtures.map(x => x.manifest), targetPinId, ...options });
}
function states(rows) { return rows.map(r => r.state).sort(); }
const a = fixture('a', 'owenservera/repo', 'a', [file('same.js'), file('old.js', 'b'), file('moved.js', 'c')]);
const b = fixture('b', 'owenservera/repo', 'b', [file('same.js'), file('old.js', 'd'), file('renamed.js', 'c'), file('new.js', 'e')]);
const c = fixture('c', 'owenservera/repo', 'c', [file('same.js'), file('renamed.js', 'c'), file('other.js', 'e')]);

test('T02: three immutable SHAs, one repo, order invariance and anchored variation', () => {
  const x = run([a, b, c], 'b', { pairwise: true });
  const y = run([c, a, b], 'b', { pairwise: true });
  assert.deepEqual(x, y);
  assert.equal(x.reproducibilityDigest, y.reproducibilityDigest);
  assert.equal(x.sourcePins.length, 3);
  assert.equal(x.pairwise.length, 3);
  assert.ok(x.sourceDeltas.some(r => r.state === 'EXACT_RELOCATION'));
  assert.ok(x.sourceDeltas.some(r => r.state === 'SAME_PATH_CHANGED'));
  const z = run([a, b, c], 'a');
  assert.notEqual(x.reproducibilityDigest, z.reproducibilityDigest);
  assert.equal(z.targetPinId, 'a');
});

test('T03: five repositories and optional pairwise no implicit HEAD', () => {
  const f = ['ARBOR', 'repos-hq', 'vivim-web-harness', 'tierflow', 'vivim-labs'].map((name, i) =>
    fixture('p' + i, 'owenservera/' + name, String(i), [file('README.md', String(i)), file('shared.js')]));
  const report = run(f, 'p0', { pairwise: true });
  assert.equal(report.coverage.length, 4);
  assert.equal(report.pairwise.length, 10);
  assert.equal(report.summary.runtimeParity, 'UNVERIFIED');
  assert.equal(report.runtimeProof.length, 0);
});

test('T06: relocated exact blobs; path changes; new files; physical absence only', () => {
  const x = run([a, b], 'b');
  assert.ok(states(x.sourceDeltas).includes('EXACT_RELOCATION'));
  assert.ok(states(x.sourceDeltas).includes('NEW_AT_TARGET'));
  assert.ok(states(x.sourceDeltas).includes('EXACT_BLOB'));
  assert.ok(x.sourceDeltas.every(d => d.decision === 'REVIEW_REQUIRED'));
  assert.equal(x.capabilityDeltas.filter(r => r.state === 'RUNTIME_VERIFIED').length, 0);
});

test('T12: split and combine stay review candidates, not equivalence', () => {
  const donor = fixture('donor', 'org/one', 'a', [file('feature.js', 'a', ['cap.x'])]);
  const target = fixture('target', 'org/two', 'b', [file('a.js', 'b', ['cap.x']), file('b.js', 'c', ['cap.x'])]);
  const x = run([donor, target], 'target');
  assert.ok(x.sourceDeltas.some(r => r.state === 'SPLIT_CANDIDATE'));
  assert.equal(x.identityCandidates[0].verdict, 'REVIEW_REQUIRED');
  const many = fixture('many', 'org/one', 'c', [file('part1.js', 'd', ['cap.x']), file('part2.js', 'e', ['cap.x'])]);
  const one = fixture('one', 'org/two', 'd', [file('joint.js', 'f', ['cap.x'])]);
  assert.ok(run([many, one], 'one').sourceDeltas.some(r => r.state === 'COMBINE_CANDIDATE'));
});

test('T13: partial or missing source cannot imply missing/novel/tombstone', () => {
  const partial = fixture('partial', 'org/p', 'd', [file('observed.js')], 'partial', true);
  const full = fixture('full', 'org/q', 'e', [file('elsewhere.js', 'b')]);
  const x = run([partial, full], 'full');
  assert.ok(x.sourceDeltas.every(r => r.state === 'UNOBSERVABLE'));
  assert.equal(x.unported.length, 0);
  assert.equal(JSON.stringify(x).includes('tombstone'), false);
});

test('T20: altered digest, same revision divergent manifest, invalid adapters fail closed', () => {
  const broken = structuredClone(a);
  broken.manifest.entries[0].blobSha = h('d');
  assert.throws(() => run([broken, b], 'b'), e => e instanceof HviCompareError && e.code === 'DIGEST_CONFLICT');
  const conflict = fixture('also-a', 'owenservera/repo', 'a', [file('changed.js', 'e')]);
  assert.throws(() => run([a, conflict], 'a'), e => e.code === 'DIGEST_CONFLICT');
  assert.throws(() => comparePinned({pins:[a.pin,b.pin],manifests:[],targetPinId:'a'}), e => e.code === 'INCOMPLETE_SCAN');
  assert.throws(() => run([a, b], 'unknown'), e => e.code === 'PIN_NOT_FOUND');
});

test('T17: invalid/sensitive paths refused, no implicit privilege', () => {
  const bad = fixture('bad', 'org/bad', 'd', [file('../private', 'c')]);
  assert.throws(() => run([bad, b], 'b'), e => e.code === 'SCOPE_ESCAPE');
  const secret = fixture('secret', 'org/bad', 'd', [file('profile/session.json', 'c')]);
  assert.throws(() => run([secret, b], 'b'), e => e.code === 'SOURCE_UNAUTHORIZED');
  assert.throws(() => run([a, b], 'b', { identityDecisions: [{ decision:'equivalent' }] }), e => e.code === 'EQUIVALENCE_UNPROVEN');
});

test('T19: bounded findings produce explicit truncated coverage, not a false complete report', () => {
  const x = run([a, b], 'b', { budgets: { maxFindings: 1 } });
  assert.equal(x.sourceDeltas.length, 1);
  assert.equal(x.limits.truncated, true);
  assert.equal(x.errors[0].code, 'RESOURCE_LIMIT');
  assert.ok(x.summary.observedFindings > 1);
  assert.throws(() => run([a, b], 'b', { budgets: { maxEntries: 1 } }), e => e.code === 'RESOURCE_LIMIT');
  assert.throws(() => run([a, b], 'b', { signal: { aborted:true } }), e => e.code === 'RESOURCE_LIMIT');
});

test('T05: manifest digest independent of entry order and read-only inputs', () => {
  const one = fixture('d', 'org/repo', 'a', [file('a.js'), file('b.js')]);
  const two = fixture('d', 'org/repo', 'a', [file('b.js'), file('a.js')]);
  assert.equal(one.manifest.digest, two.manifest.digest);
  const originals = structuredClone([a, b]);
  run([a, b], 'b');
  assert.deepEqual([a, b], originals);
});
