# File: hq/version-intelligence/report/test/report.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | hq/version-intelligence/report/test/report.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8886 B |
| Lines | 157 |
| Hash | ebee650c193c |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| sha | function | 5 | no | const sha = (character) =&gt; character.repeat(40); |
| mdigest | function | 6 | no | const mdigest = (character) =&gt; character.repeat(64); |
| fixture | function | 7 | no | function fixture(n = 2, opts = {}) { |
| sourcePins | const | 8 | no | const sourcePins = Array.from({ length: n }, (_, i) =&gt; ({ pinId: &#39;pin&#39; + i, repoIdentity: i % 2 ? &#39;owenservera/ARBOR&#39; : &#39;owenservera/repos-hq&#39;, resolvedCommitSha: sha(String(i + 1)), manifestDigest: … |
| evidenceIndex | const | 13 | no | const evidenceIndex = Array.from({ length: n }, (_, i) =&gt; ({ id: &#39;evidence&#39; + i, type: &#39;source_blob&#39;, commitSha: sourcePins[i].resolvedCommitSha, blobSha: sha(&#39;a&#39;), path: &#39;hq/lib/module-&#39; + i + &#39;.mjs… |
| input | const | 30 | no | const input = fixture(n); |
| out | const | 31 | no | const out = projectVersionComparison(input); |
| input | const | 42 | no | const input = fixture(3); |
| input | const | 48 | no | const input = fixture(5); |
| first | const | 49 | no | const first = projectVersionComparison(input); |
| second | const | 51 | no | const second = projectVersionComparison(input); |
| input | const | 57 | no | const input = fixture(5); |
| first | const | 58 | no | const first = projectVersionComparison(input, { limit: 2, offset: 0 }); |
| second | const | 59 | no | const second = projectVersionComparison(input, { limit: 2, offset: 2 }); |
| out | const | 70 | no | const out = projectVersionComparison(fixture(2, {partial:true})); |
| item | const | 71 | no | const item = out.table.rows.find(x =&gt; x.id === &#39;source0&#39;); |
| inc | const | 75 | no | const inc = projectVersionComparison(fixture(2, {partial:true}), {coverageFilter: &#39;incomplete&#39;}); |
| input | const | 81 | no | const input = fixture(); |
| out | const | 83 | no | const out = projectVersionComparison(input); |
| input | const | 89 | no | const input = fixture(); |
| output | const | 93 | no | const output = projectVersionComparison(input); |
| md | const | 94 | no | const md = toMigrationMarkdown(output); |
| csv | const | 95 | no | const csv = toReviewCsv(output); |
| source | const | 102 | no | const source = fixture(); |
| fork | const | 107 | no | const fork = fixture(); |
| bad | const | 116 | no | const bad = fixture(); bad.sourceDeltas = Array.from({length: 20_001}, (_, i) =&gt; ({id:&#39;x&#39;+i})); |
| input | const | 121 | no | const input = fixture(); |
| report | const | 123 | no | const report = projectVersionComparison(input); |
| sample | const | 129 | no | const sample = fixture(3); |
| formats | const | 130 | no | const formats = [&#39;json&#39;, &#39;markdown&#39;, &#39;csv&#39;, &#39;evidence-json&#39;]; |
| fixture | export | 135 | yes | export {fixture} |
| input | const | 138 | no | const input = fixture(); |
| verified | const | 142 | no | const verified = projectVersionComparison(input); |
| input | const | 148 | no | const input = fixture(); |
| out | const | 152 | no | const out = projectVersionComparison(input); |
| content | const | 154 | no | const content = exportVersionComparison(input, {format:&#39;markdown&#39;}) + exportVersionComparison(input, {format:&#39;evidence-json&#39;}); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../index.mjs | import | 3 | [hq/version-intelligence/report/index.mjs](../index.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateVersionComparison, projectVersionComparison, toMigrationMarkdown, toReviewCsv, exportVersionComparison } from '../index.mjs';

const sha = (character) => character.repeat(40);
const mdigest = (character) => character.repeat(64);
function fixture(n = 2, opts = {}) {
  const sourcePins = Array.from({ length: n }, (_, i) => ({
    pinId: 'pin' + i, repoIdentity: i % 2 ? 'owenservera/ARBOR' : 'owenservera/repos-hq',
    resolvedCommitSha: sha(String(i + 1)), manifestDigest: mdigest('a'),
    completeness: opts.partial && i === 0 ? 'partial' : 'complete'
  }));
  const evidenceIndex = Array.from({ length: n }, (_, i) => ({ id: 'evidence' + i, type: 'source_blob',
    commitSha: sourcePins[i].resolvedCommitSha, blobSha: sha('a'), path: 'hq/lib/module-' + i + '.mjs', lines: [1, 10] }));
  return {
    schema: 'arbor.hvi.version-comparison/1', targetPinId: 'pin1', sourcePins, evidenceIndex,
    sourceDeltas: Array.from({ length: n }, (_, i) => ({ id: 'source' + i, sourcePinId: 'pin' + i,
      category: i === 0 ? 'MISSING_AT_TARGET' : i % 2 ? 'EXACT_RELOCATION' : 'SPLIT_CANDIDATE',
      evidenceRefs: ['evidence' + i], sourcePath: 'hq/lib/module-' + i + '.mjs',
      sourceLines: [1, 5], sourceBlob: sha('a'), owner: 'hq', similarityConfidence: 0.6,
      certainty: 'candidate', pinStates: Object.fromEntries(sourcePins.map((p, j) => [p.pinId, j === i ? 'EXACT_RELOCATION' : 'UNOBSERVABLE'])) })),
    capabilityDeltas: [{ id: 'cap:host-status', sourcePinId: 'pin0', category: 'IMPORTED_NOT_WIRED',
      evidenceRefs: ['evidence0'], owner: 'host', sourcePath: 'apps/vivim-host/control/dispatcher.mjs' }],
    runtimeProof: [{ id: 't01', state: 'UNRUN' }, { id: 't02', state: 'TEST_EXECUTED', command: 'node --test', exitCode: 0 }]
  };
}

test('2/3/5 immutable pins are presented as distinct N-way columns', () => {
  for (const n of [2, 3, 5]) {
    const input = fixture(n);
    const out = projectVersionComparison(input);
    assert.equal(out.pins.length, n);
    assert.equal(out.table.rows.length, n + 1);
    assert.equal(new Set(out.pins.map(p => p.resolvedCommitSha)).size, n);
    assert.equal(out.runtimeAcceptance, 'NOT_DETERMINED_BY_SOURCE_REPORT');
    assert.match(toMigrationMarkdown(out), /N-way compact matrix/);
    assert.match(toReviewCsv(out), /source_sha/);
  }
});

test('same repository with 3 distinct revisions remains separate', () => {
  const input = fixture(3);
  input.sourcePins.forEach(pin => pin.repoIdentity = 'owenservera/repos-hq');
  assert.equal(projectVersionComparison(input).pins.length, 3);
});

test('source order and finding order cannot change digest', () => {
  const input = fixture(5);
  const first = projectVersionComparison(input);
  input.sourcePins.reverse(); input.sourceDeltas.reverse(); input.evidenceIndex.reverse();
  const second = projectVersionComparison(input);
  assert.equal(first.reproducibilityDigest, second.reproducibilityDigest);
  assert.deepEqual(first, second);
});

test('pagination is bounded, explicit, stable and export review rows are paged', () => {
  const input = fixture(5);
  const first = projectVersionComparison(input, { limit: 2, offset: 0 });
  const second = projectVersionComparison(input, { limit: 2, offset: 2 });
  assert.equal(first.table.total, 6);
  assert.equal(first.table.returned, 2);
  assert.equal(first.table.truncated, true);
  assert.equal(first.table.hasMore, true);
  assert.notDeepEqual(first.table.rows.map(x => x.id), second.table.rows.map(x => x.id));
  assert.equal(toReviewCsv(first).split('\r\n').filter(Boolean).length, 3);
  assert.equal(projectVersionComparison(input, {limit: 100000}).table.limit, 200);
});

test('partial source cannot assert missing/excluded or a tombstone; filter exposes uncertainty', () => {
  const out = projectVersionComparison(fixture(2, {partial:true}));
  const item = out.table.rows.find(x => x.id === 'source0');
  assert.equal(item.classification, 'UNOBSERVABLE');
  assert.equal(item.cells.pin0, 'UNOBSERVED');
  assert.ok(out.coverage.incompletePins.includes('pin0'));
  const inc = projectVersionComparison(fixture(2, {partial:true}), {coverageFilter: 'incomplete'});
  assert.ok(inc.table.rows.length >= 1);
  assert.equal(inc.summary.missingAtTargetSource, 0);
});

test('unprovided provenance and missing evidence do not become complete', () => {
```

_First 80 of 158 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
