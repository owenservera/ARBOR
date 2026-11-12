// hq/aii/fixtures/HQ-019-boundary-crossings.mjs
// AII build lane "p1-existing-surface-fixtures". Scenario HQ-019 (group B):
// "Which architectural boundaries are being crossed?"
//
// Ground truth LOCKED 2026-11-11 from live output on branch main:
//   bun hq/bin/hq.mjs deps hq/bin/hq.mjs --reverse --depth 2
//     -> "reverse deps for repos-hq/hq/bin/hq.mjs" with only the entrypoint
//        itself — nothing imports the CLI, so the CLI is a boundary ROOT.
//   projectGraph(db) (hq/lib/graph.mjs:152-191) returned edges: [] — ZERO
//   cross-project import edges, so no repository boundary is crossed by an
//   import either.
//   The intra-project layer edges (resolved imports only, live):
//        hq/aii    -> hq/aii   40      hq/aii    -> hq/lib   49
//        hq/bin    -> hq/bin    3      hq/bin    -> hq/lib  139
//        hq/lib    -> hq/lib  164      hq/lib    -> other     1
//        hq/test   -> hq/bin    5      hq/test   -> hq/lib  215
//        hq/test   -> other   15      hq/test   -> scripts   8
//        other     -> other  173      other     -> hq/lib   31
//        scripts   -> scripts  3      scripts   -> hq/aii    1
//        scripts   -> hq/lib   20
//   The layer fact that answers the question: hq/lib never imports hq/bin
//   (0 edges), so the library layer does not reach back up into the CLI — the
//   one-way hq/bin -> hq/lib direction (139 edges) is the only bin/lib edge.
//
// The layer-pair COUNTS drift as lanes add files, so the expectations pin the
// BOUNDARY STRUCTURE (which layer pairs exist and which direction is
// forbidden) while run() re-derives the live counts.
import { defineFixture, finding, runHq } from './harness.mjs';
import { openDb } from '../../lib/schema.mjs';
import { projectGraph } from '../../lib/graph.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const LAYERS = ['hq/aii', 'hq/bin', 'hq/lib', 'hq/test', 'scripts', 'other'];

function layerOf(path) {
  for (const layer of LAYERS) {
    if (layer === 'other') continue;
    if (path.startsWith(`${layer}/`)) return layer;
  }
  return 'other';
}

export default defineFixture({
  id: 'HQ-019',
  provenance: 'Locked 2026-11-11 on branch main from live output: bun hq/bin/hq.mjs deps hq/bin/hq.mjs --reverse --depth 2 printed "reverse deps for repos-hq/hq/bin/hq.mjs" listing only the entrypoint itself — nothing imports the CLI, so hq/bin/hq.mjs is a boundary root. projectGraph(db) (hq/lib/graph.mjs:152) returned edges: [] — zero cross-project import edges, so no repository boundary is crossed by an import. Grouping the live resolved imports of repos-hq by layer gave: hq/aii->hq/aii 40, hq/aii->hq/lib 49, hq/bin->hq/bin 3, hq/bin->hq/lib 139, hq/lib->hq/lib 164, hq/lib->other 1, hq/test->hq/bin 5, hq/test->hq/lib 215, hq/test->other 15, hq/test->scripts 8, other->other 173, other->hq/lib 31, scripts->scripts 3, scripts->hq/aii 1, scripts->hq/lib 20 — notably hq/lib->hq/bin is 0, so the library layer never reaches up into the CLI. The layer-pair COUNTS drift as concurrent lanes add files, so the expectations pin the boundary STRUCTURE (the pair set, the forbidden hq/lib->hq/bin direction, the one-way bin->lib direction, the zero cross-project edges) while run() re-derives every count live. REFRESH 2026-11-11T22:1xZ: openmausbot was unregistered from projects.json between the morning lock and this repair (live projects.json now holds exactly repos-hq, vivim-ui, vivim-web-harness — verified by loadProjects + projectGraph this session), so the pinned indexed-project set drops openmausbot; the boundary structure (forbidden hq/lib->hq/bin direction, zero cross-project edges, layer-pair set over repos-hq files) is unchanged and re-verified live.',
  expected: [
    { what: 'reverse deps for repos-hq/hq/bin/hq.mjs', where: 'hq/bin/hq.mjs deps hq/bin/hq.mjs --reverse --depth 2' },
    { what: /^the CLI entrypoint hq\/bin\/hq\.mjs is imported by 0 other module, so it is a boundary root$/, where: 'hq/bin/hq.mjs deps hq/bin/hq.mjs --reverse --depth 2' },
    { what: 'cross-project import edges: 0', where: 'hq/lib/graph.mjs projectGraph' },
    { what: 'indexed projects in the dependency graph: repos-hq, vivim-ui, vivim-web-harness', where: 'hq/lib/graph.mjs projectGraph' },
    { what: 'the library layer never imports the CLI layer: hq/lib -> hq/bin edges = 0', where: 'hq/lib/graph.mjs layer edges' },
    { what: /^the CLI layer imports the library layer across \d+ resolved edges$/, where: 'hq/lib/graph.mjs layer edges' },
    { what: 'the layer pairs crossed by resolved imports: hq/aii->hq/aii, hq/aii->hq/lib, hq/bin->hq/bin, hq/bin->hq/lib, hq/lib->hq/lib, hq/lib->other, hq/test->hq/bin, hq/test->hq/lib, hq/test->other, hq/test->scripts, other->hq/lib, other->other, scripts->hq/aii, scripts->hq/lib, scripts->scripts', where: 'hq/lib/graph.mjs layer edges' },
  ],
  run: async () => {
    const findings = [];

    const reverse = runHq(['deps', 'hq/bin/hq.mjs', '--reverse', '--depth', '2'], { cwd: ROOT });
    if (reverse.exit !== 0) throw new Error(`hq deps --reverse failed: exit=${reverse.exit} stderr=${reverse.stderr}`);
    const lines = reverse.stdout.split('\n').map((l) => l.trim()).filter(Boolean);
    const header = lines[0] ?? '';
    if (header !== 'reverse deps for repos-hq/hq/bin/hq.mjs') {
      throw new Error(`unexpected reverse header: ${JSON.stringify(header)}`);
    }
    findings.push(finding(header, 'hq/bin/hq.mjs deps hq/bin/hq.mjs --reverse --depth 2'));
    const importers = lines.slice(1).filter((l) => l.startsWith('repos-hq/') && l !== 'repos-hq/hq/bin/hq.mjs');
    findings.push(finding(`the CLI entrypoint hq/bin/hq.mjs is imported by ${importers.length} other module, so it is a boundary root`, 'hq/bin/hq.mjs deps hq/bin/hq.mjs --reverse --depth 2'));

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

      const rows = db.prepare(
        `SELECT f.path AS fp, g.path AS gp
           FROM imports i
           JOIN files f ON f.id = i.file_id
           JOIN files g ON g.id = i.resolved_file_id
          WHERE f.project_id = (SELECT id FROM projects WHERE name = 'repos-hq')`,
      ).all();
      const pairs = new Map();
      for (const row of rows) {
        const key = `${layerOf(row.fp)}->${layerOf(row.gp)}`;
        pairs.set(key, (pairs.get(key) ?? 0) + 1);
      }
      const libToBin = pairs.get('hq/lib->hq/bin') ?? 0;
      if (libToBin !== 0) {
        throw new Error(`expected 0 hq/lib->hq/bin edges, got ${libToBin}`);
      }
      findings.push(finding('the library layer never imports the CLI layer: hq/lib -> hq/bin edges = 0', 'hq/lib/graph.mjs layer edges'));
      const binToLib = pairs.get('hq/bin->hq/lib') ?? 0;
      findings.push(finding(`the CLI layer imports the library layer across ${binToLib} resolved edges`, 'hq/lib/graph.mjs layer edges'));
      const pairList = [...pairs.keys()].sort().join(', ');
      findings.push(finding(`the layer pairs crossed by resolved imports: ${pairList}`, 'hq/lib/graph.mjs layer edges'));
    } finally {
      db.close();
    }

    return findings;
  },
});
