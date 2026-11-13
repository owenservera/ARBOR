// G1 fully invented Git-object fixtures only. No real ARBOR/VIVIM/Labs comparison.
import test from 'node:test';
import assert from 'node:assert/strict';
import { syntheticSource, SYNTHETIC_SHAS } from '../../hq/version-intelligence/sources/fixtures.mjs';
import { resolvePin, snapshotAt, verifyPin, readPinnedBlob, manifestDigestOf } from '../../hq/version-intelligence/sources/snapshots.mjs';
import { bridgeSourceManifest, bridgeSourceManifests } from '../../hq/version-intelligence/integration/source-manifest-adapter.mjs';
import { projectIntegratedReport } from '../../hq/version-intelligence/integration/comparison-report-adapter.mjs';
import { joinParityEvidence } from '../../hq/version-intelligence/integration/parity-evidence-adapter.mjs';
import { runHviTool, HVI_CAPABILITY_ID, HVI_TOOL_REQUEST_SCHEMA } from '../../hq/version-intelligence/integration/index.mjs';
import { comparePinned } from '../../hq/version-intelligence/compare/index.mjs';
import { stableLineageId, sourceScopedRevisionId } from '../../hq/version-intelligence/identity/index.mjs';

const grant = async () => true;
const noGrant = async () => false;
const input = (m, extra = {}) => ({
  schema: HVI_TOOL_REQUEST_SCHEMA, sourceManifests: m,
  targetPinId: m.at(-1).pin.pinId, pairwise: false, includeParity: false, ...extra,
});
async function invented(repo = 'synthetic/versioned', versions = ['v1','v2','v3'], options = {}) {
  const f = syntheticSource();
  const manifests = [];
  for (const ref of versions) {
    const pin = await resolvePin({ provider: 'github', repo, ref, approvedScope: 'development' },
      { adapter: f.adapter, authorize: grant, acquiredAt: '2026-01-01T00:00:00.000Z' });
    manifests.push(await snapshotAt(pin, { adapter: f.adapter, authorize: grant,
      inspectContent: options.inspectContent ?? true,
      limits: options.limits || {} }));
  }
  return { f, manifests };
}
const clone = m => ({ ...m, pin: { ...m.pin }, entries: m.entries.map(x => ({ ...x })) });
const resign = m => {
  m.observedEntries = m.entries.length;
  m.manifestDigest = manifestDigestOf(m);
  m.pin.manifestDigest = m.manifestDigest;
  return m;
};
async function rejectsCode(promise, code) {
  await assert.rejects(promise, e => e?.code === code);
}
function throwsCode(fn, code) {
  assert.throws(fn, e => e?.code === code);
}

test('G1 positive: 3 immutable same-repo revisions, exact move, donor coverage and offline replay', async () => {
  const { f, manifests } = await invented();
  const before = JSON.stringify(f.calls);
  const out = await runHviTool(input(manifests, { includeParity: true, pairwise: true }), { authorize: grant });
  assert.equal(out.capabilityId, HVI_CAPABILITY_ID);
  assert.equal(out.comparison.sourcePins.length, 3);
  assert.equal(new Set(out.sourcePins.map(p => p.pinId)).size, 3);
  assert.equal(out.comparison.coverage.length, 2);
  assert.ok(out.comparison.sourceDeltas.some(d => d.state === 'EXACT_RELOCATION' && d.originPath === 'src/first.mjs'));
  assert.equal(out.runtimeAccepted, false);
  assert.equal(out.hostBound, false);
  assert.equal(out.parity.length, 2);
  assert.deepEqual(out.adapterReceipts.map(r => r.losses), [[],[],[]]);
  assert.equal(JSON.stringify(f.calls), before, 'comparison must use frozen objects only');
});

test('G1 positive: 2 and 5 independent invented repositories (not real donor corpora)', async () => {
  const pairs = [];
  for (let i = 0; i < 5; i++) pairs.push((await invented('synthetic/repo' + i, ['v2'])).manifests[0]);
  const two = await runHviTool(input(pairs.slice(0, 2)), { authorize: grant });
  const five = await runHviTool(input(pairs), { authorize: grant });
  assert.equal(two.comparison.coverage.length, 1);
  assert.equal(five.comparison.coverage.length, 4);
  assert.equal(new Set(five.sourcePins.map(x => x.pinId)).size, 5);
  assert.equal(new Set(five.sourcePins.map(x => x.repoIdentity)).size, 5);
});

test('G1 positive: source and capability evidence are not interchangeable', async () => {
  const { manifests } = await invented();
  const out = await runHviTool(input(manifests, { includeParity: true, identityRecords: [] }), { authorize: grant });
  assert.ok(out.parity.flatMap(p => p.joinedRows).every(r => r.capabilityState === 'UNKNOWN' &&
    r.ownerDecision === 'UNKNOWN_UNREVIEWED' && r.runtimeEvidence === 'UNRUN'));
  assert.equal(out.identity.policy.equivalence, 'review_annotation_never_merge');
  assert.ok(out.evidenceReport.donorCoverage.length === 2);
  assert.equal(out.evidenceReport.originalComparison.reproducibilityDigest,
    out.comparison.reproducibilityDigest);
});

test('T01 refuse missing explicit authorization', async () => {
  const { manifests } = await invented();
  await rejectsCode(runHviTool(input(manifests)), 'SOURCE_UNAUTHORIZED');
});
test('T02 refuse revoked live grant', async () => {
  const { manifests } = await invented();
  await rejectsCode(runHviTool(input(manifests), { authorize: noGrant }), 'SOURCE_UNAUTHORIZED');
});
test('T03 refuse grant denied for the second source', async () => {
  const { manifests } = await invented();
  let n = 0;
  await rejectsCode(runHviTool(input(manifests), { authorize: () => ++n === 1 }), 'SOURCE_UNAUTHORIZED');
});
test('T04 fail closed on corrupted A manifest digest', async () => {
  const { manifests } = await invented();
  const bad = clone(manifests[0]); bad.manifestDigest = '0'.repeat(64);
  throwsCode(() => bridgeSourceManifest(bad), 'DIGEST_CONFLICT');
});
test('T05 fail closed on corrupted A pin digest copy', async () => {
  const { manifests } = await invented();
  const bad = clone(manifests[0]); bad.pin.manifestDigest = '0'.repeat(64);
  throwsCode(() => bridgeSourceManifest(bad), 'DIGEST_CONFLICT');
});
test('T06 fail closed on changed native blob with unchanged digest', async () => {
  const { manifests } = await invented();
  const bad = clone(manifests[0]); bad.entries[0].blobSha = 'f'.repeat(40);
  throwsCode(() => bridgeSourceManifest(bad), 'DIGEST_CONFLICT');
});
test('T07 reject reordered native entries even with recomputed hash', async () => {
  const { manifests } = await invented();
  const bad = clone(manifests[0]); bad.entries.reverse(); resign(bad);
  throwsCode(() => bridgeSourceManifest(bad), 'ID_CONFLICT');
});
test('T08 reject native entry duplication even if re-signed', async () => {
  const { manifests } = await invented();
  const bad = clone(manifests[0]); bad.entries.push({ ...bad.entries.at(-1) }); resign(bad);
  throwsCode(() => bridgeSourceManifest(bad), 'ID_CONFLICT');
});
test('T09 redact credential path and never reinterpret its omission as complete', async () => {
  const { manifests } = await invented();
  const b = bridgeSourceManifest(manifests[0]);
  assert.ok(b.receipt.policyOmissions > 0);
  assert.equal(b.manifest.completeness, 'partial');
  assert.equal(b.manifest.truncated, true);
  assert.ok(b.manifest.entries.every(x => !x.path.startsWith('.env')));
});
test('T10 symlinks remain metadata, not dereferenced content', async () => {
  const { manifests } = await invented();
  const b = bridgeSourceManifest(manifests[0]);
  const row = b.manifest.entries.find(x => x.kind === 'symlink');
  assert.equal(row.excludedReason, 'SYMLINK_NOT_FOLLOWED');
  assert.equal(row.nativeMetadata.symlinkTarget, null);
});
test('T11 submodule is not a recursively trusted checkout', async () => {
  const { manifests } = await invented();
  const b = bridgeSourceManifest(manifests[1]);
  assert.equal(b.manifest.entries.find(x => x.kind === 'submodule').excludedReason,
    'SUBMODULE_NOT_FOLLOWED');
});
test('T12 LFS pointer is never treated as underlying large content', async () => {
  const { manifests } = await invented();
  const b = bridgeSourceManifest(manifests[0]);
  assert.equal(b.manifest.entries.find(x => x.path === 'assets/big.dat').excludedReason,
    'LFS_POINTER_NOT_CONTENT');
});
test('T13 require immutable ref: moved tag is rejected by A verification', async () => {
  const { f, manifests } = await invented('synthetic/versioned',['v1']);
  f.refTable.set('v1', SYNTHETIC_SHAS.v2);
  await rejectsCode(verifyPin(manifests[0].pin, { adapter: f.adapter, authorize: grant }),
    'PIN_MOVED');
});
test('T14 reject scope traversal via injected Git tree entry', async () => {
  const f = syntheticSource({ malicious: { path: '../escape', type: 'blob',
    mode: '100644', sha: 'f'.repeat(40), size: 1 } });
  const p = await resolvePin({ repo: 'synthetic/versioned', provider: 'github',
    ref: 'v1', approvedScope: 'development' }, { adapter: f.adapter, authorize: grant });
  await rejectsCode(snapshotAt(p, { adapter: f.adapter, authorize: grant }), 'SCOPE_ESCAPE');
});
test('T15 fail source acquisition authorization before page traversal', async () => {
  const f = syntheticSource();
  const p = await resolvePin({ repo: 'synthetic/versioned', provider: 'github',
    ref: 'v1', approvedScope: 'development' }, { adapter: f.adapter, authorize: grant });
  await rejectsCode(snapshotAt(p, { adapter: f.adapter,
    authorize: ctx => ctx.operation !== 'source.snapshot.page' }), 'SOURCE_UNAUTHORIZED');
});
test('T16 partial bounded scans do not imply missing capability', async () => {
  const { manifests } = await invented('synthetic/versioned',['v1','v2'], { limits: { maxEntries: 2 } });
  const out = await runHviTool(input(manifests), { authorize: grant });
  assert.ok(out.comparison.sourcePins.every(x => x.completeness === 'partial'));
  assert.equal(out.evidenceReport.status, 'INCOMPLETE_SOURCE_EVIDENCE');
  assert.equal(out.comparison.summary.runtimeParity, 'UNVERIFIED');
});
test('T17 reject the incompatible F v1 comparison schema', async () => {
  const { manifests } = await invented();
  const out = await runHviTool(input(manifests), { authorize: grant });
  throwsCode(() => projectIntegratedReport({
    ...out.comparison, schema: 'arbor.hvi.comparison/1' }), 'INVALID_COMPARISON');
});
test('T18 reject corrupt C reproducibility digest', async () => {
  const { manifests } = await invented();
  const out = await runHviTool(input(manifests), { authorize: grant });
  throwsCode(() => projectIntegratedReport({
    ...out.comparison, reproducibilityDigest: '0'.repeat(64) }), 'DIGEST_CONFLICT');
});
test('T19 C projection hash is distinct from A native manifest hash', async () => {
  const { manifests } = await invented();
  const b = bridgeSourceManifest(manifests[1]);
  assert.notEqual(b.receipt.aDigest, b.receipt.cProjectionDigest);
  const corrupted = { ...b.manifest, digest: b.receipt.aDigest };
  throwsCode(() => comparePinned({ pins:[b.pin,bridgeSourceManifest(manifests[2]).pin],
    manifests:[corrupted,bridgeSourceManifest(manifests[2]).manifest],
    targetPinId:manifests[2].pin.pinId }), 'DIGEST_CONFLICT');
});
test('T20 reject source grant forged in metadata without callback', async () => {
  const { manifests } = await invented();
  const changed = manifests.map(x => ({ ...x, pin: { ...x.pin, sourceGrantRef: 'test-grant' } }));
  await rejectsCode(runHviTool(input(changed)), 'SOURCE_UNAUTHORIZED');
});
test('T21 identity same-repo rev changes identity but not lineage', () => {
  assert.notEqual(sourceScopedRevisionId('synthetic/repo', 'a'.repeat(40), 'thing'),
    sourceScopedRevisionId('synthetic/repo', 'b'.repeat(40), 'thing'));
  assert.equal(stableLineageId('synthetic/repo','thing'), stableLineageId('synthetic/repo','thing'));
  assert.notEqual(stableLineageId('synthetic/repo','thing'),
    stableLineageId('synthetic/other','thing'));
});
test('T22 no unverified owner equivalence is adopted', async () => {
  const { manifests } = await invented();
  await rejectsCode(runHviTool(input(manifests, {
    identityDecisions:[{ decision:'equivalent' }] }), { authorize: grant }), 'EQUIVALENCE_UNPROVEN');
});
test('T23 explicit resource ceiling is fail closed', async () => {
  const { manifests } = await invented();
  await rejectsCode(runHviTool(input(manifests,{budgets:{maxEntries:1}}),
    { authorize: grant }), 'RESOURCE_LIMIT');
});
test('T24 no donor checkout/source write is touched during offline replay', async () => {
  const { f, manifests } = await invented();
  const before = JSON.stringify(f.calls);
  const output = await runHviTool(input(manifests), { authorize: grant });
  assert.equal(JSON.stringify(f.calls), before);
  assert.equal(typeof f.adapter.writeFile, 'undefined');
  assert.equal(typeof f.adapter.checkout, 'undefined');
  assert.equal(output.sourceAuthority, 'READ_ONLY_DEVELOPMENT');
});
