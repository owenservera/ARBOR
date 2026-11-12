// hq/aii/fixtures/HQ-095-unknowns-investigation.mjs
// AII build lane "p1-existing-surface-fixtures". Scenario HQ-095 (group L):
// "Find what we don't yet know about this subsystem, and investigate the
// highest-impact unknowns."
//
// Ground truth LOCKED 2026-11-11 from live output on branch main:
//   kbGraph(db, { project: 'repos-hq', depth: 1, limit: 50 })
//     (hq/lib/kb.mjs:977) returned 50 canon nodes and 0 edges — the graph
//     knowledge base holds WHAT IS KNOWN; the empty edge set for the queried
//     depth is an explicit zero (no kb edges indexed for these nodes).
//   bun hq/bin/hq.mjs semantic list
//     -> "No semantic IDs." (hq/lib/semantic-registry.mjs listSemanticIds
//        returns [] — an explicit zero: no semantic IDs registered).
//   detectSemanticDrift(db, {}) (hq/lib/semantic-registry.mjs:341) returned []
//   — drift checked 0 links (nothing to drift).
//   bun hq/bin/hq.mjs docs health
//     -> Missing families: 3, Orphans: 885, Stale: 48, Duplicates: 1,
//        Conflicts: 4 — the DOCUMENTED unknowns: missing families 08/10/13,
//        orphan docs, stale docs and duplicate clusters.
//   kbHealth(db) (hq/lib/kb.mjs:1118) reported documents 1303, decisions 67,
//   canon 482, orphans 4591 (live CLI run).
//
// The unknowns inventory (missing families, semantic-registry emptiness, kb
// orphan counts) is the pinned answer; the counts drift as lanes index and
// are re-derived live.
import { defineFixture, finding, runHq } from './harness.mjs';
import { openDb } from '../../lib/schema.mjs';
import { kbGraph, kbHealth } from '../../lib/kb.mjs';
import { listSemanticIds, detectSemanticDrift } from '../../lib/semantic-registry.mjs';
import { documentHealth } from '../../lib/canon.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export default defineFixture({
  id: 'HQ-095',
  provenance: 'Locked 2026-11-11 on branch main from live output: kbGraph(db, { project: "repos-hq", depth: 1, limit: 50 }) (hq/lib/kb.mjs:977) returned 50 canon nodes and 0 edges — the edge set at this depth is an explicit zero. bun hq/bin/hq.mjs semantic list printed "No semantic IDs." (listSemanticIds returned []; an explicit zero — no semantic IDs registered) and detectSemanticDrift(db, {}) (hq/lib/semantic-registry.mjs:341) returned [] — drift checked 0 links. bun hq/bin/hq.mjs docs health printed "Document health / Missing families: 3 / Orphans: 885 / Stale: 48 / Duplicates: 1 / Conflicts: 4", and documentHealth(db) named the missing families 08, 10 and 13. bun hq/bin/hq.mjs kb health printed "Documents 1303 · decisions 67 · canon 482 · sessions 0 · notes 0 · wiki 3274 / Stale evidence 0 · orphans 4591". The unknowns inventory — missing families 08/10/13, the empty semantic registry, the kb orphan counts — is pinned; the numeric counts drift as concurrent lanes index and are re-derived live. REFRESH 2026-11-11T22:1xZ: concurrent lane doc reorganization made family 11 (Memory & durable learning — memory.md/notes.md/preferences.md/lessons.md/facts.md patterns, hq/lib/canon.mjs:61) newly missing after the morning lock; live documentHealth now reports missing families 08, 10, 11, 13 (bun hq/bin/hq.mjs docs health printed Missing families: 4). Re-locked with the refreshed family set; every other expectation unchanged.',
  expected: [
    { what: 'missing document families: 08, 10, 11, 13', where: 'hq/lib/canon.mjs documentHealth' },
    { what: 'no semantic IDs are registered — the semantic registry is empty', where: 'hq/lib/semantic-registry.mjs listSemanticIds' },
    { what: 'semantic drift checked 0 links (nothing registered to drift)', where: 'hq/lib/semantic-registry.mjs detectSemanticDrift' },
    { what: 'the kb graph surfaces canon knowledge nodes for the queried project', where: 'hq/lib/kb.mjs kbGraph' },
    { what: /^\d+ kb graph nodes returned for repos-hq at depth 1$/, where: 'hq/lib/kb.mjs kbGraph' },
    { what: /^\d+ orphan documents and \d+ stale documents mark the un-integrated knowledge$/, where: 'hq/lib/canon.mjs documentHealth' },
    { what: 'the kb health report counts documents, decisions, canon terms and orphans', where: 'hq/bin/hq.mjs kb health' },
  ],
  run: async () => {
    const findings = [];

    const db = openDb(join(ROOT, '.hq', 'index.db'));
    try {
      const graph = kbGraph(db, { project: 'repos-hq', depth: 1, limit: 50 });
      if (!Array.isArray(graph.nodes) || !graph.nodes.length) {
        throw new Error('kbGraph returned no nodes');
      }
      findings.push(finding('the kb graph surfaces canon knowledge nodes for the queried project', 'hq/lib/kb.mjs kbGraph'));
      findings.push(finding(`${graph.nodes.length} kb graph nodes returned for repos-hq at depth 1`, 'hq/lib/kb.mjs kbGraph'));

      const semanticIds = listSemanticIds(db, {});
      if (semanticIds.length !== 0) {
        throw new Error(`expected an empty semantic registry, got ${semanticIds.length} ids`);
      }
      findings.push(finding('no semantic IDs are registered — the semantic registry is empty', 'hq/lib/semantic-registry.mjs listSemanticIds'));
      const drift = detectSemanticDrift(db, {});
      if (drift.length !== 0) {
        throw new Error(`expected 0 drifted links, got ${drift.length}`);
      }
      findings.push(finding('semantic drift checked 0 links (nothing registered to drift)', 'hq/lib/semantic-registry.mjs detectSemanticDrift'));

      const health = documentHealth(db, { root: ROOT });
      const families = (health.missingFamilies ?? []).map(String).sort();
      if (families.join(', ') !== '08, 10, 11, 13') {
        throw new Error(`unexpected missing families: ${families.join(', ')}`);
      }
      findings.push(finding(`missing document families: ${families.join(', ')}`, 'hq/lib/canon.mjs documentHealth'));
      findings.push(finding(`${(health.orphanDocs ?? []).length} orphan documents and ${(health.staleDocs ?? []).length} stale documents mark the un-integrated knowledge`, 'hq/lib/canon.mjs documentHealth'));

      const kb = kbHealth(db);
      for (const key of ['doc', 'decision', 'canon']) {
        if (kb.counts?.[key] === undefined) throw new Error(`kbHealth counts are missing ${key}`);
      }
      if (!Array.isArray(kb.orphans)) throw new Error('kbHealth has no orphans array');
      findings.push(finding('the kb health report counts documents, decisions, canon terms and orphans', 'hq/bin/hq.mjs kb health'));
    } finally {
      db.close();
    }

    const cli = runHq(['semantic', 'list'], { cwd: ROOT });
    if (cli.exit !== 0) throw new Error(`hq semantic list failed: exit=${cli.exit} stderr=${cli.stderr}`);
    if (!cli.stdout.includes('No semantic IDs')) {
      throw new Error(`unexpected semantic list output: ${cli.stdout.slice(0, 200)}`);
    }

    return findings;
  },
});
