# File: hq/aii/fixtures/HQ-114-compare-registered-repos.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-114-compare-registered-repos.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8015 B |
| Lines | 109 |
| Hash | 3e7537260357 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| sha | function | 19 | no | const sha = (v) =&gt; createHash(&#39;sha256&#39;).update(v).digest(&#39;hex&#39;); |
| REV | const | 21 | no | const REV = &#39;rev-000001&#39;; |
| source | function | 22 | no | const source = (sid) =&gt; ({ id: sid, kind: &#39;repo&#39;, state: &#39;complete&#39;, revision: REV, owner: &#39;repos-hq&#39; }); |
| PREVIOUS_INPUT | const | 26 | no | const PREVIOUS_INPUT = { |
| NEXT_INPUT | const | 33 | no | const NEXT_INPUT = { |
| classifyOverlap | function | 46 | no | function classifyOverlap(prevRecords, nextRecords) { |
| prev | const | 47 | no | const prev = new Map(prevRecords.map((r) =&gt; [r.id, r])); |
| out | const | 48 | no | const out = { overlapping: [], complementary: [], novel: [] }; |
| old | const | 50 | no | const old = prev.get(n.id); |
| findings | const | 76 | no | const findings = []; |
| PREVIOUS | const | 77 | no | const PREVIOUS = buildCatalogueSnapshot(PREVIOUS_INPUT); |
| NEXT | const | 78 | no | const NEXT = buildCatalogueSnapshot({ ...NEXT_INPUT, previous: PREVIOUS }); |
| delta | const | 79 | no | const delta = diffCatalogueSnapshots(PREVIOUS, NEXT); |
| upsertIds | const | 80 | no | const upsertIds = delta.recordUpserts.map((r) =&gt; r.id).sort(); |
| overlap | const | 87 | no | const overlap = classifyOverlap(PREVIOUS.records, NEXT.records); |
| refused | variable | 98 | no | let refused = null; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 15 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/catalogue-delta.mjs | import | 16 | [hq/lib/catalogue-delta.mjs](../../lib/catalogue-delta.mjs.md) |
| node:crypto | import | 17 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-114-compare-registered-repos.mjs
// AII scenario HQ-114 (group N): "HQ should compare the newly registered repo against my existing project and surface overlapping, complementary, or novel capabilities with evidence."
// Engine: hq/lib/catalogue-delta.mjs — buildCatalogueSnapshot (:98) + diffCatalogueSnapshots
// (:124) over the seeded capability sets of the two repos, plus the overlap classifier.
//
// Ground truth LOCKED 2026-11-11 (this session):
//   - diffCatalogueSnapshots(previous, next) keys every change and digest-pins it
//     (catalogue-delta.mjs:124-133): recordUpserts = records whose hash changed vs previous.
//     A record present in both with the same digest = overlap; a digest change on the same
//     id = complementary evolution; a record only in next = novel.
//   - buildCatalogueSnapshot refuses records whose source is missing/blocked
//     (UNAVAILABLE_SOURCE_WRITE, catalogue-delta.mjs:110) — evidence from an uninspectable
//     source is never silently accepted.

import { defineFixture, finding } from './harness.mjs';
import { buildCatalogueSnapshot, diffCatalogueSnapshots } from '../../lib/catalogue-delta.mjs';
import { createHash } from 'node:crypto';

const sha = (v) => createHash('sha256').update(v).digest('hex');
// catalogue-delta.mjs:20 revision needs >= 6 chars of [A-Za-z0-9._:-]; sources carry an owner.
const REV = 'rev-000001';
const source = (sid) => ({ id: sid, kind: 'repo', state: 'complete', revision: REV, owner: 'repos-hq' });
const record = (rid, sourceId, contentDigest, sourceRevision = REV) => ({ id: rid, kind: 'capability', sourceId, sourceRevision, contentDigest, status: 'implemented', evidence: [] });

// Snapshots are built through the engine itself so digests are the engine's own.
const PREVIOUS_INPUT = {
  sources: [source('repos-hq')],
  records: [
    record('cap.bus-delivery', 'repos-hq', sha('bus-delivery-v1')),
    record('cap.receipts-ledger', 'repos-hq', sha('receipts-v1')),
  ],
};
const NEXT_INPUT = {
  // The evolved receipts-ledger digest requires a revision bump (catalogue-delta.mjs:113-114:
  // same revision + changed digest is a SAME_REVISION_CONFLICT).
  sources: [{ id: 'repos-hq', kind: 'repo', state: 'complete', revision: 'rev-000002', owner: 'repos-hq' }, source('harvested-external-repo')],
  records: [
    record('cap.bus-delivery', 'repos-hq', sha('bus-delivery-v1'), 'rev-000002'),
    record('cap.receipts-ledger', 'repos-hq', sha('receipts-v2'), 'rev-000002'),
    record('cap.pipeline-pattern', 'harvested-external-repo', sha('pipeline-v1')),
    record('cap.bus-bridge-feature', 'harvested-external-repo', sha('bridge-v1')),
  ],
};

// The overlap classifier over the snapshot diff.
function classifyOverlap(prevRecords, nextRecords) {
  const prev = new Map(prevRecords.map((r) => [r.id, r]));
  const out = { overlapping: [], complementary: [], novel: [] };
  for (const n of nextRecords) {
    const old = prev.get(n.id);
    if (!old) out.novel.push(n.id);
    else if (old.contentDigest === n.contentDigest) out.overlapping.push(n.id);
    else out.complementary.push(n.id);
  }
  return out;
}

export default defineFixture({
  id: 'HQ-114',
  provenance:
    '2026-11-11 (this session): locked from hq/lib/catalogue-delta.mjs exercised on seeded snapshots. ' +
    'diffCatalogueSnapshots (catalogue-delta.mjs:124-133) keys record changes by id+hash — same digest = overlap, ' +
    'changed digest = complementary evolution, new id = novel; buildCatalogueSnapshot (:98-121) refuses writes from ' +
    "missing/blocked sources (UNAVAILABLE_SOURCE_WRITE, catalogue-delta.mjs:110). The seeded comparison: 'repos-hq' " +
    "holds bus-delivery + receipts-ledger; the newly registered 'harvested-external-repo' adds pipeline-pattern and " +
    'bus-bridge-feature while receipts-ledger evolves. No workspace writes.',
  expected: [
    { what: 'cap.bus-delivery is overlapping: identical content digest in both snapshots (its revision bump still re-upserts it in the engine diff, which hashes the full record)', where: 'hq/lib/catalogue-delta.mjs diffCatalogueSnapshots' },
    { what: 'cap.receipts-ledger is complementary: same id, evolved content digest', where: 'hq/lib/catalogue-delta.mjs diffCatalogueSnapshots' },
    { what: 'cap.pipeline-pattern and cap.bus-bridge-feature are novel: present only in the newly registered repo', where: 'hq/lib/catalogue-delta.mjs diffCatalogueSnapshots' },
    { what: 'the engine diff reports all four changed records as upserts — every change is keyed and digest-pinned (catalogue-delta.mjs:124)', where: 'hq/lib/catalogue-delta.mjs diffCatalogueSnapshots' },
    { what: 'a record from a missing/blocked source is refused, never silently accepted (catalogue-delta.mjs:110)', where: 'hq/lib/catalogue-delta.mjs buildCatalogueSnapshot' },
    { what: 'every overlap/complementary/novel call cites its evidence digest', where: 'hq/lib/catalogue-delta.mjs diffCatalogueSnapshots' },
  ],
  run: async () => {
    const findings = [];
    const PREVIOUS = buildCatalogueSnapshot(PREVIOUS_INPUT);
    const NEXT = buildCatalogueSnapshot({ ...NEXT_INPUT, previous: PREVIOUS });
    const delta = diffCatalogueSnapshots(PREVIOUS, NEXT);
    const upsertIds = delta.recordUpserts.map((r) => r.id).sort();
```

_First 80 of 110 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
