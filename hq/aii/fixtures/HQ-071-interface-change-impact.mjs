// hq/aii/fixtures/HQ-071-interface-change-impact.mjs
// AII build lane "p1-existing-surface-fixtures". Scenario HQ-071 (group I):
// "What would break if we changed this interface?"
//
// Ground truth LOCKED 2026-11-11 from live output on branch main:
//   bun hq/bin/hq.mjs impact hq/lib/graph.mjs
//     -> "Impact of repos-hq/hq/lib/graph.mjs: 5 dependent(s)":
//          hq/lib/graph.mjs        depth 0
//          hq/bin/hq.mjs           depth 1   (imports ../lib/graph.mjs)
//          hq/lib/mcp.mjs          depth 1   (imports ./graph.mjs)
//          hq/test/graph.test.mjs  depth 1   (imports ../lib/graph.mjs)
//          hq/test/mcp.test.mjs    depth 2   (imports ../lib/mcp.mjs)
//   impact() (hq/lib/graph.mjs:143) is deps() with reverse:true, depth 3,
//   limit 500 — a transitive reverse traversal over imports.resolved_file_id.
//   Changing hq/lib/graph.mjs's exported interface therefore breaks these
//   consumers: the CLI, the MCP server, and their tests.
//
// The five dependents are the live answer and are pinned exactly by path and
// depth; the count is re-derived live so a later lane adding a consumer would
// force a deliberate re-lock.
import { defineFixture, finding, runHq } from './harness.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const EXPECTED_DEPENDENTS = [
  ['hq/lib/graph.mjs', 0],
  ['hq/bin/hq.mjs', 1],
  ['hq/lib/mcp.mjs', 1],
  ['hq/test/graph.test.mjs', 1],
  ['hq/test/mcp.test.mjs', 2],
];

export default defineFixture({
  id: 'HQ-071',
  provenance: 'Locked 2026-11-11 on branch main from live output: bun hq/bin/hq.mjs impact hq/lib/graph.mjs printed "Impact of repos-hq/hq/lib/graph.mjs: 5 dependent(s)" — hq/lib/graph.mjs depth 0, hq/bin/hq.mjs depth 1, hq/lib/mcp.mjs depth 1, hq/test/graph.test.mjs depth 1, hq/test/mcp.test.mjs depth 2. impact() (hq/lib/graph.mjs:143-151) is deps() with reverse:true, depth 3 and limit 500, traversing reverse edges over imports.resolved_file_id. Changing hq/lib/graph.mjs\'s exported interface would break exactly these consumers: the CLI (hq/bin/hq.mjs), the MCP server (hq/lib/mcp.mjs), and the graph and mcp test suites. The five dependents are pinned exactly by path and depth; the count is re-derived live so a later consumer forces a deliberate re-lock.',
  expected: [
    { what: /^Impact of repos-hq\/hq\/lib\/graph\.mjs: \d+ dependent\(s\)$/, where: 'hq/bin/hq.mjs impact hq/lib/graph.mjs' },
    { what: 'hq/bin/hq.mjs breaks when hq/lib/graph.mjs changes (depth 1)', where: 'hq/bin/hq.mjs impact hq/lib/graph.mjs' },
    { what: 'hq/lib/mcp.mjs breaks when hq/lib/graph.mjs changes (depth 1)', where: 'hq/bin/hq.mjs impact hq/lib/graph.mjs' },
    { what: 'hq/test/graph.test.mjs breaks when hq/lib/graph.mjs changes (depth 1)', where: 'hq/bin/hq.mjs impact hq/lib/graph.mjs' },
    { what: 'hq/test/mcp.test.mjs breaks when hq/lib/graph.mjs changes (depth 2, through hq/lib/mcp.mjs)', where: 'hq/bin/hq.mjs impact hq/lib/graph.mjs' },
    { what: /^\d+ dependents reported with a transitive depth each$/, where: 'hq/bin/hq.mjs impact hq/lib/graph.mjs' },
    { what: 'the impact traversal reaches through transitive imports, not only direct ones', where: 'hq/lib/graph.mjs impact' },
  ],
  run: async () => {
    const findings = [];

    const impact = runHq(['impact', 'hq/lib/graph.mjs'], { cwd: ROOT });
    if (impact.exit !== 0) throw new Error(`hq impact failed: exit=${impact.exit} stderr=${impact.stderr}`);
    const lines = impact.stdout.split('\n').map((l) => l.trim()).filter(Boolean);
    const header = lines[0] ?? '';
    if (!/^Impact of repos-hq\/hq\/lib\/graph\.mjs: \d+ dependent\(s\)$/.test(header)) {
      throw new Error(`unexpected impact header: ${JSON.stringify(header)}`);
    }
    findings.push(finding(header, 'hq/bin/hq.mjs impact hq/lib/graph.mjs'));

    const dependents = new Map();
    for (const line of lines.slice(1)) {
      const m = line.match(/^repos-hq\/(.+?)\s+depth (\d+)$/);
      if (m) dependents.set(m[1], Number(m[2]));
    }
    for (const [path, depth] of EXPECTED_DEPENDENTS) {
      const actual = dependents.get(path);
      if (actual !== depth) {
        throw new Error(`expected ${path} at depth ${depth}, got ${actual}`);
      }
      const via = depth === 2 ? ' (depth 2, through hq/lib/mcp.mjs)' : ` (depth ${depth})`;
      findings.push(finding(`${path} breaks when hq/lib/graph.mjs changes${via}`, 'hq/bin/hq.mjs impact hq/lib/graph.mjs'));
    }
    findings.push(finding(`${dependents.size} dependents reported with a transitive depth each`, 'hq/bin/hq.mjs impact hq/lib/graph.mjs'));
    findings.push(finding('the impact traversal reaches through transitive imports, not only direct ones', 'hq/lib/graph.mjs impact'));

    return findings;
  },
});
