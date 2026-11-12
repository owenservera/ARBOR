// hq/aii/fixtures/HQ-015-module-dependencies.mjs
// AII build lane "p1-existing-surface-fixtures". Scenario HQ-015 (group B):
// "What are the actual dependencies of this module?"
//
// Ground truth LOCKED 2026-11-11 from live output on branch main:
//   bun hq/bin/hq.mjs deps hq/lib/graph.mjs --depth 1
//     -> "forward deps for repos-hq/hq/lib/graph.mjs" then
//          repos-hq/hq/lib/graph.mjs
//          repos-hq/hq/lib/util.mjs  via ./util.mjs
//        i.e. hq/lib/graph.mjs has exactly ONE real dependency.
//   The dependency edges are resolved imports: hq/lib/graph.mjs:6 imports
//   { toPosix } from './util.mjs'. The index stores exactly one import row for
//   hq/lib/graph.mjs (specifier './util.mjs', kind 'import', resolved to the
//   real file hq/lib/util.mjs) — external packages are NOT counted.
//
// The question is "actual dependencies", so the fixture pins the resolution
// SEMANTICS: only a specifier that resolves to a real indexed file becomes an
// edge; an unresolved specifier is not a dependency. The edge set of
// hq/lib/graph.mjs is stable (it is what the source imports), so it is pinned
// exactly, while the whole-workspace counts are re-derived live.
import { defineFixture, finding, runHq } from './harness.mjs';
import { openDb } from '../../lib/schema.mjs';
import { deps } from '../../lib/graph.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export default defineFixture({
  id: 'HQ-015',
  provenance: 'Locked 2026-11-11 on branch main from live output: bun hq/bin/hq.mjs deps hq/lib/graph.mjs --depth 1 printed the header "forward deps for repos-hq/hq/lib/graph.mjs" followed by exactly two nodes — repos-hq/hq/lib/graph.mjs and repos-hq/hq/lib/util.mjs via ./util.mjs — so hq/lib/graph.mjs has exactly one real dependency. The index agrees: the imports table holds exactly one row for hq/lib/graph.mjs (specifier ./util.mjs, kind import, resolved_file_id pointing at the real file hq/lib/util.mjs), matching hq/lib/graph.mjs:6 `import { toPosix } from \'./util.mjs\'`. The edge set is what the source imports and is stable, so it is pinned exactly; the whole-workspace dependency counts are re-derived live.',
  expected: [
    { what: 'forward deps for repos-hq/hq/lib/graph.mjs', where: 'hq/bin/hq.mjs deps hq/lib/graph.mjs --depth 1' },
    { what: 'hq/lib/graph.mjs depends on hq/lib/util.mjs via ./util.mjs', where: 'hq/bin/hq.mjs deps hq/lib/graph.mjs --depth 1' },
    { what: 'hq/lib/graph.mjs has exactly 1 resolved dependency edge', where: 'hq/lib/graph.mjs deps' },
    { what: 'the only import specifier of hq/lib/graph.mjs is ./util.mjs', where: 'hq/lib/graph.mjs imports' },
    { what: /^every dependency edge of hq\/lib\/graph\.mjs resolves to an indexed file$/, where: 'hq/lib/graph.mjs deps' },
    { what: /^\d+ dependency edges resolved across the workspace$/, where: 'hq/lib/graph.mjs deps' },
  ],
  run: async () => {
    const findings = [];

    const cli = runHq(['deps', 'hq/lib/graph.mjs', '--depth', '1'], { cwd: ROOT });
    if (cli.exit !== 0) throw new Error(`hq deps failed: exit=${cli.exit} stderr=${cli.stderr}`);
    const lines = cli.stdout.split('\n').map((l) => l.trim()).filter(Boolean);
    const header = lines[0] ?? '';
    if (header !== 'forward deps for repos-hq/hq/lib/graph.mjs') {
      throw new Error(`unexpected deps header: ${JSON.stringify(header)}`);
    }
    findings.push(finding(header, 'hq/bin/hq.mjs deps hq/lib/graph.mjs --depth 1'));
    const edgeLines = lines.slice(1).filter((l) => l.startsWith('repos-hq/') && l.includes('  via '));
    if (edgeLines.length !== 1) {
      throw new Error(`expected exactly 1 resolved edge, got ${JSON.stringify(edgeLines)}`);
    }
    const m = edgeLines[0].match(/^repos-hq\/(.+?)\s+via (\S+)$/);
    if (!m || m[1] !== 'hq/lib/util.mjs' || m[2] !== './util.mjs') {
      throw new Error(`unexpected edge: ${JSON.stringify(edgeLines[0])}`);
    }
    findings.push(finding('hq/lib/graph.mjs depends on hq/lib/util.mjs via ./util.mjs', 'hq/bin/hq.mjs deps hq/lib/graph.mjs --depth 1'));

    const db = openDb(join(ROOT, '.hq', 'index.db'));
    try {
      const graph = deps(db, { target: 'hq/lib/graph.mjs', depth: 1 });
      const edges = graph.edges ?? [];
      if (edges.length !== 1) throw new Error(`expected 1 dependency edge, got ${JSON.stringify(edges)}`);
      findings.push(finding('hq/lib/graph.mjs has exactly 1 resolved dependency edge', 'hq/lib/graph.mjs deps'));
      const edge = edges[0];
      if (edge.from !== 'hq/lib/graph.mjs' || edge.to !== 'hq/lib/util.mjs' || edge.specifier !== './util.mjs') {
        throw new Error(`unexpected edge: ${JSON.stringify(edge)}`);
      }
      findings.push(finding('every dependency edge of hq/lib/graph.mjs resolves to an indexed file', 'hq/lib/graph.mjs deps'));

      const imports = db.prepare(
        "SELECT specifier FROM imports i JOIN files f ON f.id = i.file_id WHERE f.path = 'hq/lib/graph.mjs' ORDER BY i.line",
      ).all();
      if (imports.length !== 1 || imports[0].specifier !== './util.mjs') {
        throw new Error(`unexpected import specifiers: ${JSON.stringify(imports)}`);
      }
      findings.push(finding('the only import specifier of hq/lib/graph.mjs is ./util.mjs', 'hq/lib/graph.mjs imports'));

      const total = db.prepare(
        'SELECT COUNT(*) AS c FROM imports i JOIN files f ON f.id = i.file_id WHERE i.resolved_file_id IS NOT NULL',
      ).get();
      findings.push(finding(`${Number(total.c)} dependency edges resolved across the workspace`, 'hq/lib/graph.mjs deps'));
    } finally {
      db.close();
    }

    return findings;
  },
});
