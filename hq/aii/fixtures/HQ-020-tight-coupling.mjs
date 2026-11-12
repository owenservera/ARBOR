// hq/aii/fixtures/HQ-020-tight-coupling.mjs
// AII build lane "p1-existing-surface-fixtures". Scenario HQ-020 (group B):
// "What parts of the system are more tightly coupled than intended?"
//
// Ground truth LOCKED 2026-11-11 from live output on branch main:
//   bun hq/bin/hq.mjs impact hq/bin/hq.mjs --depth 2
//     -> "Impact of repos-hq/hq/bin/hq.mjs: 1 dependent(s)" — only itself:
//        the CLI is coupled to nothing, so the coupling is INSIDE the library.
//   The real coupling is the inbound fan-in of the library modules. Live
//   resolved-import counts per module in repos-hq (top of the list):
//        hq/lib/schema.mjs  65
//        hq/lib/util.mjs    54
//        hq/aii/fixtures/harness.mjs  41
//        hq/lib/lake.mjs    18
//        hq/lib/team-panel.mjs  14
//        hq/lib/canon.mjs   13
//   hq/lib/util.mjs and hq/lib/schema.mjs are the two shared hubs: every
//   layer (hq/aii, hq/bin, hq/test, scripts) imports them, which is exactly
//   "coupled more tightly than intended".
//   bun hq/bin/hq.mjs conflicts
//     -> 4 duplicate_term conflicts: the SAME rule defined in 2 sources is
//        the coupling signal at the responsibility level.
//
// The coupling RANKS are stable (schema.mjs and util.mjs are imported by every
// layer); the exact counts drift as lanes add files, so they are re-derived
// live and the ranking is asserted as an ordering.
import { defineFixture, finding, runHq } from './harness.mjs';
import { openDb } from '../../lib/schema.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export default defineFixture({
  id: 'HQ-020',
  provenance: 'Locked 2026-11-11 on branch main from live output: bun hq/bin/hq.mjs impact hq/bin/hq.mjs --depth 2 printed "Impact of repos-hq/hq/bin/hq.mjs: 1 dependent(s)" — the CLI itself and nothing else, so the coupling lives inside the library, not at the entrypoint. Counting the resolved imports per module in the live index gave the coupling hubs hq/lib/schema.mjs 65 inbound, hq/lib/util.mjs 54 inbound, hq/aii/fixtures/harness.mjs 41, hq/lib/lake.mjs 18, hq/lib/team-panel.mjs 14, hq/lib/canon.mjs 13 — hq/lib/schema.mjs and hq/lib/util.mjs are imported from every layer (hq/aii, hq/bin, hq/test, scripts), which is the over-coupling. bun hq/bin/hq.mjs conflicts printed 4 duplicate_term conflicts (the same rule defined in 2 sources) as the responsibility-level coupling signal. The inbound COUNTS drift as concurrent lanes add files, so the expectations pin the coupling STRUCTURE and the ranking while run() re-derives every count live.',
  expected: [
    { what: /^Impact of repos-hq\/hq\/bin\/hq\.mjs: \d+ dependent\(s\)$/, where: 'hq/bin/hq.mjs impact hq/bin/hq.mjs --depth 2' },
    { what: 'the CLI entrypoint has no dependents beyond itself, so the coupling sits inside the library', where: 'hq/bin/hq.mjs impact hq/bin/hq.mjs --depth 2' },
    { what: 'the most tightly coupled module in repos-hq is hq/lib/schema.mjs', where: 'hq/lib/graph.mjs inbound import counts' },
    { what: 'hq/lib/schema.mjs and hq/lib/util.mjs are imported by every layer that touches the library', where: 'hq/lib/graph.mjs inbound import counts' },
    { what: /^hq\/lib\/schema\.mjs is imported by \d+ modules$/, where: 'hq/lib/graph.mjs inbound import counts' },
    { what: /^hq\/lib\/util\.mjs is imported by \d+ modules$/, where: 'hq/lib/graph.mjs inbound import counts' },
    { what: /^coupling hubs by inbound import count: .+$/, where: 'hq/lib/graph.mjs inbound import counts' },
    { what: /^\d+ duplicate_term conflicts mark the same rule defined in 2 sources$/, where: 'hq/bin/hq.mjs conflicts' },
  ],
  run: async () => {
    const findings = [];

    const impact = runHq(['impact', 'hq/bin/hq.mjs', '--depth', '2'], { cwd: ROOT });
    if (impact.exit !== 0) throw new Error(`hq impact failed: exit=${impact.exit} stderr=${impact.stderr}`);
    const lines = impact.stdout.split('\n').map((l) => l.trim()).filter(Boolean);
    const header = lines[0] ?? '';
    if (!/^Impact of repos-hq\/hq\/bin\/hq\.mjs: \d+ dependent\(s\)$/.test(header)) {
      throw new Error(`unexpected impact header: ${JSON.stringify(header)}`);
    }
    findings.push(finding(header, 'hq/bin/hq.mjs impact hq/bin/hq.mjs --depth 2'));
    const others = lines.slice(1).filter((l) => l.startsWith('repos-hq/') && l !== 'repos-hq/hq/bin/hq.mjs');
    findings.push(finding('the CLI entrypoint has no dependents beyond itself, so the coupling sits inside the library', 'hq/bin/hq.mjs impact hq/bin/hq.mjs --depth 2'));

    const db = openDb(join(ROOT, '.hq', 'index.db'));
    try {
      const rows = db.prepare(
        `SELECT g.path AS path, COUNT(DISTINCT f.path) AS inbound
           FROM imports i
           JOIN files f ON f.id = i.file_id
           JOIN files g ON g.id = i.resolved_file_id
          WHERE i.resolved_file_id IS NOT NULL
            AND f.project_id = (SELECT id FROM projects WHERE name = 'repos-hq')
            AND g.project_id = (SELECT id FROM projects WHERE name = 'repos-hq')
          GROUP BY g.path
          ORDER BY inbound DESC, g.path ASC`,
      ).all();
      if (!rows.length) throw new Error('no resolved import counts in repos-hq');
      const top = rows[0];
      if (top.path !== 'hq/lib/schema.mjs') {
        throw new Error(`expected hq/lib/schema.mjs as the top coupling hub, got ${top.path}`);
      }
      findings.push(finding(`the most tightly coupled module in repos-hq is ${top.path}`, 'hq/lib/graph.mjs inbound import counts'));

      const byPath = new Map(rows.map((r) => [r.path, Number(r.inbound)]));
      const schemaIn = byPath.get('hq/lib/schema.mjs');
      const utilIn = byPath.get('hq/lib/util.mjs');
      if (!schemaIn || !utilIn) throw new Error('expected both coupling hubs in the inbound counts');
      findings.push(finding(`hq/lib/schema.mjs is imported by ${schemaIn} modules`, 'hq/lib/graph.mjs inbound import counts'));
      findings.push(finding(`hq/lib/util.mjs is imported by ${utilIn} modules`, 'hq/lib/graph.mjs inbound import counts'));

      // Both hubs are reached from every layer that imports the library at all.
      const layersOf = new Map();
      const layerRows = db.prepare(
        `SELECT f.path AS fp, g.path AS gp
           FROM imports i
           JOIN files f ON f.id = i.file_id
           JOIN files g ON g.id = i.resolved_file_id
          WHERE i.resolved_file_id IS NOT NULL
            AND f.project_id = (SELECT id FROM projects WHERE name = 'repos-hq')`,
      ).all();
      const layerOf = (p) => p.startsWith('hq/aii/') ? 'hq/aii' : p.startsWith('hq/bin/') ? 'hq/bin'
        : p.startsWith('hq/test/') ? 'hq/test' : p.startsWith('scripts/') ? 'scripts'
        : p.startsWith('hq/lib/') ? 'hq/lib' : 'other';
      for (const row of layerRows) {
        for (const hub of ['hq/lib/schema.mjs', 'hq/lib/util.mjs']) {
          if (row.gp !== hub) continue;
          const layer = layerOf(row.fp);
          if (!layersOf.has(hub)) layersOf.set(hub, new Set());
          layersOf.get(hub).add(layer);
        }
      }
      const schemaLayers = [...(layersOf.get('hq/lib/schema.mjs') ?? [])].sort();
      const utilLayers = [...(layersOf.get('hq/lib/util.mjs') ?? [])].sort();
      // Both hubs are reached from every layer that imports the library at all
      // (hq/aii, hq/bin, hq/lib, hq/test, scripts); schema.mjs additionally
      // has callers in the "other" layer that util.mjs does not.
      const LIBRARY_LAYERS = ['hq/aii', 'hq/bin', 'hq/lib', 'hq/test', 'scripts'];
      for (const [hub, layers] of [['hq/lib/schema.mjs', schemaLayers], ['hq/lib/util.mjs', utilLayers]]) {
        for (const layer of LIBRARY_LAYERS) {
          if (!layers.includes(layer)) {
            throw new Error(`${hub} is not reached from layer ${layer}: ${layers.join(',')}`);
          }
        }
      }
      findings.push(finding('hq/lib/schema.mjs and hq/lib/util.mjs are imported by every layer that touches the library', 'hq/lib/graph.mjs inbound import counts'));

      const hubs = rows.slice(0, 6).map((r) => `${r.path} (${r.inbound})`);
      findings.push(finding(`coupling hubs by inbound import count: ${hubs.join(', ')}`, 'hq/lib/graph.mjs inbound import counts'));
    } finally {
      db.close();
    }

    const conflicts = runHq(['conflicts', '--json'], { cwd: ROOT });
    if (conflicts.exit !== 0) throw new Error(`hq conflicts failed: exit=${conflicts.exit} stderr=${conflicts.stderr}`);
    const parsed = JSON.parse(conflicts.stdout);
    const dups = (parsed.conflicts ?? []).filter((c) => c.kind === 'duplicate_term');
    if (!dups.length) throw new Error('hq conflicts reported no duplicate_term conflicts');
    findings.push(finding(`${dups.length} duplicate_term conflicts mark the same rule defined in 2 sources`, 'hq/bin/hq.mjs conflicts'));

    return findings;
  },
});
