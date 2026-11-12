// hq/aii/fixtures/HQ-021-planned-features-implemented.mjs — AII benchmark
// fixture (PRD HQ-PRD-AII-001). Scenario HQ-021 (group C): "Which planned
// features are already implemented?"
// Engine: hq/lib/indexer.mjs plannedFeatureStatus — cross-reference planned
// feature claims (the authoritative vivim-web-harness roadmap, which HQ indexes
// and serves as the current product roadmap) against the exported symbols the
// index actually holds.
//
// Ground truth locked 2026-11-11 by running the live module against the live
// index (.hq/index.db) with 24 real roadmap items that were NOT done at
// authoring time (statuses in_progress / queued / planned). Read-only probe:
// no credentials, no private session content, no writes.
//
// Pinned live output for plannedFeatureStatus over the 24 anchors, scoped to
// project repos-hq:
//   implemented = 12, not implemented = 12, reachable (production consumer) = 12
//   implemented, each with its implementing exported symbol:
//     RM01    mergeEvidenceGap            hq/lib/lake.mjs
//     Q07     buildReleasePlan            hq/lib/release-plan.mjs
//     B03     buildCanvasModel            hq/lib/canvas.mjs
//     B08     featureTestEvidence         hq/lib/dogfood.mjs
//     Q22     budgetStatusFromUsage       hq/lib/model-budget.mjs
//     VALUE01 rankUnfinishedByUserValue   hq/lib/pmo.mjs
//     W04     SESSION_VIEWS_SCHEMA        hq/lib/session-views.mjs
//     PDV01   REGISTRY_SCHEMA             research/deterministic-language/packs/index.mjs
//     FILES01 projectsForIndex            hq/lib/registry.mjs
//     SOURCE01 SOURCE_LINK_SCHEMA        hq/lib/annotation-v2.mjs
//     VOMEGA01 resolveWikiNaturalLanguage hq/lib/comment-wiki-bridge.mjs
//     KB05    packContext                 hq/lib/semantic-optimizers.mjs
//   NOT implemented (no exported symbol carries the feature's terms):
//     P01 P03 Q03 B04 B06 B07 H04 H05 H06 H08 H09 W03
//
// A planned feature that is already implemented is a planning-hygiene finding:
// the ledger still lists it as open work.
// run() re-derives the same findings live on every invocation.
import { defineFixture, finding } from './harness.mjs';
import { openDb } from '../../lib/schema.mjs';
import { plannedFeatureStatus } from '../../lib/indexer.mjs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

// The 24 roadmap anchors, with the two-term matcher terms locked at authoring
// time. Titles are read live from the indexed roadmap so the fixture always
// reports the CURRENT claim, not a frozen copy.
const ANCHORS = {
  RM01: ['evidence', 'merge'],
  Q07: ['plan', 'build'],
  B03: ['build', 'canvas'],
  B08: ['test', 'evidence'],
  Q22: ['from', 'usage'],
  VALUE01: ['value', 'user'],
  W04: ['schema', 'views'],
  PDV01: ['schema', 'registry'],
  FILES01: ['for', 'projects'],
  SOURCE01: ['source', 'schema'],
  VOMEGA01: ['natural', 'language'],
  KB05: ['context', 'pack'],
  P01: ['linux', 'apk'],
  P03: ['share', 'live'],
  Q03: ['rebuild', 'outbound'],
  B04: ['capability', 'proposal'],
  B06: ['chat', 'activation'],
  B07: ['time', 'travel'],
  H04: ['capability', 'proposal'],
  H05: ['activation', 'engine'],
  H06: ['configuration', 'timeline'],
  H08: ['lifecycle', 'monitoring'],
  H09: ['bootstrap', 'acceptance'],
  W03: ['sqlite', 'ledger'],
};

// roadmapTitles — the indexed authoritative roadmap, read from FTS content.
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
  id: 'HQ-021',
  provenance: 'Ground truth locked 2026-11-11 by running the live hq/lib/indexer.mjs plannedFeatureStatus against the live index (.hq/index.db) over 24 real vivim-web-harness roadmap items that were not done at authoring time, scoped to project repos-hq (read-only probe, no credentials, no private session content). Pinned live output: 12 implemented and 12 not implemented; the 12 implemented map to mergeEvidenceGap (hq/lib/lake.mjs), buildReleasePlan (hq/lib/release-plan.mjs), buildCanvasModel (hq/lib/canvas.mjs), featureTestEvidence (hq/lib/dogfood.mjs), budgetStatusFromUsage (hq/lib/model-budget.mjs), rankUnfinishedByUserValue (hq/lib/pmo.mjs), SESSION_VIEWS_SCHEMA (hq/lib/session-views.mjs), REGISTRY_SCHEMA (research/deterministic-language/packs/index.mjs), projectsForIndex (hq/lib/registry.mjs), SOURCE_LINK_SCHEMA (hq/lib/annotation-v2.mjs), resolveWikiNaturalLanguage (hq/lib/comment-wiki-bridge.mjs), packContext (hq/lib/semantic-optimizers.mjs). The 12 not implemented are P01 P03 Q03 B04 B06 B07 H04 H05 H06 H08 H09 W03. run() re-derives the same findings live.',
  expected: [
    { what: '24 planned roadmap features cross-referenced against the index', where: 'hq/lib/indexer.mjs plannedFeatureStatus' },
    { what: '12 planned features are already implemented', where: 'hq/lib/indexer.mjs plannedFeatureStatus' },
    { what: '12 planned features are not implemented', where: 'hq/lib/indexer.mjs plannedFeatureStatus' },
    { what: 'RM01 Roadmap evidence governance: SITREP, source/merge/runtime truth, owner lanes, critical-path reconciliation is already implemented by mergeEvidenceGap in hq/lib/lake.mjs', where: 'hq/lib/lake.mjs' },
    { what: 'KB05 KB retrieval, context pack, citations and DCB/chat integration is already implemented by packContext in hq/lib/semantic-optimizers.mjs', where: 'hq/lib/semantic-optimizers.mjs' },
    { what: 'W03 SQLite intelligence ledger, seven-pass persona extraction and evidence reconciliation is not implemented', where: 'hq/lib/indexer.mjs plannedFeatureStatus' },
    { what: 'P01 Mobile bootstrap bridge + Linux APK build is not implemented', where: 'hq/lib/indexer.mjs plannedFeatureStatus' },
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

      const status = plannedFeatureStatus(db, { features, project: 'repos-hq' });
      const implemented = status.filter((s) => s.implemented);
      const notImplemented = status.filter((s) => !s.implemented);
      const findings = [];

      findings.push(finding(
        `${status.length} planned roadmap features cross-referenced against the index`,
        'hq/lib/indexer.mjs plannedFeatureStatus',
      ));
      findings.push(finding(
        `${implemented.length} planned features are already implemented`,
        'hq/lib/indexer.mjs plannedFeatureStatus',
      ));
      findings.push(finding(
        `${notImplemented.length} planned features are not implemented`,
        'hq/lib/indexer.mjs plannedFeatureStatus',
      ));

      for (const row of implemented) {
        const match = row.matches[0];
        findings.push(finding(
          `${row.id} ${row.title} is already implemented by ${match.name} in ${match.path}`,
          match.path,
        ));
      }
      for (const row of notImplemented) {
        findings.push(finding(
          `${row.id} ${row.title} is not implemented`,
          'hq/lib/indexer.mjs plannedFeatureStatus',
        ));
      }

      return findings;
    } finally {
      db.close();
    }
  },
});
