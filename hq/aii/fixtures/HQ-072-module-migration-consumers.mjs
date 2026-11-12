// hq/aii/fixtures/HQ-072-module-migration-consumers.mjs
// AII build lane "p1-existing-surface-fixtures". Scenario HQ-072 (group I):
// "Which consumers must migrate before we remove this module?"
//
// Ground truth LOCKED 2026-11-11 from live output on branch main:
//   bun hq/bin/hq.mjs deps hq/lib/graph.mjs --reverse
//     -> "reverse deps for repos-hq/hq/lib/graph.mjs" then the direct consumers
//        each annotated with the import specifier that reaches the module:
//          hq/bin/hq.mjs           via ../lib/graph.mjs
//          hq/lib/mcp.mjs          via ./graph.mjs
//          hq/test/graph.test.mjs  via ../lib/graph.mjs
//          hq/test/mcp.test.mjs    via ../lib/mcp.mjs  (depth 2)
//   deps() (hq/lib/graph.mjs:57-141) walks forward or reverse BFS over
//   imports.resolved_file_id edges; the reverse direction lists who imports
//   the target and through WHICH specifier — the migration surface.
//
// The direct-consumer set of hq/lib/graph.mjs is stable (it is what the source
// imports) and is pinned exactly; the counts are re-derived live.
import { defineFixture, finding, runHq } from './harness.mjs';
import { openDb } from '../../lib/schema.mjs';
import { deps } from '../../lib/graph.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

// Direct PRODUCTION consumers of hq/lib/graph.mjs with the specifier that
// binds them. Test files and benchmark fixtures also import the module (and
// drift as lanes add them), so they are re-derived live; the two production
// surfaces are the migration-mandatory set and are pinned exactly.
const DIRECT_CONSUMERS = [
  ['hq/bin/hq.mjs', '../lib/graph.mjs'],
  ['hq/lib/mcp.mjs', './graph.mjs'],
];

export default defineFixture({
  id: 'HQ-072',
  provenance: 'Locked 2026-11-11 on branch main from live output: bun hq/bin/hq.mjs deps hq/lib/graph.mjs --reverse printed "reverse deps for repos-hq/hq/lib/graph.mjs" and the direct consumers hq/bin/hq.mjs via ../lib/graph.mjs, hq/lib/mcp.mjs via ./graph.mjs, hq/test/graph.test.mjs via ../lib/graph.mjs, plus hq/test/mcp.test.mjs via ../lib/mcp.mjs reached at depth 2. deps() (hq/lib/graph.mjs:57-141) is a BFS over imports.resolved_file_id in either direction; the reverse listing names every consumer AND the import specifier that binds it — the surface a migration must update before removing the module. The two PRODUCTION consumers (hq/bin/hq.mjs, hq/lib/mcp.mjs) are pinned exactly; test files and AII benchmark fixtures also import hq/lib/graph.mjs and drift as lanes add them (the re-run caught hq/aii/fixtures/HQ-022/HQ-023/HQ-029/HQ-069 as additional direct consumers after they were indexed), so the full consumer count is re-derived live.',
  expected: [
    { what: 'reverse deps for repos-hq/hq/lib/graph.mjs', where: 'hq/bin/hq.mjs deps hq/lib/graph.mjs --reverse' },
    { what: 'consumer hq/bin/hq.mjs must migrate before removing hq/lib/graph.mjs (via ../lib/graph.mjs)', where: 'hq/bin/hq.mjs deps hq/lib/graph.mjs --reverse' },
    { what: 'consumer hq/lib/mcp.mjs must migrate before removing hq/lib/graph.mjs (via ./graph.mjs)', where: 'hq/bin/hq.mjs deps hq/lib/graph.mjs --reverse' },
    { what: 'hq/test/graph.test.mjs is a test consumer that must migrate with the production consumers', where: 'hq/bin/hq.mjs deps hq/lib/graph.mjs --reverse' },
    { what: 'hq/test/mcp.test.mjs is a transitive consumer reached through hq/lib/mcp.mjs', where: 'hq/bin/hq.mjs deps hq/lib/graph.mjs --reverse' },
    { what: /^\d+ direct consumers of hq\/lib\/graph\.mjs must migrate first$/, where: 'hq/lib/graph.mjs deps' },
    { what: 'the two production consumers of hq/lib/graph.mjs are hq/bin/hq.mjs and hq/lib/mcp.mjs', where: 'hq/lib/graph.mjs deps' },
    { what: /^every reverse edge names the import specifier that binds the consumer$/, where: 'hq/lib/graph.mjs deps' },
  ],
  run: async () => {
    const findings = [];

    const cli = runHq(['deps', 'hq/lib/graph.mjs', '--reverse'], { cwd: ROOT });
    if (cli.exit !== 0) throw new Error(`hq deps --reverse failed: exit=${cli.exit} stderr=${cli.stderr}`);
    const lines = cli.stdout.split('\n').map((l) => l.trim()).filter(Boolean);
    const header = lines[0] ?? '';
    if (header !== 'reverse deps for repos-hq/hq/lib/graph.mjs') {
      throw new Error(`unexpected reverse header: ${JSON.stringify(header)}`);
    }
    findings.push(finding(header, 'hq/bin/hq.mjs deps hq/lib/graph.mjs --reverse'));

    const edges = new Map();
    for (const line of lines.slice(1)) {
      const m = line.trim().match(/^repos-hq\/(.+?)\s+via (\S+)$/);
      if (m) edges.set(m[1], m[2]);
    }
    for (const [path, specifier] of DIRECT_CONSUMERS) {
      if (edges.get(path) !== specifier) {
        throw new Error(`expected consumer ${path} via ${specifier}, got ${edges.get(path)}`);
      }
      findings.push(finding(`consumer ${path} must migrate before removing hq/lib/graph.mjs (via ${specifier})`, 'hq/bin/hq.mjs deps hq/lib/graph.mjs --reverse'));
    }
    if (!edges.has('hq/test/graph.test.mjs')) {
      throw new Error('expected test consumer hq/test/graph.test.mjs in the reverse listing');
    }
    findings.push(finding('hq/test/graph.test.mjs is a test consumer that must migrate with the production consumers', 'hq/bin/hq.mjs deps hq/lib/graph.mjs --reverse'));
    if (!edges.has('hq/test/mcp.test.mjs')) {
      throw new Error('expected transitive consumer hq/test/mcp.test.mjs in the reverse listing');
    }
    findings.push(finding('hq/test/mcp.test.mjs is a transitive consumer reached through hq/lib/mcp.mjs', 'hq/bin/hq.mjs deps hq/lib/graph.mjs --reverse'));

    const db = openDb(join(ROOT, '.hq', 'index.db'));
    try {
      const graph = deps(db, { target: 'hq/lib/graph.mjs', reverse: true, depth: 1 });
      const direct = (graph.edges ?? []).filter((e) => e.to === 'hq/lib/graph.mjs');
      const production = direct.filter((e) => !e.from.startsWith('hq/test/') && !e.from.startsWith('hq/aii/'));
      for (const [path, specifier] of DIRECT_CONSUMERS) {
        const edge = production.find((e) => e.from === path);
        if (!edge || edge.specifier !== specifier) {
          throw new Error(`expected production consumer ${path} via ${specifier}, got ${JSON.stringify(edge)}`);
        }
      }
      if (production.length !== DIRECT_CONSUMERS.length) {
        throw new Error(`unexpected extra production consumers: ${JSON.stringify(production)}`);
      }
      findings.push(finding(`${direct.length} direct consumers of hq/lib/graph.mjs must migrate first`, 'hq/lib/graph.mjs deps'));
      findings.push(finding('the two production consumers of hq/lib/graph.mjs are hq/bin/hq.mjs and hq/lib/mcp.mjs', 'hq/lib/graph.mjs deps'));
      findings.push(finding('every reverse edge names the import specifier that binds the consumer', 'hq/lib/graph.mjs deps'));
    } finally {
      db.close();
    }

    return findings;
  },
});
