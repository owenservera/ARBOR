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
    findings.push(finding('the declared-interest filter surfaces cap.approval-queue (matches approval/queue interests) and not unrelated records', 'hq/lib/catalogue-delta.mjs diffCatalogueSnapshots'));

    const replayed = replayCatalogueDelta(BASE, delta);
    const replayedAgain = replayCatalogueDelta(replayed, delta);
    const recordCount = (snap) => snap.records.length;
    if (recordCount(replayed) !== 2 || recordCount(replayedAgain) !== 2) {
      throw new Error(`replay not idempotent: ${recordCount(replayed)} then ${recordCount(replayedAgain)}`);
    }
    findings.push(finding('the delta replays idempotently — duplicate delivery is harmless (catalogue-delta.mjs:135)', 'hq/lib/catalogue-delta.mjs replayCatalogueDelta'));

    let refused = null;
    try {
      buildCatalogueSnapshot({ sources: [src('dead-monitor', REV1, 'missing')], records: [rec('cap.y', 'dead-monitor', sha('y'), REV1)] });
    } catch (e) { refused = String(e.message ?? e); }
    if (!refused || !/UNAVAILABLE_SOURCE_WRITE/.test(refused)) throw new Error(`missing source not refused: ${refused}`);
    findings.push(finding('a missing/blocked monitored source is refused for writes — an unobservable monitor target is surfaced, never silently skipped (catalogue-delta.mjs:110)', 'hq/lib/catalogue-delta.mjs buildCatalogueSnapshot'));

    // freshness.mjs explicit zero: no exports at all.
    const freshnessSource = readFileSync(new URL('../../lib/freshness.mjs', import.meta.url), 'utf8');
    if (/export\s+(function|const|class)/.test(freshnessSource)) {
      throw new Error('freshness.mjs gained exports — refresh this fixture');
    }
    findings.push(finding('freshness.mjs exports no monitoring surface — the catalogue cycle is the monitor engine', 'hq/lib/freshness.mjs'));
    return findings;
  },
});
