# File: hq/aii/fixtures/HQ-072-module-migration-consumers.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-072-module-migration-consumers.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7118 B |
| Lines | 104 |
| Hash | 65c3f4ceac47 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 25 | no | const ROOT = join(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| DIRECT_CONSUMERS | const | 31 | no | const DIRECT_CONSUMERS = [ |
| findings | const | 50 | no | const findings = []; |
| cli | const | 52 | no | const cli = runHq([&#39;deps&#39;, &#39;hq/lib/graph.mjs&#39;, &#39;--reverse&#39;], { cwd: ROOT }); |
| lines | const | 54 | no | const lines = cli.stdout.split(&#39;\\n&#39;).map((l) =&gt; l.trim()).filter(Boolean); |
| header | const | 55 | no | const header = lines[0] ?? &#39;&#39;; |
| edges | const | 61 | no | const edges = new Map(); |
| m | const | 63 | no | const m = line.trim().match(/^repos-hq\\/(.+?)\\s+via (\\S+)$/); |
| db | const | 81 | no | const db = openDb(join(ROOT, &#39;.hq&#39;, &#39;index.db&#39;)); |
| graph | const | 83 | no | const graph = deps(db, { target: &#39;hq/lib/graph.mjs&#39;, reverse: true, depth: 1 }); |
| direct | const | 84 | no | const direct = (graph.edges ?? []).filter((e) =&gt; e.to === &#39;hq/lib/graph.mjs&#39;); |
| production | const | 85 | no | const production = direct.filter((e) =&gt; !e.from.startsWith(&#39;hq/test/&#39;) &amp;&amp; !e.from.startsWith(&#39;hq/aii/&#39;)); |
| edge | const | 87 | no | const edge = production.find((e) =&gt; e.from === path); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 19 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/schema.mjs | import | 20 | [hq/lib/schema.mjs](../../lib/schema.mjs.md) |
| ../../lib/graph.mjs | import | 21 | [hq/lib/graph.mjs](../../lib/graph.mjs.md) |
| node:path | import | 22 | external |
| node:url | import | 23 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 105 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
