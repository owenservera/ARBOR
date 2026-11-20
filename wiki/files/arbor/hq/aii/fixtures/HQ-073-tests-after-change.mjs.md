# File: hq/aii/fixtures/HQ-073-tests-after-change.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-073-tests-after-change.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7271 B |
| Lines | 100 |
| Hash | 23c136330ab3 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 27 | no | const ROOT = join(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| findings | const | 41 | no | const findings = []; |
| impactGraph | const | 43 | no | const impactGraph = runHq([&#39;impact&#39;, &#39;hq/lib/graph.mjs&#39;], { cwd: ROOT }); |
| gLines | const | 45 | no | const gLines = impactGraph.stdout.split(&#39;\\n&#39;).map((l) =&gt; l.trim()).filter(Boolean); |
| gDeps | const | 49 | no | const gDeps = new Map(); |
| m | const | 51 | no | const m = line.match(/^repos-hq\\/(.+?)\\s+depth (\\d+)$/); |
| graphSuites | const | 62 | no | const graphSuites = [...gDeps.keys()].filter((p) =&gt; p.startsWith(&#39;hq/test/&#39;)); |
| impactMcp | const | 68 | no | const impactMcp = runHq([&#39;impact&#39;, &#39;hq/lib/mcp.mjs&#39;], { cwd: ROOT }); |
| mLines | const | 70 | no | const mLines = impactMcp.stdout.split(&#39;\\n&#39;).map((l) =&gt; l.trim()).filter(Boolean); |
| mDeps | const | 71 | no | const mDeps = new Map(); |
| m | const | 73 | no | const m = line.match(/^repos-hq\\/(.+?)\\s+depth (\\d+)$/); |
| file | const | 81 | no | const file = runHq([&#39;file&#39;, &#39;hq/lib/graph.mjs&#39;], { cwd: ROOT }); |
| fLines | const | 83 | no | const fLines = file.stdout.split(&#39;\\n&#39;).map((l) =&gt; l.trim()); |
| depIdx | const | 84 | no | const depIdx = fLines.indexOf(&#39;Dependents:&#39;); |
| dependents | const | 86 | no | const dependents = []; |
| m | const | 88 | no | const m = fLines[i].match(/^repos-hq\\/(.+)$/); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 23 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| node:path | import | 24 | external |
| node:url | import | 25 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-073-tests-after-change.mjs
// AII build lane "p1-existing-surface-fixtures". Scenario HQ-073 (group I):
// "Which tests should run after this specific change?"
//
// Ground truth LOCKED 2026-11-11 from live output on branch main:
//   bun hq/bin/hq.mjs impact hq/lib/graph.mjs
//     -> 5 dependents including the TEST files hq/test/graph.test.mjs
//        (depth 1) and hq/test/mcp.test.mjs (depth 2): after changing
//        hq/lib/graph.mjs, exactly those two suites exercise the change.
//   bun hq/bin/hq.mjs file hq/lib/graph.mjs
//     -> prints a "Dependents:" section (hq/bin/hq.mjs cmdFile, line 659:
//        SELECT f.path ... WHERE i.resolved_file_id = ?) listing the direct
//        consumers of the changed module — the source of the "which tests"
//        answer. At lock time the dependents included hq/bin/hq.mjs,
//        hq/lib/mcp.mjs and hq/test/graph.test.mjs.
//   bun hq/bin/hq.mjs impact hq/lib/mcp.mjs
//     -> "Impact of repos-hq/hq/lib/mcp.mjs: 3 dependent(s)": itself, the CLI
//        (depth 1), and hq/test/mcp.test.mjs (depth 1).
//
// The test-suite dependents of the two touched modules are the answer; the
// fixture-consumer entries drift as lanes add fixtures, so the PRODUCTION and
// TEST consumers are pinned and the fixture entries re-derived live.
import { defineFixture, finding, runHq } from './harness.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export default defineFixture({
  id: 'HQ-073',
  provenance: 'Locked 2026-11-11 on branch main from live output: bun hq/bin/hq.mjs impact hq/lib/graph.mjs listed the TEST dependents hq/test/graph.test.mjs (depth 1) and hq/test/mcp.test.mjs (depth 2) among its 5 dependents; bun hq/bin/hq.mjs file hq/lib/graph.mjs printed a "Dependents:" section (cmdFile at hq/bin/hq.mjs:659 — SELECT f.path AS path, p.name AS project FROM imports i JOIN files f ON f.id = i.file_id WHERE i.resolved_file_id = ?) including hq/bin/hq.mjs, hq/lib/mcp.mjs and hq/test/graph.test.mjs; bun hq/bin/hq.mjs impact hq/lib/mcp.mjs printed "Impact of repos-hq/hq/lib/mcp.mjs: 3 dependent(s)" — itself, hq/bin/hq.mjs (depth 1) and hq/test/mcp.test.mjs (depth 1). After changing hq/lib/graph.mjs the suites to run are hq/test/graph.test.mjs and hq/test/mcp.test.mjs; after changing hq/lib/mcp.mjs the suite to run is hq/test/mcp.test.mjs. The TEST-file dependents of both modules are pinned exactly; fixture entries in the Dependents listing drift as lanes add fixtures and are re-derived live.',
  expected: [
    { what: 'changing hq/lib/graph.mjs requires running hq/test/graph.test.mjs (depth 1)', where: 'hq/bin/hq.mjs impact hq/lib/graph.mjs' },
    { what: 'changing hq/lib/graph.mjs requires running hq/test/mcp.test.mjs (depth 2, through hq/lib/mcp.mjs)', where: 'hq/bin/hq.mjs impact hq/lib/graph.mjs' },
    { what: 'changing hq/lib/mcp.mjs requires running hq/test/mcp.test.mjs (depth 1)', where: 'hq/bin/hq.mjs impact hq/lib/mcp.mjs' },
    { what: 'hq file hq/lib/graph.mjs lists a Dependents section of direct consumers', where: 'hq/bin/hq.mjs file hq/lib/graph.mjs' },
    { what: /^the Dependents section of hq\/lib\/graph\.mjs includes hq\/bin\/hq\.mjs$/, where: 'hq/bin/hq.mjs file hq/lib/graph.mjs' },
    { what: /^\d+ test suites exercise changes to hq\/lib\/graph\.mjs$/, where: 'hq/bin/hq.mjs impact hq/lib/graph.mjs' },
  ],
  run: async () => {
    const findings = [];

    const impactGraph = runHq(['impact', 'hq/lib/graph.mjs'], { cwd: ROOT });
    if (impactGraph.exit !== 0) throw new Error(`hq impact failed: exit=${impactGraph.exit} stderr=${impactGraph.stderr}`);
    const gLines = impactGraph.stdout.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!/^Impact of repos-hq\/hq\/lib\/graph\.mjs: \d+ dependent\(s\)$/.test(gLines[0] ?? '')) {
      throw new Error(`unexpected impact header: ${JSON.stringify(gLines[0])}`);
    }
    const gDeps = new Map();
    for (const line of gLines.slice(1)) {
      const m = line.match(/^repos-hq\/(.+?)\s+depth (\d+)$/);
      if (m) gDeps.set(m[1], Number(m[2]));
    }
    if (gDeps.get('hq/test/graph.test.mjs') !== 1) {
      throw new Error(`expected hq/test/graph.test.mjs at depth 1, got ${gDeps.get('hq/test/graph.test.mjs')}`);
    }
    findings.push(finding('changing hq/lib/graph.mjs requires running hq/test/graph.test.mjs (depth 1)', 'hq/bin/hq.mjs impact hq/lib/graph.mjs'));
    if (gDeps.get('hq/test/mcp.test.mjs') !== 2) {
      throw new Error(`expected hq/test/mcp.test.mjs at depth 2, got ${gDeps.get('hq/test/mcp.test.mjs')}`);
    }
    findings.push(finding('changing hq/lib/graph.mjs requires running hq/test/mcp.test.mjs (depth 2, through hq/lib/mcp.mjs)', 'hq/bin/hq.mjs impact hq/lib/graph.mjs'));
    const graphSuites = [...gDeps.keys()].filter((p) => p.startsWith('hq/test/'));
    if (graphSuites.join(', ') !== 'hq/test/graph.test.mjs, hq/test/mcp.test.mjs') {
      throw new Error(`unexpected test-suite dependents: ${graphSuites.join(', ')}`);
    }
    findings.push(finding(`${graphSuites.length} test suites exercise changes to hq/lib/graph.mjs`, 'hq/bin/hq.mjs impact hq/lib/graph.mjs'));

    const impactMcp = runHq(['impact', 'hq/lib/mcp.mjs'], { cwd: ROOT });
    if (impactMcp.exit !== 0) throw new Error(`hq impact mcp failed: exit=${impactMcp.exit} stderr=${impactMcp.stderr}`);
    const mLines = impactMcp.stdout.split('\n').map((l) => l.trim()).filter(Boolean);
    const mDeps = new Map();
    for (const line of mLines.slice(1)) {
      const m = line.match(/^repos-hq\/(.+?)\s+depth (\d+)$/);
      if (m) mDeps.set(m[1], Number(m[2]));
    }
    if (mDeps.get('hq/test/mcp.test.mjs') !== 1) {
      throw new Error(`expected hq/test/mcp.test.mjs at depth 1 for hq/lib/mcp.mjs, got ${mDeps.get('hq/test/mcp.test.mjs')}`);
    }
    findings.push(finding('changing hq/lib/mcp.mjs requires running hq/test/mcp.test.mjs (depth 1)', 'hq/bin/hq.mjs impact hq/lib/mcp.mjs'));
```

_First 80 of 101 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
