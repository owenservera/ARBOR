// hq/aii/fixtures/HQ-005-repository-dependencies.mjs
// AII build lane "p1-existing-surface-fixtures". Scenario HQ-005 (group A):
// "Which repositories depend on one another?"
//
// Ground truth LOCKED 2026-11-11 from live output on branch main:
//   bun hq/bin/hq.mjs deps hq/lib/git-context.mjs --depth 1
//     -> header "forward deps for repos-hq/hq/lib/git-context.mjs", then one
//        "  repos-hq/<path>  via <specifier>" line per RESOLVED import.
//        (git-context.mjs imports only node builtins, so it resolves to no
//        intra-repo forward edge: 1 node, the root itself.)
//   bun hq/bin/hq.mjs impact hq/lib/git-context.mjs
//     -> "Impact of repos-hq/hq/lib/git-context.mjs: 3 dependent(s)" plus one
//        "  repos-hq/<path>  depth <n>" line per transitive reverse dependent.
//   projectGraph(db) (hq/lib/graph.mjs:152)
//     -> 3 nodes (repos-hq, vivim-ui, vivim-web-harness), each with
//        files/symbols/incoming/outgoing, and edges: [] — ZERO cross-project
//        import edges. That zero is the documented invariant: DEC-2026-11-05-
//        ONE-VERTICAL-SLICE states neither repo imports the other's private
//        internal files (docs/decisions/DEC-2026-11-05-ONE-VERTICAL-SLICE.md).
//
// The node/dependent COUNTS drift as concurrent lanes reindex the shared
// workspace, so the expectations pin the observed SHAPE (headers, edge format,
// the project set, the zero cross-project edge count) while run() re-derives
// every count live.
import { defineFixture, finding, runHq } from './harness.mjs';
import { openDb } from '../../lib/schema.mjs';
import { projectGraph } from '../../lib/graph.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export default defineFixture({
  id: 'HQ-005',
  provenance: 'Locked 2026-11-11 on branch main from live output: bun hq/bin/hq.mjs deps hq/lib/git-context.mjs --depth 1 (header "forward deps for repos-hq/hq/lib/git-context.mjs"; 1 resolved node — git-context.mjs imports only node builtins so it has no intra-repo forward edge) and bun hq/bin/hq.mjs impact hq/lib/git-context.mjs ("Impact of repos-hq/hq/lib/git-context.mjs: 3 dependent(s)"). REFRESH 2026-11-11: owner ruled vivim-labs never an HQ index source; openmausbot registration removed (cascade verified). projectGraph(db) from hq/lib/graph.mjs:152 now returns 3 nodes — repos-hq, vivim-ui, vivim-web-harness — with edges: [] (zero cross-project import edges) and incoming/outgoing 0 on every node. The zero cross-project edge count is the documented architectural invariant (docs/decisions/DEC-2026-11-05-ONE-VERTICAL-SLICE.md: "neither repo imports the other\'s private internal files"), so it is pinned exactly; node/dependent counts drift as concurrent lanes reindex and are re-derived live by run().',
  expected: [
    { what: 'forward deps for repos-hq/hq/lib/git-context.mjs', where: 'hq/bin/hq.mjs deps hq/lib/git-context.mjs --depth 1' },
    { what: /^\d+ repos-hq\/ dependency nodes resolved from real imports$/, where: 'hq/bin/hq.mjs deps hq/lib/git-context.mjs --depth 1' },
    { what: /^Impact of repos-hq\/hq\/lib\/git-context\.mjs: \d+ dependent\(s\)$/, where: 'hq/bin/hq.mjs impact hq/lib/git-context.mjs' },
    { what: /^\d+ transitive dependents of hq\/lib\/git-context\.mjs reported with a depth per dependent$/, where: 'hq/bin/hq.mjs impact hq/lib/git-context.mjs' },
    { what: 'indexed projects in the dependency graph: repos-hq, vivim-ui, vivim-web-harness', where: 'hq/lib/graph.mjs projectGraph' },
    { what: 'cross-project import edges: 0', where: 'hq/lib/graph.mjs projectGraph' },
    { what: /^\d+ projects report an incoming and an outgoing cross-project edge count$/, where: 'hq/lib/graph.mjs projectGraph' },
  ],
  run: async () => {
    const findings = [];

    const deps = runHq(['deps', 'hq/lib/git-context.mjs', '--depth', '1'], { cwd: ROOT });
    if (deps.exit !== 0) throw new Error(`hq deps failed: exit=${deps.exit} stderr=${deps.stderr}`);
    const depLines = deps.stdout.split('\n').map((l) => l.trim()).filter(Boolean);
    const header = depLines[0] ?? '';
    if (header !== 'forward deps for repos-hq/hq/lib/git-context.mjs') {
      throw new Error(`unexpected deps header: ${JSON.stringify(header)}`);
    }
    findings.push(finding(header, 'hq/bin/hq.mjs deps hq/lib/git-context.mjs --depth 1'));
    const nodes = depLines.slice(1).filter((l) => l.startsWith('repos-hq/'));
    findings.push(finding(`${nodes.length} repos-hq/ dependency nodes resolved from real imports`, 'hq/bin/hq.mjs deps hq/lib/git-context.mjs --depth 1'));

    const impact = runHq(['impact', 'hq/lib/git-context.mjs'], { cwd: ROOT });
    if (impact.exit !== 0) throw new Error(`hq impact failed: exit=${impact.exit} stderr=${impact.stderr}`);
    const impactLines = impact.stdout.split('\n').map((l) => l.trim()).filter(Boolean);
    const impactHeader = impactLines[0] ?? '';
    if (!/^Impact of repos-hq\/hq\/lib\/git-context\.mjs: \d+ dependent\(s\)$/.test(impactHeader)) {
      throw new Error(`unexpected impact header: ${JSON.stringify(impactHeader)}`);
    }
    findings.push(finding(impactHeader, 'hq/bin/hq.mjs impact hq/lib/git-context.mjs'));
    const dependents = impactLines.slice(1).filter((l) => l.startsWith('repos-hq/') && l.includes('depth '));
    findings.push(finding(`${dependents.length} transitive dependents of hq/lib/git-context.mjs reported with a depth per dependent`, 'hq/bin/hq.mjs impact hq/lib/git-context.mjs'));

    const db = openDb(join(ROOT, '.hq', 'index.db'));
    try {
      const graph = projectGraph(db);
      const names = graph.nodes.map((n) => n.project);
      if (names.join(', ') !== 'repos-hq, vivim-ui, vivim-web-harness') {
        throw new Error(`unexpected indexed project set: ${names.join(', ')}`);
      }
      findings.push(finding(`indexed projects in the dependency graph: ${names.join(', ')}`, 'hq/lib/graph.mjs projectGraph'));
      if (graph.edges.length !== 0) {
        throw new Error(`expected zero cross-project import edges, got ${JSON.stringify(graph.edges)}`);
      }
      findings.push(finding('cross-project import edges: 0', 'hq/lib/graph.mjs projectGraph'));
      findings.push(finding(`${graph.nodes.length} projects report an incoming and an outgoing cross-project edge count`, 'hq/lib/graph.mjs projectGraph'));
    } finally {
      db.close();
    }

    return findings;
  },
});
