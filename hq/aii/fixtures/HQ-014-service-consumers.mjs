// hq/aii/fixtures/HQ-014-service-consumers.mjs
// AII build lane "p1-existing-surface-fixtures". Scenario HQ-014 (group B):
// "Which components communicate with this service?"
//
// Ground truth LOCKED 2026-11-11 from live output on branch main:
//   bun hq/bin/hq.mjs deps hq/lib/indexer.mjs --depth 2
//     -> "forward deps for repos-hq/hq/lib/indexer.mjs" then resolved edges:
//          hq/lib/extract.mjs via ./extract.mjs, hq/lib/git.mjs via ./git.mjs,
//          hq/lib/lang.mjs via ./lang.mjs, hq/lib/schema.mjs via ./schema.mjs,
//          hq/lib/walk.mjs via ./walk.mjs (depth 1);
//          hq/lib/capability-schema.mjs via ./capability-schema.mjs and
//          hq/lib/util.mjs via ./util.mjs (depth 2, reached through
//          hq/lib/schema.mjs and hq/lib/walk.mjs).
//   hq/lib/graph.mjs projectGraph (hq/lib/graph.mjs:152) computes the
//   PROJECT-level edges: 4 indexed projects, edges: [] — zero cross-project
//   import edges, so no OTHER repository communicates with repos-hq's modules.
//
// The resolved-edge set for a given module is stable (it is what the source
// imports), so the direct edges are pinned exactly; the transitive depth-2 set
// is re-derived live.
import { defineFixture, finding, runHq } from './harness.mjs';
import { openDb } from '../../lib/schema.mjs';
import { projectGraph } from '../../lib/graph.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

// The direct imports of hq/lib/indexer.mjs, pinned from the live resolved graph.
const DIRECT_EDGES = [
  ['hq/lib/extract.mjs', './extract.mjs'],
  ['hq/lib/git.mjs', './git.mjs'],
  ['hq/lib/lang.mjs', './lang.mjs'],
  ['hq/lib/schema.mjs', './schema.mjs'],
  ['hq/lib/walk.mjs', './walk.mjs'],
];

export default defineFixture({
  id: 'HQ-014',
  provenance: 'Locked 2026-11-11 on branch main from live output: bun hq/bin/hq.mjs deps hq/lib/indexer.mjs --depth 2 printed the header "forward deps for repos-hq/hq/lib/indexer.mjs" and the resolved edges hq/lib/extract.mjs via ./extract.mjs, hq/lib/git.mjs via ./git.mjs, hq/lib/lang.mjs via ./lang.mjs, hq/lib/schema.mjs via ./schema.mjs, hq/lib/walk.mjs via ./walk.mjs at depth 1, plus hq/lib/capability-schema.mjs via ./capability-schema.mjs and hq/lib/util.mjs via ./util.mjs at depth 2 (reached through hq/lib/schema.mjs and hq/lib/walk.mjs). projectGraph(db) (hq/lib/graph.mjs:152) returned the 4 indexed projects with edges: [] — zero cross-project import edges, so no other repository communicates with these modules. The direct edge set is what the source imports and is stable, so it is pinned exactly; the transitive depth-2 set is re-derived live. REFRESH 2026-11-11T22:1xZ: openmausbot was unregistered from projects.json between the morning lock and this repair (live projects.json now holds exactly repos-hq, vivim-ui, vivim-web-harness — verified by loadProjects + projectGraph this session), so the pinned indexed-project set drops openmausbot; the zero-cross-project-edge fact and all direct-edge expectations are unchanged (live projectGraph edges: 0, re-verified).',
  expected: [
    { what: 'forward deps for repos-hq/hq/lib/indexer.mjs', where: 'hq/bin/hq.mjs deps hq/lib/indexer.mjs --depth 2' },
    { what: 'hq/lib/indexer.mjs communicates with hq/lib/extract.mjs via ./extract.mjs', where: 'hq/bin/hq.mjs deps hq/lib/indexer.mjs --depth 2' },
    { what: 'hq/lib/indexer.mjs communicates with hq/lib/git.mjs via ./git.mjs', where: 'hq/bin/hq.mjs deps hq/lib/indexer.mjs --depth 2' },
    { what: 'hq/lib/indexer.mjs communicates with hq/lib/lang.mjs via ./lang.mjs', where: 'hq/bin/hq.mjs deps hq/lib/indexer.mjs --depth 2' },
    { what: 'hq/lib/indexer.mjs communicates with hq/lib/schema.mjs via ./schema.mjs', where: 'hq/bin/hq.mjs deps hq/lib/indexer.mjs --depth 2' },
    { what: 'hq/lib/indexer.mjs communicates with hq/lib/walk.mjs via ./walk.mjs', where: 'hq/bin/hq.mjs deps hq/lib/indexer.mjs --depth 2' },
    { what: /^\d+ transitive consumers reached at depth 2$/, where: 'hq/bin/hq.mjs deps hq/lib/indexer.mjs --depth 2' },
    { what: 'indexed projects in the dependency graph: repos-hq, vivim-ui, vivim-web-harness', where: 'hq/lib/graph.mjs projectGraph' },
    { what: 'cross-project import edges: 0', where: 'hq/lib/graph.mjs projectGraph' },
  ],
  run: async () => {
    const findings = [];

    const deps = runHq(['deps', 'hq/lib/indexer.mjs', '--depth', '2'], { cwd: ROOT });
    if (deps.exit !== 0) throw new Error(`hq deps failed: exit=${deps.exit} stderr=${deps.stderr}`);
    const lines = deps.stdout.split('\n').map((l) => l.trimEnd());
    const header = (lines.find((l) => l.startsWith('forward deps for')) ?? '').trim();
    if (header !== 'forward deps for repos-hq/hq/lib/indexer.mjs') {
      throw new Error(`unexpected deps header: ${JSON.stringify(header)}`);
    }
    findings.push(finding(header, 'hq/bin/hq.mjs deps hq/lib/indexer.mjs --depth 2'));

    const edges = new Map();
    for (const line of lines.slice(1)) {
      const m = line.trim().match(/^repos-hq\/(.+?)\s+via (\S+)$/);
      if (m) edges.set(m[1], m[2]);
    }
    for (const [path, specifier] of DIRECT_EDGES) {
      if (edges.get(path) !== specifier) {
        throw new Error(`expected edge ${path} via ${specifier}, got ${edges.get(path)}`);
      }
      findings.push(finding(`hq/lib/indexer.mjs communicates with ${path} via ${specifier}`, 'hq/bin/hq.mjs deps hq/lib/indexer.mjs --depth 2'));
    }
    const transitive = [...edges.keys()].filter((p) => !DIRECT_EDGES.some(([d]) => d === p) && p !== 'hq/lib/indexer.mjs');
    findings.push(finding(`${transitive.length} transitive consumers reached at depth 2`, 'hq/bin/hq.mjs deps hq/lib/indexer.mjs --depth 2'));

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
    } finally {
      db.close();
    }

    return findings;
  },
});
