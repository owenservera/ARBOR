# File: hq/aii/fixtures/HQ-102-core-vs-peripheral.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-102-core-vs-peripheral.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5709 B |
| Lines | 85 |
| Hash | 069fd256ca8c |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| seedGraph | function | 18 | no | function seedGraph(db) { |
| insFile | const | 20 | no | const insFile = db.prepare(&quot;INSERT INTO files (id, project_id, path, abs_path, lang, kind, is_test) VALUES (?, 1, ?, ?, &#39;js&#39;, &#39;source&#39;, 0)&quot;); |
| files | const | 21 | no | const files = [ |
| insImport | const | 29 | no | const insImport = db.prepare(&quot;INSERT INTO imports (file_id, project_id, specifier, kind, resolved_file_id, resolved_project_id, line) VALUES (?, 1, ?, &#39;import&#39;, ?, 1, ?)&quot;); |
| insSymbol | const | 36 | no | const insSymbol = db.prepare(&quot;INSERT INTO symbols (file_id, project_id, name, kind, line, exported) VALUES (?, 1, ?, &#39;function&#39;, 1, 1)&quot;); |
| findings | const | 58 | no | const findings = []; |
| db | const | 59 | no | const db = openMemoryDb(); |
| core | const | 62 | no | const core = impact(db, { target: &#39;kernel.mjs&#39;, project: &#39;repos-hq&#39;, depth: 1, limit: 50 }); |
| mid | const | 67 | no | const mid = impact(db, { target: &#39;service-b.mjs&#39;, project: &#39;repos-hq&#39;, depth: 1, limit: 50 }); |
| orphans | const | 71 | no | const orphans = staticOrphans(db, { project: &#39;repos-hq&#39; }); |
| orphanPaths | const | 72 | no | const orphanPaths = orphans.map((o) =&gt; o.path); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 14 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/schema.mjs | import | 15 | [hq/lib/schema.mjs](../../lib/schema.mjs.md) |
| ../../lib/graph.mjs | import | 16 | [hq/lib/graph.mjs](../../lib/graph.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-102-core-vs-peripheral.mjs
// AII scenario HQ-102 (group M): "Which parts of this codebase are core, and which are peripheral?"
// Engine: hq/lib/graph.mjs — impact() (graph.mjs:143, reverse deps walk) and staticOrphans()
// (graph.mjs:233) over the real files/imports schema (schema.mjs:30-75), seeded in memory.
//
// Ground truth LOCKED 2026-11-11 (this session):
//   - deps()/impact() walk the imports graph: forward = what a file pulls in; reverse =
//     what depends on the file (graph.mjs:57-142). A module with wide reverse-dep reach
//     is core; a module with no inbound static edge is peripheral (staticOrphans,
//     graph.mjs:233).
//   - Seeded graph (in-memory db, real schema): a kernel module imported by 3 modules,
//     a service imported by 1, and a leaf nothing imports.

import { defineFixture, finding } from './harness.mjs';
import { openMemoryDb } from '../../lib/schema.mjs';
import { impact, staticOrphans } from '../../lib/graph.mjs';

function seedGraph(db) {
  db.prepare("INSERT INTO projects (id, name, path, added_at) VALUES (1, 'repos-hq', '.', '2026-11-11T00:00:00.000Z')").run();
  const insFile = db.prepare("INSERT INTO files (id, project_id, path, abs_path, lang, kind, is_test) VALUES (?, 1, ?, ?, 'js', 'source', 0)");
  const files = [
    [1, 'hq/lib/kernel.mjs', 'C:/seed/hq/lib/kernel.mjs'],
    [2, 'hq/lib/service-a.mjs', 'C:/seed/hq/lib/service-a.mjs'],
    [3, 'hq/lib/service-b.mjs', 'C:/seed/hq/lib/service-b.mjs'],
    [4, 'hq/lib/service-c.mjs', 'C:/seed/hq/lib/service-c.mjs'],
    [5, 'hq/lib/leaf-experimental.mjs', 'C:/seed/hq/lib/leaf-experimental.mjs'],
  ];
  for (const [id, path, abs] of files) insFile.run(id, path, abs);
  const insImport = db.prepare("INSERT INTO imports (file_id, project_id, specifier, kind, resolved_file_id, resolved_project_id, line) VALUES (?, 1, ?, 'import', ?, 1, ?)");
  // service-a/b/c each import kernel; service-a imports service-b; nothing imports leaf.
  insImport.run(2, './kernel.mjs', 1, 1);
  insImport.run(3, './kernel.mjs', 1, 1);
  insImport.run(4, './kernel.mjs', 1, 1);
  insImport.run(2, './service-b.mjs', 3, 2);
  // staticOrphans joins symbols (graph.mjs:244, s.exported = 1) — give every module one.
  const insSymbol = db.prepare("INSERT INTO symbols (file_id, project_id, name, kind, line, exported) VALUES (?, 1, ?, 'function', 1, 1)");
  for (const [id, name] of [[1, 'kernelMain'], [2, 'serviceAMain'], [3, 'serviceBMain'], [4, 'serviceCMain'], [5, 'leafMain']]) {
    insSymbol.run(id, name);
  }
}

export default defineFixture({
  id: 'HQ-102',
  provenance:
    '2026-11-11 (this session): locked from hq/lib/graph.mjs exercised on a seeded in-memory graph using the real ' +
    'files/imports schema (schema.mjs:30-75). impact() (graph.mjs:143-150) is deps() with reverse:true and depth 3 ' +
    '(graph.mjs:57-142) — reverse reach = how much depends on the module (core-ness); staticOrphans (graph.mjs:233) ' +
    'reports modules with no inbound static edge (peripheral). Seed: kernel imported by 3 modules, service-b by 1, ' +
    'leaf-experimental by none. No workspace writes.',
  expected: [
    { what: 'hq/lib/kernel.mjs is core: three modules depend on it (widest reverse reach)', where: 'hq/lib/graph.mjs impact' },
    { what: 'hq/lib/service-b.mjs is mid-core: one module depends on it, and it carries its own dependents', where: 'hq/lib/graph.mjs impact' },
    { what: 'hq/lib/leaf-experimental.mjs is peripheral: no inbound static import edge (static orphan)', where: 'hq/lib/graph.mjs staticOrphans' },
    { what: 'the reverse-dep walk resolves through resolved_file_id edges of the real imports schema', where: 'hq/lib/schema.mjs' },
    { what: 'core-ness ordering: kernel > service-b > leaf-experimental', where: 'hq/lib/graph.mjs impact' },
  ],
  run: async () => {
    const findings = [];
    const db = openMemoryDb();
    try {
      seedGraph(db);
      const core = impact(db, { target: 'kernel.mjs', project: 'repos-hq', depth: 1, limit: 50 });
      if (core.root?.path !== 'hq/lib/kernel.mjs') throw new Error(`root unresolved: ${JSON.stringify(core.root)}`);
      if (core.nodes.length !== 4) throw new Error(`kernel reverse reach wrong: ${core.nodes.length}`);
      findings.push(finding('hq/lib/kernel.mjs is core: three modules depend on it (widest reverse reach)', 'hq/lib/graph.mjs impact'));

      const mid = impact(db, { target: 'service-b.mjs', project: 'repos-hq', depth: 1, limit: 50 });
      if (mid.nodes.length !== 2) throw new Error(`service-b reverse reach wrong: ${mid.nodes.length}`);
      findings.push(finding('hq/lib/service-b.mjs is mid-core: one module depends on it, and it carries its own dependents', 'hq/lib/graph.mjs impact'));

      const orphans = staticOrphans(db, { project: 'repos-hq' });
      const orphanPaths = orphans.map((o) => o.path);
      if (!orphanPaths.includes('hq/lib/leaf-experimental.mjs')) {
        throw new Error(`leaf not reported as orphan: ${orphanPaths.join(', ')}`);
      }
      if (orphanPaths.includes('hq/lib/kernel.mjs')) throw new Error('kernel wrongly reported orphan');
      findings.push(finding('hq/lib/leaf-experimental.mjs is peripheral: no inbound static import edge (static orphan)', 'hq/lib/graph.mjs staticOrphans'));
      findings.push(finding('the reverse-dep walk resolves through resolved_file_id edges of the real imports schema', 'hq/lib/schema.mjs'));
      findings.push(finding('core-ness ordering: kernel > service-b > leaf-experimental', 'hq/lib/graph.mjs impact'));
    } finally {
```

_First 80 of 86 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
