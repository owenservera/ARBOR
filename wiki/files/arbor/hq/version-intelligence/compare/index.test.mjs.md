# File: hq/version-intelligence/compare/index.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/version-intelligence/compare/index.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6630 B |
| Lines | 111 |
| Hash | 75b3f3560d66 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| h | function | 5 | no | const h = c =&gt; c.repeat(40); |
| file | function | 6 | no | const file = (path, c = &#39;a&#39;, capabilityIds = []) =&gt; ({ path, mode: &#39;100644&#39;, kind: &#39;file&#39;, blobSha: h(c), capabilityIds }); |
| fixture | function | 7 | no | function fixture(id, repo, rev, entries, completeness = &#39;complete&#39;, truncated = false) { |
| manifest | const | 8 | no | const manifest = { schema: MANIFEST_SCHEMA, pinId: id, completeness, entries, truncated }; |
| pin | const | 10 | no | const pin = { pinId: id, provider: &#39;github&#39;, repoIdentity: repo, requestedRef: &#39;branch&#39;, |
| run | function | 15 | no | function run(fixtures, targetPinId, options = {}) { |
| states | function | 18 | no | function states(rows) { return rows.map(r =&gt; r.state).sort(); } |
| a | const | 19 | no | const a = fixture(&#39;a&#39;, &#39;owenservera/repo&#39;, &#39;a&#39;, [file(&#39;same.js&#39;), file(&#39;old.js&#39;, &#39;b&#39;), file(&#39;moved.js&#39;, &#39;c&#39;)]); |
| b | const | 20 | no | const b = fixture(&#39;b&#39;, &#39;owenservera/repo&#39;, &#39;b&#39;, [file(&#39;same.js&#39;), file(&#39;old.js&#39;, &#39;d&#39;), file(&#39;renamed.js&#39;, &#39;c&#39;), file(&#39;new.js&#39;, &#39;e&#39;)]); |
| c | const | 21 | no | const c = fixture(&#39;c&#39;, &#39;owenservera/repo&#39;, &#39;c&#39;, [file(&#39;same.js&#39;), file(&#39;renamed.js&#39;, &#39;c&#39;), file(&#39;other.js&#39;, &#39;e&#39;)]); |
| x | const | 24 | no | const x = run([a, b, c], &#39;b&#39;, { pairwise: true }); |
| y | const | 25 | no | const y = run([c, a, b], &#39;b&#39;, { pairwise: true }); |
| z | const | 32 | no | const z = run([a, b, c], &#39;a&#39;); |
| f | const | 38 | no | const f = [&#39;ARBOR&#39;, &#39;repos-hq&#39;, &#39;vivim-web-harness&#39;, &#39;tierflow&#39;, &#39;vivim-labs&#39;].map((name, i) =&gt; fixture(&#39;p&#39; + i, &#39;owenservera/&#39; + name, String(i), [file(&#39;README.md&#39;, String(i)), file(&#39;shared.js&#39;)])); |
| report | const | 40 | no | const report = run(f, &#39;p0&#39;, { pairwise: true }); |
| x | const | 48 | no | const x = run([a, b], &#39;b&#39;); |
| donor | const | 57 | no | const donor = fixture(&#39;donor&#39;, &#39;org/one&#39;, &#39;a&#39;, [file(&#39;feature.js&#39;, &#39;a&#39;, [&#39;cap.x&#39;])]); |
| target | const | 58 | no | const target = fixture(&#39;target&#39;, &#39;org/two&#39;, &#39;b&#39;, [file(&#39;a.js&#39;, &#39;b&#39;, [&#39;cap.x&#39;]), file(&#39;b.js&#39;, &#39;c&#39;, [&#39;cap.x&#39;])]); |
| x | const | 59 | no | const x = run([donor, target], &#39;target&#39;); |
| many | const | 62 | no | const many = fixture(&#39;many&#39;, &#39;org/one&#39;, &#39;c&#39;, [file(&#39;part1.js&#39;, &#39;d&#39;, [&#39;cap.x&#39;]), file(&#39;part2.js&#39;, &#39;e&#39;, [&#39;cap.x&#39;])]); |
| one | const | 63 | no | const one = fixture(&#39;one&#39;, &#39;org/two&#39;, &#39;d&#39;, [file(&#39;joint.js&#39;, &#39;f&#39;, [&#39;cap.x&#39;])]); |
| partial | const | 68 | no | const partial = fixture(&#39;partial&#39;, &#39;org/p&#39;, &#39;d&#39;, [file(&#39;observed.js&#39;)], &#39;partial&#39;, true); |
| full | const | 69 | no | const full = fixture(&#39;full&#39;, &#39;org/q&#39;, &#39;e&#39;, [file(&#39;elsewhere.js&#39;, &#39;b&#39;)]); |
| x | const | 70 | no | const x = run([partial, full], &#39;full&#39;); |
| broken | const | 77 | no | const broken = structuredClone(a); |
| conflict | const | 80 | no | const conflict = fixture(&#39;also-a&#39;, &#39;owenservera/repo&#39;, &#39;a&#39;, [file(&#39;changed.js&#39;, &#39;e&#39;)]); |
| bad | const | 87 | no | const bad = fixture(&#39;bad&#39;, &#39;org/bad&#39;, &#39;d&#39;, [file(&#39;../private&#39;, &#39;c&#39;)]); |
| secret | const | 89 | no | const secret = fixture(&#39;secret&#39;, &#39;org/bad&#39;, &#39;d&#39;, [file(&#39;profile/session.json&#39;, &#39;c&#39;)]); |
| x | const | 95 | no | const x = run([a, b], &#39;b&#39;, { budgets: { maxFindings: 1 } }); |
| one | const | 105 | no | const one = fixture(&#39;d&#39;, &#39;org/repo&#39;, &#39;a&#39;, [file(&#39;a.js&#39;), file(&#39;b.js&#39;)]); |
| two | const | 106 | no | const two = fixture(&#39;d&#39;, &#39;org/repo&#39;, &#39;a&#39;, [file(&#39;b.js&#39;), file(&#39;a.js&#39;)]); |
| originals | const | 108 | no | const originals = structuredClone([a, b]); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ./index.mjs | import | 3 | [hq/version-intelligence/compare/index.mjs](./index.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 112 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
