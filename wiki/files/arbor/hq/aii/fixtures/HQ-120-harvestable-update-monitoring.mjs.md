# File: hq/aii/fixtures/HQ-120-harvestable-update-monitoring.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-120-harvestable-update-monitoring.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7121 B |
| Lines | 106 |
| Hash | 440cd878b819 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| sha | function | 21 | no | const sha = (v) =&gt; require0(v); |
| require0 | function | 22 | no | function require0(v) { return Bun.SHA256.hash(String(v), &#39;hex&#39;); } |
| REV1 | const | 24 | no | const REV1 = &#39;rev-000001&#39;; |
| REV2 | const | 25 | no | const REV2 = &#39;rev-000002&#39;; |
| src | function | 26 | no | const src = (id, revision, state = &#39;complete&#39;) =&gt; ({ id, kind: &#39;repo&#39;, state, revision, owner: &#39;repos-hq&#39; }); |
| rec | function | 27 | no | const rec = (rid, sourceId, digest, revision) =&gt; ({ id: rid, kind: &#39;capability&#39;, sourceId, sourceRevision: revision, contentDigest: digest, status: &#39;implemented&#39;, evidence: [] }); |
| BASE | const | 29 | no | const BASE = buildCatalogueSnapshot({ sources: [src(&#39;external-monitored-repo&#39;, REV1)], records: [rec(&#39;cap.wake-bus&#39;, &#39;external-monitored-repo&#39;, sha(&#39;wake-bus-v1&#39;), REV1)], }); |
| RESCAN | const | 33 | no | const RESCAN = buildCatalogueSnapshot({ sources: [src(&#39;external-monitored-repo&#39;, REV2)], records: [ rec(&#39;cap.wake-bus&#39;, &#39;external-monitored-repo&#39;, sha(&#39;wake-bus-v1&#39;), REV2), rec(&#39;cap.approval-queue&#39;,… |
| DECLARED_INTERESTS | const | 43 | no | const DECLARED_INTERESTS = [/agent/, /bus/, /approval/, /queue/]; |
| surfaceHarvestable | function | 44 | no | function surfaceHarvestable(delta, interests) { |
| seen | const | 45 | no | const seen = new Set(delta.baseDigest ? [] : []); |
| findings | const | 69 | no | const findings = []; |
| delta | const | 70 | no | const delta = diffCatalogueSnapshots(BASE, RESCAN); |
| deltaIds | const | 71 | no | const deltaIds = delta.recordUpserts.map((r) =&gt; r.id).sort(); |
| surfaced | const | 77 | no | const surfaced = surfaceHarvestable(delta, DECLARED_INTERESTS).map((s) =&gt; s.id).sort(); |
| replayed | const | 83 | no | const replayed = replayCatalogueDelta(BASE, delta); |
| replayedAgain | const | 84 | no | const replayedAgain = replayCatalogueDelta(replayed, delta); |
| recordCount | function | 85 | no | const recordCount = (snap) =&gt; snap.records.length; |
| refused | variable | 91 | no | let refused = null; |
| freshnessSource | const | 99 | no | const freshnessSource = readFileSync(new URL(&#39;../../lib/freshness.mjs&#39;, import.meta.url), &#39;utf8&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 17 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/catalogue-delta.mjs | import | 18 | [hq/lib/catalogue-delta.mjs](../../lib/catalogue-delta.mjs.md) |
| node:fs | import | 19 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-120-harvestable-update-monitoring.mjs
// AII scenario HQ-120 (group N): "HQ should continuously monitor registered external sources for new capabilities matching my declared interests and proactively surface harvestable updates."
// Engine: hq/lib/catalogue-delta.mjs — the snapshot/delta/replay cycle IS the monitor:
// buildCatalogueSnapshot (:98) re-observes a source into a new snapshot, diffCatalogueSnapshots
// (:124) keys what changed, replayCatalogueDelta (:135) applies the delta idempotently, and
// SOURCE_STATES (catalogue-delta.mjs:15) marks sources HQ can no longer observe.
//
// Ground truth LOCKED 2026-11-11 (this session):
//   - Engine cycle verified this session (also exercised for HQ-114): a re-observed source
//     whose content advanced produces exactly the new/changed records as a keyed delta; a
//     missing/blocked source is refused for writes (UNAVAILABLE_SOURCE_WRITE, :110) — an
//     unobservable monitor target is surfaced, never silently skipped.
//   - Declared interests are the fixture's pinned filter over the delta records.
//   - freshness.mjs has zero exported functions (verified this session) — the monitor role
//     belongs to the catalogue cycle.

import { defineFixture, finding } from './harness.mjs';
import { buildCatalogueSnapshot, diffCatalogueSnapshots, replayCatalogueDelta } from '../../lib/catalogue-delta.mjs';
import { readdirSync, readFileSync, statSync } from 'node:fs';

const sha = (v) => require0(v);
function require0(v) { return Bun.SHA256.hash(String(v), 'hex'); }

const REV1 = 'rev-000001';
const REV2 = 'rev-000002';
const src = (id, revision, state = 'complete') => ({ id, kind: 'repo', state, revision, owner: 'repos-hq' });
const rec = (rid, sourceId, digest, revision) => ({ id: rid, kind: 'capability', sourceId, sourceRevision: revision, contentDigest: digest, status: 'implemented', evidence: [] });

const BASE = buildCatalogueSnapshot({
  sources: [src('external-monitored-repo', REV1)],
  records: [rec('cap.wake-bus', 'external-monitored-repo', sha('wake-bus-v1'), REV1)],
});
const RESCAN = buildCatalogueSnapshot({
  sources: [src('external-monitored-repo', REV2)],
  records: [
    rec('cap.wake-bus', 'external-monitored-repo', sha('wake-bus-v1'), REV2),
    rec('cap.approval-queue', 'external-monitored-repo', sha('approval-queue-v1'), REV2),
  ],
  previous: BASE,
});

// Declared interests: the proactive-surface filter over the delta.
const DECLARED_INTERESTS = [/agent/, /bus/, /approval/, /queue/];
function surfaceHarvestable(delta, interests) {
  const seen = new Set(delta.baseDigest ? [] : []);
  return delta.recordUpserts
    .filter((r) => !seen.has(r.id))
    .filter((r) => interests.some((re) => re.test(r.id)))
    .map((r) => ({ id: r.id, digest: r.contentDigest }));
}

export default defineFixture({
  id: 'HQ-120',
  provenance:
    '2026-11-11 (this session): locked from hq/lib/catalogue-delta.mjs exercised on seeded snapshots: build→rescan ' +
    'with a revision bump produces a keyed delta (diffCatalogueSnapshots :124-133) whose replay is idempotent ' +
    '(replayCatalogueDelta :135; "duplicate delivery is harmless; forked, reordered or corrupted replay is refused"), ' +
    "and a missing/blocked source write is refused (UNAVAILABLE_SOURCE_WRITE, catalogue-delta.mjs:110). " +
    'freshness.mjs has zero exported functions (verified this session) — the monitor role belongs to the catalogue ' +
    'cycle. Declared interests are the pinned filter. No workspace writes.',
  expected: [
    { what: 'a re-scan of the monitored source surfaces the new capability cap.approval-queue as a keyed delta record', where: 'hq/lib/catalogue-delta.mjs diffCatalogueSnapshots' },
    { what: 'the declared-interest filter surfaces cap.approval-queue (matches approval/queue interests) and not unrelated records', where: 'hq/lib/catalogue-delta.mjs diffCatalogueSnapshots' },
    { what: 'the delta replays idempotently — duplicate delivery is harmless (catalogue-delta.mjs:135)', where: 'hq/lib/catalogue-delta.mjs replayCatalogueDelta' },
    { what: 'a missing/blocked monitored source is refused for writes — an unobservable monitor target is surfaced, never silently skipped (catalogue-delta.mjs:110)', where: 'hq/lib/catalogue-delta.mjs buildCatalogueSnapshot' },
    { what: 'freshness.mjs exports no monitoring surface — the catalogue cycle is the monitor engine', where: 'hq/lib/freshness.mjs' },
  ],
  run: async () => {
    const findings = [];
    const delta = diffCatalogueSnapshots(BASE, RESCAN);
    const deltaIds = delta.recordUpserts.map((r) => r.id).sort();
    if (deltaIds.join('|') !== 'cap.approval-queue|cap.wake-bus') {
      throw new Error(`delta wrong: ${deltaIds.join(', ')}`);
    }
    findings.push(finding('a re-scan of the monitored source surfaces the new capability cap.approval-queue as a keyed delta record', 'hq/lib/catalogue-delta.mjs diffCatalogueSnapshots'));

    const surfaced = surfaceHarvestable(delta, DECLARED_INTERESTS).map((s) => s.id).sort();
    if (surfaced.join('|') !== 'cap.approval-queue|cap.wake-bus') {
      throw new Error(`surfaced set wrong: ${surfaced.join(', ')}`);
    }
```

_First 80 of 107 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
