// hq/aii/fixtures/HQ-087-unnecessary-planned-features.mjs — AII benchmark
// fixture (PRD HQ-PRD-AII-001). Scenario HQ-087 (group J): "Which planned
// features are technically unnecessary because equivalent functionality already
// exists?"
// Engine: hq/lib/indexer.mjs duplicatePlannedFeatures — planned features whose
// capability ALREADY EXISTS and is already reachable from production code, so
// planning them again would duplicate live behaviour rather than fill a gap.
//
// Ground truth locked 2026-11-11 by running the live module against the live
// index (.hq/index.db) over 16 real vivim-web-harness roadmap items that were
// NOT done at authoring time. Read-only probe: no credentials, no private
// session content, no writes.
//
// Pinned live output:
//   implemented = 12, of which reachable (has a production consumer) = 11
//   duplicates = 11, each mapped to its existing equivalent:
//     RM01     mergeEvidenceGap             repos-hq/hq/lib/lake.mjs:378
//     Q07      buildPlanSpec                vivim-web-harness/studio/src/studio/orchestrator-patterns.mjs:163
//     B03      buildCanvasModel             repos-hq/hq/lib/canvas.mjs:387
//     B08      featureTestEvidence          repos-hq/hq/lib/dogfood.mjs:1193
//     Q22      budgetStatusFromUsage        repos-hq/hq/lib/model-budget.mjs:190
//     VALUE01  rankUnfinishedByUserValue    repos-hq/hq/lib/pmo.mjs:750
//     W04      SESSION_VIEWS_SCHEMA         repos-hq/hq/lib/session-views.mjs:15
//     FILES01  projectsForIndex             repos-hq/hq/lib/registry.mjs:162
//     SOURCE01 SOURCE_LINK_SCHEMA           repos-hq/hq/lib/annotation-v2.mjs:25
//     VOMEGA01 resolveWikiNaturalLanguage   repos-hq/hq/lib/comment-wiki-bridge.mjs:175
//     KB05     packContext                  repos-hq/hq/lib/semantic-optimizers.mjs:92
//
// The decisive control is H05 "Owner-approved capability activation engine":
// it IS implemented (createCapabilityActivationEngine exists) but has NO
// production consumer, so it is NOT a duplicate — the capability is not yet
// live, and planning it is not unnecessary. Counting implemented as unnecessary
// would report 12 and be wrong; the correct answer is 11.
// run() re-derives the same findings live on every invocation.
import { defineFixture, finding } from './harness.mjs';
import { openDb } from '../../lib/schema.mjs';
import { duplicatePlannedFeatures, plannedFeatureStatus } from '../../lib/indexer.mjs';
import { join } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

// The 16 roadmap anchors with their locked matcher terms.
const ANCHORS = {
  RM01: ['evidence', 'merge'],
  Q07: ['plan', 'build'],
  B03: ['build', 'canvas'],
  B08: ['test', 'evidence'],
  Q22: ['from', 'usage'],
  VALUE01: ['value', 'user'],
  W04: ['schema', 'views'],
  FILES01: ['for', 'projects'],
  SOURCE01: ['source', 'schema'],
  VOMEGA01: ['natural', 'language'],
  KB05: ['context', 'pack'],
  H05: ['activation', 'engine'],
  P01: ['linux', 'apk'],
  B06: ['chat', 'activation'],
  B07: ['time', 'travel'],
  W03: ['sqlite', 'ledger'],
};

function roadmapTitles(db) {
  const row = db.prepare(`
    SELECT f.id FROM files f JOIN projects p ON p.id = f.project_id
    WHERE p.name = 'vivim-web-harness' AND lower(f.path) = 'docs/roadmap.json'
  `).get();
  if (!row) return new Map();
  const content = db.prepare('SELECT content FROM content_fts WHERE rowid = ?').get(row.id);
  if (!content?.content) return new Map();
  const parsed = JSON.parse(content.content);
  return new Map((parsed.items || []).map((i) => [i.id, i]));
}

export default defineFixture({
  id: 'HQ-087',
  provenance: 'Ground truth locked 2026-11-11 by running the live hq/lib/indexer.mjs duplicatePlannedFeatures and plannedFeatureStatus against the live index (.hq/index.db) over 16 real vivim-web-harness roadmap items that were not done at authoring time, across all indexed projects (read-only probe, no credentials, no private session content). Pinned live output: 12 implemented, 11 reachable, so exactly 11 planned features are unnecessary; H05 is the control — implemented (createCapabilityActivationEngine) but with zero production consumers, so it is NOT unnecessary and is excluded. run() re-derives the same findings live.',
  expected: [
    { what: '11 planned features are technically unnecessary because equivalent functionality already exists', where: 'hq/lib/indexer.mjs duplicatePlannedFeatures' },
    { what: '12 planned features are implemented, but only 11 are unnecessary: 1 implemented feature has no production consumer', where: 'hq/lib/indexer.mjs duplicatePlannedFeatures' },
    { what: 'RM01 Roadmap evidence governance: SITREP, source/merge/runtime truth, owner lanes, critical-path reconciliation is unnecessary: mergeEvidenceGap already provides it', where: 'repos-hq/hq/lib/lake.mjs' },
    { what: 'KB05 KB retrieval, context pack, citations and DCB/chat integration is unnecessary: packContext already provides it', where: 'repos-hq/hq/lib/semantic-optimizers.mjs' },
    { what: 'H05 Owner-approved capability activation engine is implemented but not yet live, so it is not unnecessary', where: 'hq/lib/indexer.mjs duplicatePlannedFeatures' },
    { what: 'the unnecessary set is exactly the implemented and production-reachable set: 11 of 12 implemented', where: 'hq/lib/indexer.mjs duplicatePlannedFeatures' },
  ],
  run: async () => {
    const db = openDb(join(ROOT, '.hq', 'index.db'));
    try {
      const titles = roadmapTitles(db);
      const features = Object.entries(ANCHORS).map(([id, terms]) => ({
        id,
        title: titles.get(id)?.title ?? '',
        terms,
      }));

      const dups = duplicatePlannedFeatures(db, { features });
      const status = plannedFeatureStatus(db, { features });
      const implemented = status.filter((s) => s.implemented).length;
      const findings = [];

      findings.push(finding(
        `${dups.length} planned features are technically unnecessary because equivalent functionality already exists`,
        'hq/lib/indexer.mjs duplicatePlannedFeatures',
      ));
      findings.push(finding(
        `${implemented} planned features are implemented, but only ${dups.length} are unnecessary: ${implemented - dups.length} implemented feature has no production consumer`,
        'hq/lib/indexer.mjs duplicatePlannedFeatures',
      ));

      for (const dup of dups) {
        findings.push(finding(
          `${dup.id} ${dup.title} is unnecessary: ${dup.equivalent.name} already provides it`,
          `${dup.equivalent.project}/${dup.equivalent.path}`,
        ));
      }

      const h05 = status.find((s) => s.id === 'H05');
      findings.push(finding(
        `H05 ${h05.title} is implemented but not yet live, so it is not unnecessary`,
        'hq/lib/indexer.mjs duplicatePlannedFeatures',
      ));
      findings.push(finding(
        `the unnecessary set is exactly the implemented and production-reachable set: ${dups.length} of ${implemented} implemented`,
        'hq/lib/indexer.mjs duplicatePlannedFeatures',
      ));

      return findings;
    } finally {
      db.close();
    }
  },
});
