# File: tests/hq-version-intelligence/integrated-nway.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | tests/hq-version-intelligence/integrated-nway.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 12703 B |
| Lines | 226 |
| Hash | 8f7bfb69752d |
| Test | yes |
| Generated | no |
| Component | tests |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| grant | function | 13 | no | const grant = async () =&gt; true; |
| noGrant | function | 14 | no | const noGrant = async () =&gt; false; |
| input | function | 15 | no | const input = (m, extra = {}) =&gt; ({ schema: HVI_TOOL_REQUEST_SCHEMA, sourceManifests: m, targetPinId: m.at(-1).pin.pinId, pairwise: false, includeParity: false, ...extra, }); |
| invented | function | 19 | no | async function invented(repo = &#39;synthetic/versioned&#39;, versions = [&#39;v1&#39;,&#39;v2&#39;,&#39;v3&#39;], options = {}) { |
| f | const | 20 | no | const f = syntheticSource(); |
| manifests | const | 21 | no | const manifests = []; |
| pin | const | 23 | no | const pin = await resolvePin({ provider: &#39;github&#39;, repo, ref, approvedScope: &#39;development&#39; }, { adapter: f.adapter, authorize: grant, acquiredAt: &#39;2026-01-01T00:00:00.000Z&#39; }); |
| clone | function | 31 | no | const clone = m =&gt; ({ ...m, pin: { ...m.pin }, entries: m.entries.map(x =&gt; ({ ...x })) }); |
| resign | function | 32 | no | const resign = m =&gt; { |
| rejectsCode | function | 38 | no | async function rejectsCode(promise, code) { |
| throwsCode | function | 41 | no | function throwsCode(fn, code) { |
| before | const | 47 | no | const before = JSON.stringify(f.calls); |
| out | const | 48 | no | const out = await runHviTool(input(manifests, { includeParity: true, pairwise: true }), { authorize: grant }); |
| pairs | const | 62 | no | const pairs = []; |
| two | const | 64 | no | const two = await runHviTool(input(pairs.slice(0, 2)), { authorize: grant }); |
| five | const | 65 | no | const five = await runHviTool(input(pairs), { authorize: grant }); |
| out | const | 74 | no | const out = await runHviTool(input(manifests, { includeParity: true, identityRecords: [] }), { authorize: grant }); |
| n | variable | 93 | no | let n = 0; |
| bad | const | 98 | no | const bad = clone(manifests[0]); bad.manifestDigest = &#39;0&#39;.repeat(64); |
| bad | const | 103 | no | const bad = clone(manifests[0]); bad.pin.manifestDigest = &#39;0&#39;.repeat(64); |
| bad | const | 108 | no | const bad = clone(manifests[0]); bad.entries[0].blobSha = &#39;f&#39;.repeat(40); |
| bad | const | 113 | no | const bad = clone(manifests[0]); bad.entries.reverse(); resign(bad); |
| bad | const | 118 | no | const bad = clone(manifests[0]); bad.entries.push({ ...bad.entries.at(-1) }); resign(bad); |
| b | const | 123 | no | const b = bridgeSourceManifest(manifests[0]); |
| b | const | 131 | no | const b = bridgeSourceManifest(manifests[0]); |
| row | const | 132 | no | const row = b.manifest.entries.find(x =&gt; x.kind === &#39;symlink&#39;); |
| b | const | 138 | no | const b = bridgeSourceManifest(manifests[1]); |
| b | const | 144 | no | const b = bridgeSourceManifest(manifests[0]); |
| f | const | 155 | no | const f = syntheticSource({ malicious: { path: &#39;../escape&#39;, type: &#39;blob&#39;, mode: &#39;100644&#39;, sha: &#39;f&#39;.repeat(40), size: 1 } }); |
| p | const | 157 | no | const p = await resolvePin({ repo: &#39;synthetic/versioned&#39;, provider: &#39;github&#39;, ref: &#39;v1&#39;, approvedScope: &#39;development&#39; }, { adapter: f.adapter, authorize: grant }); |
| f | const | 162 | no | const f = syntheticSource(); |
| p | const | 163 | no | const p = await resolvePin({ repo: &#39;synthetic/versioned&#39;, provider: &#39;github&#39;, ref: &#39;v1&#39;, approvedScope: &#39;development&#39; }, { adapter: f.adapter, authorize: grant }); |
| out | const | 170 | no | const out = await runHviTool(input(manifests), { authorize: grant }); |
| out | const | 177 | no | const out = await runHviTool(input(manifests), { authorize: grant }); |
| out | const | 183 | no | const out = await runHviTool(input(manifests), { authorize: grant }); |
| b | const | 189 | no | const b = bridgeSourceManifest(manifests[1]); |
| corrupted | const | 191 | no | const corrupted = { ...b.manifest, digest: b.receipt.aDigest }; |
| changed | const | 198 | no | const changed = manifests.map(x =&gt; ({ ...x, pin: { ...x.pin, sourceGrantRef: &#39;test-grant&#39; } })); |
| before | const | 220 | no | const before = JSON.stringify(f.calls); |
| output | const | 221 | no | const output = await runHviTool(input(manifests), { authorize: grant }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 2 | external |
| node:assert/strict | import | 3 | external |
| ../../hq/version-intelligence/sources/fixtures.mjs | import | 4 | [hq/version-intelligence/sources/fixtures.mjs](../../hq/version-intelligence/sources/fixtures.mjs.md) |
| ../../hq/version-intelligence/sources/snapshots.mjs | import | 5 | [hq/version-intelligence/sources/snapshots.mjs](../../hq/version-intelligence/sources/snapshots.mjs.md) |
| ../../hq/version-intelligence/integration/source-manifest-adapter.mjs | import | 6 | [hq/version-intelligence/integration/source-manifest-adapter.mjs](../../hq/version-intelligence/integration/source-manifest-adapter.mjs.md) |
| ../../hq/version-intelligence/integration/comparison-report-adapter.mjs | import | 7 | [hq/version-intelligence/integration/comparison-report-adapter.mjs](../../hq/version-intelligence/integration/comparison-report-adapter.mjs.md) |
| ../../hq/version-intelligence/integration/parity-evidence-adapter.mjs | import | 8 | [hq/version-intelligence/integration/parity-evidence-adapter.mjs](../../hq/version-intelligence/integration/parity-evidence-adapter.mjs.md) |
| ../../hq/version-intelligence/integration/index.mjs | import | 9 | [hq/version-intelligence/integration/index.mjs](../../hq/version-intelligence/integration/index.mjs.md) |
| ../../hq/version-intelligence/compare/index.mjs | import | 10 | [hq/version-intelligence/compare/index.mjs](../../hq/version-intelligence/compare/index.mjs.md) |
| ../../hq/version-intelligence/identity/index.mjs | import | 11 | [hq/version-intelligence/identity/index.mjs](../../hq/version-intelligence/identity/index.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 227 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
