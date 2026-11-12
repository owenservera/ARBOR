// hq/aii/fixtures/HQ-009-indexing-coverage-gaps.mjs
// AII build lane "p1-existing-surface-fixtures". Scenario HQ-009 (group A):
// "Which parts of this workspace are outside our normal indexing coverage?"
//
// Ground truth LOCKED 2026-11-11 from live output on branch main:
//   bun hq/bin/hq.mjs docs health
//     -> "Document health" then Missing families: 3, Orphans: 885, Stale: 48,
//        Duplicates: 1, Conflicts: 4.
//        The missing families are "08", "10", "13" (hq/lib/canon.mjs
//        documentHealth.missingFamilies).
//   bun hq/bin/hq.mjs lake drift
//     -> Stale indexes: 1, Dirty spaces: 2, Ahead/behind: 4, Stale docs: 95,
//        Open tasks: 0, Missing docs: 0.
//   hq/lib/freshness.mjs collectStaleFiles (hq/lib/freshness.mjs:19) diffs the
//   index against disk per project and returns {project, path, reason} with
//   reason in {new, changed, deleted}. Live: 36 stale entries across the 4
//   projects, reasons changed/new/deleted all present.
//
// The coverage GAP itself is the stable fact (which document families are
// missing, which index-vs-disk reasons exist); the counts drift as lanes index
// and write, so run() re-derives every number live.
import { defineFixture, finding, runHq } from './harness.mjs';
import { openDb } from '../../lib/schema.mjs';
import { documentHealth } from '../../lib/canon.mjs';
import { collectStaleFiles } from '../../lib/freshness.mjs';
import { loadConfig, projectsForIndex } from '../../lib/registry.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export default defineFixture({
  id: 'HQ-009',
  provenance: 'Locked 2026-11-11 on branch main from live output: bun hq/bin/hq.mjs docs health printed "Document health / Missing families: 3 / Orphans: 885 / Stale: 48 / Duplicates: 1 / Conflicts: 4", and documentHealth() (hq/lib/canon.mjs:192) names the missing families as 08, 10 and 13. bun hq/bin/hq.mjs lake drift printed Stale indexes: 1, Dirty spaces: 2, Ahead/behind: 4, Stale docs: 95, Open tasks: 0, Missing docs: 0. collectStaleFiles() (hq/lib/freshness.mjs:19) returned 36 stale entries across the 4 indexed projects with reasons changed, new and deleted all present — it diffs the index rows against the on-disk file universe and reports reason new|changed|deleted. All counts drift as concurrent lanes index and write, so the expectations pin the coverage gaps themselves (the missing family ids, the three staleness reasons, the six docs-health dimensions) and run() re-derives every number live. REFRESH 2026-11-11T22:1xZ: concurrent lane doc reorganization made family 11 (Memory & durable learning — memory.md/notes.md/preferences.md/lessons.md/facts.md patterns, hq/lib/canon.mjs:61) newly missing after the morning lock; live documentHealth now reports missing families 08, 10, 11, 13 (bun hq/bin/hq.mjs docs health printed "Missing families: 4"). Re-locked with the refreshed family set; every other expectation unchanged.',
  expected: [
    { what: 'docs health reports missing families, orphans, stale, duplicates and conflicts', where: 'hq/bin/hq.mjs docs health' },
    { what: /^Missing families: \d+$/, where: 'hq/bin/hq.mjs docs health' },
    { what: /^Orphans: \d+$/, where: 'hq/bin/hq.mjs docs health' },
    { what: /^Stale: \d+$/, where: 'hq/bin/hq.mjs docs health' },
    { what: /^Duplicates: \d+$/, where: 'hq/bin/hq.mjs docs health' },
    { what: /^Conflicts: \d+$/, where: 'hq/bin/hq.mjs docs health' },
    { what: 'missing document families: 08, 10, 11, 13', where: 'hq/lib/canon.mjs documentHealth' },
    { what: 'lake drift reports stale indexes, dirty spaces, ahead/behind, stale docs, open tasks and missing docs', where: 'hq/bin/hq.mjs lake drift' },
    { what: /^Stale indexes: \d+$/, where: 'hq/bin/hq.mjs lake drift' },
    { what: /^Missing docs: \d+$/, where: 'hq/bin/hq.mjs lake drift' },
    { what: 'index-vs-disk staleness reasons: changed, deleted, new', where: 'hq/lib/freshness.mjs collectStaleFiles' },
    { what: /^\d+ stale files detected against the index across the indexed projects$/, where: 'hq/lib/freshness.mjs collectStaleFiles' },
  ],
  run: async () => {
    const findings = [];

    const health = runHq(['docs', 'health'], { cwd: ROOT });
    if (health.exit !== 0) throw new Error(`hq docs health failed: exit=${health.exit} stderr=${health.stderr}`);
    const hLines = health.stdout.split('\n').map((l) => l.trim());
    if (!hLines.includes('Document health')) throw new Error('hq docs health printed no Document health header');
    findings.push(finding('docs health reports missing families, orphans, stale, duplicates and conflicts', 'hq/bin/hq.mjs docs health'));
    for (const label of ['Missing families', 'Orphans', 'Stale', 'Duplicates', 'Conflicts']) {
      const line = hLines.find((l) => l.startsWith(`${label}: `));
      if (!line) throw new Error(`hq docs health printed no ${label} line`);
      findings.push(finding(line, 'hq/bin/hq.mjs docs health'));
    }

    const drift = runHq(['lake', 'drift'], { cwd: ROOT });
    if (drift.exit !== 0) throw new Error(`hq lake drift failed: exit=${drift.exit} stderr=${drift.stderr}`);
    const dLines = drift.stdout.split('\n').map((l) => l.trim());
    const driftLabels = ['Stale indexes', 'Dirty spaces', 'Ahead/behind', 'Stale docs', 'Open tasks', 'Missing docs'];
    for (const label of driftLabels) {
      if (!dLines.some((l) => l.startsWith(`${label}: `))) {
        throw new Error(`hq lake drift printed no ${label} line`);
      }
    }
    findings.push(finding('lake drift reports stale indexes, dirty spaces, ahead/behind, stale docs, open tasks and missing docs', 'hq/bin/hq.mjs lake drift'));
    for (const label of ['Stale indexes', 'Missing docs']) {
      findings.push(finding(dLines.find((l) => l.startsWith(`${label}: `)), 'hq/bin/hq.mjs lake drift'));
    }

    const db = openDb(join(ROOT, '.hq', 'index.db'));
    try {
      const health2 = documentHealth(db, { root: ROOT, projects: projectsForIndex(ROOT) });
      const families = (health2.missingFamilies ?? []).map(String).sort();
      if (families.join(', ') !== '08, 10, 11, 13') {
        throw new Error(`unexpected missing families: ${families.join(', ')}`);
      }
      findings.push(finding(`missing document families: ${families.join(', ')}`, 'hq/lib/canon.mjs documentHealth'));

      const stale = await collectStaleFiles({ db, config: loadConfig(ROOT), projects: projectsForIndex(ROOT) });
      const reasons = [...new Set(stale.map((s) => s.reason))].sort();
      if (reasons.join(', ') !== 'changed, deleted, new') {
        throw new Error(`unexpected staleness reasons: ${reasons.join(', ')}`);
      }
      findings.push(finding(`index-vs-disk staleness reasons: ${reasons.join(', ')}`, 'hq/lib/freshness.mjs collectStaleFiles'));
      findings.push(finding(`${stale.length} stale files detected against the index across the indexed projects`, 'hq/lib/freshness.mjs collectStaleFiles'));
    } finally {
      db.close();
    }

    return findings;
  },
});
