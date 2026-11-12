// hq/aii/fixtures/HQ-104-high-impact-code.mjs
// AII scenario HQ-104 (group M): "Which code is high-impact — where would a defect hurt the product most?"
// Engine: hq/lib/graph.mjs impact() (graph.mjs:143) — reverse-dep blast radius over the real
// files/imports schema, seeded in memory; cross-repo edges make a defect propagate between projects.
//
// Ground truth LOCKED 2026-11-11 (this session):
//   - impact(db, {target, depth}) walks resolved import edges in reverse (graph.mjs:57-142,
//     143-150): the affected set = every module that transitively depends on the target.
//   - Seeded graph: a shared kernel depended on by both repos' modules (cross-project edges
//     carry resolved_project_id), vs a leaf with no dependents.

import { defineFixture, finding } from './harness.mjs';
import { openMemoryDb } from '../../lib/schema.mjs';
import { impact } from '../../lib/graph.mjs';

function seedGraph(db) {
  const insProject = db.prepare("INSERT INTO projects (id, name, path, added_at) VALUES (?, ?, ?, '2026-11-11T00:00:00.000Z')");
  insProject.run(1, 'repos-hq', 'C:/0-BlackBoxProject-0/repos_hq');
  insProject.run(2, 'vivim-web-harness', 'C:/0-BlackBoxProject-0/vivim-web-harness');
  const insFile = db.prepare("INSERT INTO files (id, project_id, path, abs_path, lang, kind, is_test) VALUES (?, ?, ?, ?, 'js', 'source', 0)");
  const files = [
    [1, 1, 'hq/lib/receipts.mjs'],
    [2, 1, 'hq/lib/dogfood.mjs'],
    [3, 1, 'hq/lib/pmo.mjs'],
    [4, 2, 'host/bridge/bus.mjs'],
    [5, 2, 'host/leaf/unused.mjs'],
  ];
  for (const [id, pid, path] of files) insFile.run(id, pid, path, 'C:/seed/' + path);
  const insImport = db.prepare('INSERT INTO imports (file_id, project_id, specifier, kind, resolved_file_id, resolved_project_id, line) VALUES (?, ?, ?, \'import\', ?, ?, ?)');
  // hq/lib/dogfood.mjs and hq/lib/pmo.mjs depend on receipts.mjs; the harness bridge too.
  insImport.run(2, 1, './receipts.mjs', 1, 1, 10);
  insImport.run(3, 1, './receipts.mjs', 1, 1, 12);
  insImport.run(4, 2, '../../repos_hq/hq/lib/receipts.mjs', 1, 1, 20);
}

export default defineFixture({
  id: 'HQ-104',
  provenance:
    '2026-11-11 (this session): locked from hq/lib/graph.mjs impact() exercised on a seeded in-memory graph using the ' +
    'real files/imports schema (schema.mjs:30-75; imports.resolved_project_id schema.mjs:74 carries cross-repo edges). ' +
    'impact() is deps() with reverse:true, depth 3 (graph.mjs:143-150) — the affected set for a target is every module ' +
    'that transitively imports it, which is the blast radius where a defect hurts. Seed: receipts.mjs depended on by two ' +
    'same-repo modules and one cross-repo harness module; host/leaf/unused.mjs by none. No workspace writes.',
  expected: [
    { what: 'hq/lib/receipts.mjs is the highest-impact seed: 3 modules transitively depend on it, one across the repo boundary', where: 'hq/lib/graph.mjs impact' },
    { what: 'a defect in receipts.mjs propagates to vivim-web-harness via the resolved cross-repo import edge', where: 'hq/lib/schema.mjs' },
    { what: 'host/leaf/unused.mjs has zero dependents — a defect there hurts only itself', where: 'hq/lib/graph.mjs impact' },
    { what: 'the blast radius is the reverse-reach node count at bounded depth (graph.mjs:143-150)', where: 'hq/lib/graph.mjs impact' },
  ],
  run: async () => {
    const findings = [];
    const db = openMemoryDb();
    try {
      seedGraph(db);
      const radius = (target) => impact(db, { target, depth: 3, limit: 50 }).nodes.length;
      const receipts = radius('receipts.mjs');
      const leaf = radius('unused.mjs');
      if (receipts !== 4) throw new Error(`receipts blast radius wrong: ${receipts}`);
      if (leaf !== 1) throw new Error(`leaf blast radius wrong: ${leaf}`);
      findings.push(finding('hq/lib/receipts.mjs is the highest-impact seed: 3 modules transitively depend on it, one across the repo boundary', 'hq/lib/graph.mjs impact'));
      findings.push(finding('the blast radius is the reverse-reach node count at bounded depth (graph.mjs:143-150)', 'hq/lib/graph.mjs impact'));

      const cross = impact(db, { target: 'receipts.mjs', depth: 3, limit: 50 });
      if (!cross.nodes.some((n) => n.project === 'vivim-web-harness')) {
        throw new Error(`cross-repo dependent missing: ${JSON.stringify(cross.nodes)}`);
      }
      findings.push(finding('a defect in receipts.mjs propagates to vivim-web-harness via the resolved cross-repo import edge', 'hq/lib/schema.mjs'));
      findings.push(finding('host/leaf/unused.mjs has zero dependents — a defect there hurts only itself', 'hq/lib/graph.mjs impact'));
    } finally {
      db.close();
    }
    return findings;
  },
});
