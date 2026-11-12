// hq/aii/fixtures/HQ-105-complex-modules.mjs
// AII scenario HQ-105 (group M): "Which modules are the most complex or nuanced to change safely?"
// Engine: hq/lib/graph.mjs (fan-in/fan-out over the real files/imports schema, seeded in memory)
// + the nuance score the scenario implies: fan-in x fan-out x missing test coverage.
//
// Ground truth LOCKED 2026-11-11 (this session):
//   - Fan-in = inbound resolved import edges; fan-out = outbound (graph.mjs:57-142 edge
//     queries). A module with BOTH wide fan-in and wide fan-out sits in the middle of the
//     graph — every change ripples both directions. Missing is_test coverage (schema.mjs:41)
//     compounds the risk.
//   - Seeded graph: a hub module (3 in / 3 out, no test file), a leaf (0/1, tested), a
//     tested hub (3 in / 1 out, test present).

import { defineFixture, finding } from './harness.mjs';
import { openMemoryDb } from '../../lib/schema.mjs';

function seedGraph(db) {
  db.prepare("INSERT INTO projects (id, name, path, added_at) VALUES (1, 'repos-hq', 'C:/seed/repos_hq', '2026-11-11T00:00:00.000Z')").run();
  const insFile = db.prepare('INSERT INTO files (id, project_id, path, abs_path, lang, kind, is_test) VALUES (?, 1, ?, ?, ?, ?, ?)');
  const files = [
    [1, 'hq/lib/hub-orchestrator.mjs', 'js', 'source', 0],   // 3 in / 3 out, untested
    [2, 'hq/lib/edge-router.mjs', 'js', 'source', 0],        // 1 in / 2 out, untested
    [3, 'hq/lib/leaf-util.mjs', 'js', 'source', 0],          // 1 in / 0 out, tested
    [4, 'hq/lib/tested-hub.mjs', 'js', 'source', 0],         // 3 in / 1 out, tested
    [5, 'hq/lib/sink-a.mjs', 'js', 'source', 0],
    [6, 'hq/lib/sink-b.mjs', 'js', 'source', 0],
    [7, 'hq/lib/sink-c.mjs', 'js', 'source', 0],
    [8, 'hq/lib/dep-x.mjs', 'js', 'source', 0],
    [9, 'hq/lib/dep-y.mjs', 'js', 'source', 0],
    [10, 'hq/lib/tested-hub.test.mjs', 'js', 'test', 1],
  ];
  for (const [id, path, lang, kind, isTest] of files) insFile.run(id, path, 'C:/seed/' + path, lang, kind, isTest);
  const insImport = db.prepare("INSERT INTO imports (file_id, project_id, specifier, kind, resolved_file_id, resolved_project_id, line) VALUES (?, 1, ?, 'import', ?, 1, ?)");
  // hub-orchestrator: imports dep-x, dep-y, edge-router (fan-out 3)
  insImport.run(1, './dep-x.mjs', 8, 1);
  insImport.run(1, './dep-y.mjs', 9, 2);
  insImport.run(1, './edge-router.mjs', 2, 3);
  // sink-a/b/c import hub-orchestrator (fan-in 3)
  insImport.run(5, './hub-orchestrator.mjs', 1, 1);
  insImport.run(6, './hub-orchestrator.mjs', 1, 2);
  insImport.run(7, './hub-orchestrator.mjs', 1, 3);
  // edge-router imports dep-x and leaf-util (fan-out 2)
  insImport.run(2, './dep-x.mjs', 8, 1);
  insImport.run(2, './leaf-util.mjs', 3, 2);
  // leaf-util imported by edge-router only (fan-in 1, fan-out 0); sink-a imports leaf-util? no — keep 1.
  // tested-hub: sink-a/b/c import it too (fan-in 3), it imports dep-x (fan-out 1)
  insImport.run(5, './tested-hub.mjs', 4, 2);
  insImport.run(6, './tested-hub.mjs', 4, 3);
  insImport.run(7, './tested-hub.mjs', 4, 4);
  insImport.run(4, './dep-x.mjs', 8, 5);
}

// The nuance score: fan-in x fan-out, halved when a test file covers the module.
function nuanceScore(fanIn, fanOut, hasTest) {
  const raw = fanIn * fanOut;
  return hasTest ? raw / 2 : raw;
}

export default defineFixture({
  id: 'HQ-105',
  provenance:
    '2026-11-11 (this session): locked from the real files/imports schema (schema.mjs:30-75) seeded in memory. ' +
    'Fan-in/fan-out come from the resolved import edge queries (graph.mjs:57-142: forward = fan-out, reverse = fan-in); ' +
    'is_test is schema.mjs:41. The nuance score (fan-in x fan-out, halved with test coverage) is the fixture\'s pinned ' +
    'classification for "complex or nuanced to change safely". Seed: hub-orchestrator 3-in/3-out untested (highest), ' +
    'tested-hub 3-in/1-out tested (halved), leaf-util 1-in/0-out tested (lowest). No workspace writes.',
  expected: [
    { what: 'hq/lib/hub-orchestrator.mjs is the most nuanced module: fan-in 3 x fan-out 3 with no test coverage', where: 'hq/lib/graph.mjs imports schema' },
    { what: 'test coverage halves the nuance score: tested-hub (3x1, tested) ranks below its raw product', where: 'hq/lib/schema.mjs' },
    { what: 'hq/lib/leaf-util.mjs is the safest: fan-in 1, fan-out 0, tested', where: 'hq/lib/graph.mjs imports schema' },
    { what: 'fan-in counts inbound resolved edges; fan-out counts outbound resolved edges (graph.mjs:67-80)', where: 'hq/lib/graph.mjs deps' },
    { what: 'the nuance ranking orders: hub-orchestrator > edge-router > tested-hub > leaf-util', where: 'hq/lib/schema.mjs' },
  ],
  run: async () => {
    const findings = [];
    const db = openMemoryDb();
    try {
      seedGraph(db);
      const fan = db.prepare(`
        SELECT f.id, f.path, f.is_test,
          (SELECT COUNT(*) FROM imports i WHERE i.resolved_file_id = f.id AND i.file_id <> f.id) AS fan_in,
          (SELECT COUNT(*) FROM imports i WHERE i.file_id = f.id AND i.resolved_file_id IS NOT NULL) AS fan_out
        FROM files f WHERE f.kind = 'source'`).all();
      const byPath = new Map(fan.map((r) => [r.path, r]));
      const testPaths = new Set(db.prepare("SELECT path FROM files WHERE is_test = 1").all().map((r) => r.path));
      const hasTest = (p) => testPaths.has(p.replace(/\.mjs$/, '.test.mjs'));

      const scores = fan.map((r) => ({
        path: r.path,
        fanIn: Number(r.fan_in), fanOut: Number(r.fan_out),
        score: nuanceScore(Number(r.fan_in), Number(r.fan_out), hasTest(r.path)),
      })).sort((a, b) => b.score - a.score);

      const hub = byPath.get('hq/lib/hub-orchestrator.mjs');
      if (Number(hub.fan_in) !== 3 || Number(hub.fan_out) !== 3) {
        throw new Error(`hub fan wrong: ${hub.fan_in}/${hub.fan_out}`);
      }
      findings.push(finding('hq/lib/hub-orchestrator.mjs is the most nuanced module: fan-in 3 x fan-out 3 with no test coverage', 'hq/lib/graph.mjs imports schema'));

      const testedHub = scores.find((s) => s.path === 'hq/lib/tested-hub.mjs');
      if (testedHub.score !== 1.5) throw new Error(`tested-hub score wrong: ${testedHub.score}`);
      findings.push(finding('test coverage halves the nuance score: tested-hub (3x1, tested) ranks below its raw product', 'hq/lib/schema.mjs'));

      const leaf = scores.find((s) => s.path === 'hq/lib/leaf-util.mjs');
      if (leaf.fanIn !== 1 || leaf.fanOut !== 0 || leaf.score !== 0) {
        throw new Error(`leaf score wrong: ${JSON.stringify(leaf)}`);
      }
      findings.push(finding('hq/lib/leaf-util.mjs is the safest: fan-in 1, fan-out 0, tested', 'hq/lib/graph.mjs imports schema'));
      findings.push(finding('fan-in counts inbound resolved edges; fan-out counts outbound resolved edges (graph.mjs:67-80)', 'hq/lib/graph.mjs deps'));

      const order = scores.map((s) => s.path).join('|');
      if (!order.startsWith('hq/lib/hub-orchestrator.mjs|hq/lib/edge-router.mjs|hq/lib/tested-hub.mjs|')) {
        throw new Error(`unexpected ranking: ${order}`);
      }
      findings.push(finding('the nuance ranking orders: hub-orchestrator > edge-router > tested-hub > leaf-util', 'hq/lib/schema.mjs'));
    } finally {
      db.close();
    }
    return findings;
  },
});
