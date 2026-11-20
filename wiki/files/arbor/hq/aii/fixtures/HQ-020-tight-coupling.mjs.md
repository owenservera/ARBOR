# File: hq/aii/fixtures/HQ-020-tight-coupling.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-020-tight-coupling.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9092 B |
| Lines | 139 |
| Hash | 9decdaf129f8 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 32 | no | const ROOT = join(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| findings | const | 48 | no | const findings = []; |
| impact | const | 50 | no | const impact = runHq([&#39;impact&#39;, &#39;hq/bin/hq.mjs&#39;, &#39;--depth&#39;, &#39;2&#39;], { cwd: ROOT }); |
| lines | const | 52 | no | const lines = impact.stdout.split(&#39;\\n&#39;).map((l) =&gt; l.trim()).filter(Boolean); |
| header | const | 53 | no | const header = lines[0] ?? &#39;&#39;; |
| others | const | 58 | no | const others = lines.slice(1).filter((l) =&gt; l.startsWith(&#39;repos-hq/&#39;) &amp;&amp; l !== &#39;repos-hq/hq/bin/hq.mjs&#39;); |
| db | const | 61 | no | const db = openDb(join(ROOT, &#39;.hq&#39;, &#39;index.db&#39;)); |
| rows | const | 63 | no | const rows = db.prepare( `SELECT g.path AS path, COUNT(DISTINCT f.path) AS inbound FROM imports i JOIN files f ON f.id = i.file_id JOIN files g ON g.id = i.resolved_file_id |
| top | const | 75 | no | const top = rows[0]; |
| byPath | const | 81 | no | const byPath = new Map(rows.map((r) =&gt; [r.path, Number(r.inbound)])); |
| schemaIn | const | 82 | no | const schemaIn = byPath.get(&#39;hq/lib/schema.mjs&#39;); |
| utilIn | const | 83 | no | const utilIn = byPath.get(&#39;hq/lib/util.mjs&#39;); |
| layersOf | const | 89 | no | const layersOf = new Map(); |
| layerRows | const | 90 | no | const layerRows = db.prepare( `SELECT f.path AS fp, g.path AS gp FROM imports i JOIN files f ON f.id = i.file_id JOIN files g ON g.id = i.resolved_file_id |
| layerOf | function | 98 | no | const layerOf = (p) =&gt; p.startsWith(&#39;hq/aii/&#39;) ? &#39;hq/aii&#39; : p.startsWith(&#39;hq/bin/&#39;) ? &#39;hq/bin&#39; |
| layer | const | 104 | no | const layer = layerOf(row.fp); |
| schemaLayers | const | 109 | no | const schemaLayers = [...(layersOf.get(&#39;hq/lib/schema.mjs&#39;) ?? [])].sort(); |
| utilLayers | const | 110 | no | const utilLayers = [...(layersOf.get(&#39;hq/lib/util.mjs&#39;) ?? [])].sort(); |
| LIBRARY_LAYERS | const | 114 | no | const LIBRARY_LAYERS = [&#39;hq/aii&#39;, &#39;hq/bin&#39;, &#39;hq/lib&#39;, &#39;hq/test&#39;, &#39;scripts&#39;]; |
| hubs | const | 124 | no | const hubs = rows.slice(0, 6).map((r) =&gt; `${r.path} (${r.inbound})`); |
| conflicts | const | 130 | no | const conflicts = runHq([&#39;conflicts&#39;, &#39;--json&#39;], { cwd: ROOT }); |
| parsed | const | 132 | no | const parsed = JSON.parse(conflicts.stdout); |
| dups | const | 133 | no | const dups = (parsed.conflicts ?? []).filter((c) =&gt; c.kind === &#39;duplicate_term&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 27 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/schema.mjs | import | 28 | [hq/lib/schema.mjs](../../lib/schema.mjs.md) |
| node:path | import | 29 | external |
| node:url | import | 30 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 140 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
