# File: hq/aii/fixtures/HQ-010-removal-blast-radius.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-010-removal-blast-radius.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7314 B |
| Lines | 103 |
| Hash | 8a02637aa882 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 27 | no | const ROOT = join(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| REPOS | const | 29 | no | const REPOS = [ |
| findings | const | 52 | no | const findings = []; |
| impact | const | 54 | no | const impact = runHq([&#39;impact&#39;, &#39;hq/lib/graph.mjs&#39;], { cwd: ROOT }); |
| lines | const | 56 | no | const lines = impact.stdout.split(&#39;\\n&#39;).map((l) =&gt; l.trim()).filter(Boolean); |
| header | const | 57 | no | const header = lines[0] ?? &#39;&#39;; |
| dependents | const | 62 | no | const dependents = lines.slice(1) |
| byPath | const | 68 | no | const byPath = new Map(dependents.map((d) =&gt; [d.path, d.depth])); |
| reverse | const | 76 | no | const reverse = runHq([&#39;deps&#39;, &#39;hq/lib/graph.mjs&#39;, &#39;--reverse&#39;], { cwd: ROOT }); |
| rLines | const | 78 | no | const rLines = reverse.stdout.split(&#39;\\n&#39;).map((l) =&gt; l.trim()).filter(Boolean); |
| rHeader | const | 79 | no | const rHeader = rLines[0] ?? &#39;&#39;; |
| edges | const | 84 | no | const edges = rLines.slice(1).filter((l) =&gt; l.startsWith(&#39;repos-hq/&#39;) &amp;&amp; l.includes(&#39; via &#39;)); |
| state | const | 92 | no | const state = gitState({ cwd: repo.path }); |
| dirty | const | 94 | no | const dirty = Array.isArray(state.dirty) ? state.dirty.length : 0; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 22 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/git-context.mjs | import | 23 | [hq/lib/git-context.mjs](../../lib/git-context.mjs.md) |
| node:path | import | 24 | external |
| node:url | import | 25 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-010-removal-blast-radius.mjs
// AII build lane "p1-existing-surface-fixtures". Scenario HQ-010 (group A):
// "What would break if we removed this repository from the workspace?"
//
// Ground truth LOCKED 2026-11-11 from live output on branch main:
//   bun hq/bin/hq.mjs impact hq/lib/graph.mjs
//     -> "Impact of repos-hq/hq/lib/graph.mjs: 5 dependent(s)" then one
//        "  repos-hq/<path>  depth <n>" line per transitive reverse dependent:
//          hq/lib/graph.mjs depth 0, hq/bin/hq.mjs depth 1, hq/lib/mcp.mjs
//          depth 1, hq/test/graph.test.mjs depth 1, hq/test/mcp.test.mjs depth 2.
//   bun hq/bin/hq.mjs deps hq/lib/graph.mjs --reverse
//     -> "reverse deps for repos-hq/hq/lib/graph.mjs" then the same dependents
//        each annotated with the import specifier that reaches the module.
//   hq/lib/git-context.mjs gitState() reports the uncommitted working tree of
//   each checkout — the unintegrated local work that a removal would destroy.
//
// The blast radius of a repository is: the modules that depend on it (through
// the transitive reverse-import graph) plus the uncommitted work in its tree.
// The dependent COUNT drifts as lanes add files, so it is re-derived live; the
// SHAPE (transitive depths, per-module dependents, per-repo dirty state) is
// pinned.
import { defineFixture, finding, runHq } from './harness.mjs';
import { gitState } from '../../lib/git-context.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const REPOS = [
  { name: 'repos-hq', path: ROOT },
  { name: 'vivim-web-harness', path: join(ROOT, '..', 'vivim-web-harness') },
  { name: 'vivim-ui', path: join(ROOT, '..', 'vivim-ui') },
  { name: 'openmausbot', path: join(ROOT, '..', 'vivim-labs', 'OpenMausBot') },
];

export default defineFixture({
  id: 'HQ-010',
  provenance: 'Locked 2026-11-11 on branch main from live output: bun hq/bin/hq.mjs impact hq/lib/graph.mjs printed "Impact of repos-hq/hq/lib/graph.mjs: 5 dependent(s)" with hq/lib/graph.mjs depth 0, hq/bin/hq.mjs depth 1, hq/lib/mcp.mjs depth 1, hq/test/graph.test.mjs depth 1 and hq/test/mcp.test.mjs depth 2; bun hq/bin/hq.mjs deps hq/lib/graph.mjs --reverse printed the same dependents as "reverse deps for repos-hq/hq/lib/graph.mjs", each annotated with the import specifier that reaches the module (../lib/graph.mjs, ./graph.mjs, ../lib/mcp.mjs). gitState() (hq/lib/git-context.mjs:121) reported the uncommitted working tree of each of the 4 registered checkouts — repos-hq dirty, vivim-web-harness dirty, vivim-ui and openmausbot clean. The dependent COUNT drifts as concurrent lanes add files, so the expectations pin the impact shape, the per-depth dependent structure, the reverse-edge specifier shape and the per-repository dirty verdict, while run() re-derives every number and path live.',
  expected: [
    { what: /^Impact of repos-hq\/hq\/lib\/graph\.mjs: \d+ dependent\(s\)$/, where: 'hq/bin/hq.mjs impact hq/lib/graph.mjs' },
    { what: /^\d+ dependents reported with a transitive depth each$/, where: 'hq/bin/hq.mjs impact hq/lib/graph.mjs' },
    { what: 'hq/bin/hq.mjs depends on hq/lib/graph.mjs at depth 1', where: 'hq/bin/hq.mjs impact hq/lib/graph.mjs' },
    { what: 'hq/lib/mcp.mjs depends on hq/lib/graph.mjs at depth 1', where: 'hq/bin/hq.mjs impact hq/lib/graph.mjs' },
    { what: 'hq/test/mcp.test.mjs depends on hq/lib/graph.mjs at depth 2', where: 'hq/bin/hq.mjs impact hq/lib/graph.mjs' },
    { what: 'reverse deps for repos-hq/hq/lib/graph.mjs', where: 'hq/bin/hq.mjs deps hq/lib/graph.mjs --reverse' },
    { what: /^every reverse edge names the import specifier that reaches hq\/lib\/graph\.mjs$/, where: 'hq/bin/hq.mjs deps hq/lib/graph.mjs --reverse' },
    { what: 'repos-hq carries uncommitted work that removing the repository would destroy', where: 'hq/lib/git-context.mjs gitState' },
    { what: 'vivim-ui carries no uncommitted work', where: 'hq/lib/git-context.mjs gitState' },
    { what: 'openmausbot carries no uncommitted work', where: 'hq/lib/git-context.mjs gitState' },
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
    const dependents = lines.slice(1)
      .map((l) => l.match(/^repos-hq\/(.+?)\s+depth (\d+)$/))
      .filter(Boolean)
      .map((m) => ({ path: m[1], depth: Number(m[2]) }));
    if (!dependents.length) throw new Error('hq impact printed no dependent lines');
    findings.push(finding(`${dependents.length} dependents reported with a transitive depth each`, 'hq/bin/hq.mjs impact hq/lib/graph.mjs'));
    const byPath = new Map(dependents.map((d) => [d.path, d.depth]));
    for (const [path, depth] of [['hq/bin/hq.mjs', 1], ['hq/lib/mcp.mjs', 1], ['hq/test/mcp.test.mjs', 2]]) {
      if (byPath.get(path) !== depth) {
        throw new Error(`expected ${path} at depth ${depth}, got ${byPath.get(path)}`);
      }
      findings.push(finding(`${path} depends on hq/lib/graph.mjs at depth ${depth}`, 'hq/bin/hq.mjs impact hq/lib/graph.mjs'));
    }

    const reverse = runHq(['deps', 'hq/lib/graph.mjs', '--reverse'], { cwd: ROOT });
    if (reverse.exit !== 0) throw new Error(`hq deps --reverse failed: exit=${reverse.exit} stderr=${reverse.stderr}`);
    const rLines = reverse.stdout.split('\n').map((l) => l.trim()).filter(Boolean);
    const rHeader = rLines[0] ?? '';
    if (rHeader !== 'reverse deps for repos-hq/hq/lib/graph.mjs') {
```

_First 80 of 104 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
