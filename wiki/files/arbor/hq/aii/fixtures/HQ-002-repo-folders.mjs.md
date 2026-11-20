# File: hq/aii/fixtures/HQ-002-repo-folders.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-002-repo-folders.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4843 B |
| Lines | 72 |
| Hash | ed05e6b299f5 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| PROJECTS | const | 21 | no | const PROJECTS = [ |
| findings | const | 40 | no | const findings = []; |
| list | const | 43 | no | const list = runHq([&#39;project&#39;, &#39;list&#39;]); |
| rows | const | 45 | no | const rows = list.stdout.split(&#39;\\n&#39;).filter(Boolean).map((l) =&gt; l.split(&#39;\\t&#39;)); |
| row | const | 47 | no | const row = rows.find((r) =&gt; r[0] === p.name); |
| pj | const | 54 | no | const pj = JSON.parse(readFileSync(&#39;projects.json&#39;, &#39;utf8&#39;)); |
| stored | const | 55 | no | const stored = new Map(pj.projects.map((p) =&gt; [p.name, p.path])); |
| expectedStored | const | 56 | no | const expectedStored = { |
| names | const | 66 | no | const names = pj.projects.map((p) =&gt; p.name); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 18 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| node:fs | import | 19 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-002-repo-folders.mjs — AII benchmark fixture (PRD HQ-PRD-AII-001).
// Scenario HQ-002 (group A): "Which local folders correspond to which GitHub repositories?"
// Ground truth locked from live outputs 2026-11-11:
//   bun hq/bin/hq.mjs project list maps each registered project name to its absolute path:
//     repos-hq          -> C:\0-BlackBoxProject-0\repos_hq
//     vivim-ui          -> C:\0-BlackBoxProject-0\vivim-ui
//     vivim-web-harness -> C:\0-BlackBoxProject-0\vivim-web-harness
//   projects.json (read at repo root) stores each project's `path` field:
//     repos-hq          -> '.'
//     vivim-ui          -> 'C:\0-BlackBoxProject-0\vivim-ui'
//     vivim-web-harness -> 'C:\0-BlackBoxProject-0\vivim-web-harness'
//   So the local folder <-> GitHub repository correspondence is 3 registered projects, with
//   repos-hq stored RELATIVE to the HQ root ('.') and the other two absolute.
// OWNER RULING 2026-11-11: platform source = repos-hq + vivim-web-harness + vivim-ui ONLY;
// vivim-labs (and its nested openmausbot clone) is never an HQ index source. The earlier
// 4-project ground truth was removed via `hq project remove openmausbot` (cascade verified,
// clone preserved on disk).
import { defineFixture, finding, runHq } from './harness.mjs';
import { readFileSync } from 'node:fs';

const PROJECTS = [
  { name: 'repos-hq', path: 'C:\\0-BlackBoxProject-0\\repos_hq' },
  { name: 'vivim-ui', path: 'C:\\0-BlackBoxProject-0\\vivim-ui' },
  { name: 'vivim-web-harness', path: 'C:\\0-BlackBoxProject-0\\vivim-web-harness' },
];

export default defineFixture({
  id: 'HQ-002',
  provenance: 'Locked at authoring time 2026-11-11 from live command output: bun hq/bin/hq.mjs project list (name -> absolute path mapping) and cat projects.json (the path field per project: repos-hq ., vivim-ui C:\\0-BlackBoxProject-0\\vivim-ui, vivim-web-harness C:\\0-BlackBoxProject-0\\vivim-web-harness). REFRESH 2026-11-11: the owner ruled vivim-labs is never an HQ index source, so the foreign openmausbot registration was removed via `hq project remove openmausbot` (cascade verified, clone preserved) — ground truth moved from 4 projects to 3. Re-derived at run time by re-running project list and re-reading projects.json.',
  expected: [
    { what: 'repos-hq maps to C:\\0-BlackBoxProject-0\\repos_hq', where: 'hq/bin/hq.mjs project list' },
    { what: 'vivim-ui maps to C:\\0-BlackBoxProject-0\\vivim-ui', where: 'hq/bin/hq.mjs project list' },
    { what: 'vivim-web-harness maps to C:\\0-BlackBoxProject-0\\vivim-web-harness', where: 'hq/bin/hq.mjs project list' },
    { what: /^projects\.json path field repos-hq="\."$/, where: 'projects.json' },
    { what: /^projects\.json path field vivim-ui="C:\\\\0-BlackBoxProject-0\\\\vivim-ui"$/, where: 'projects.json' },
    { what: /^projects\.json path field vivim-web-harness="C:\\\\0-BlackBoxProject-0\\\\vivim-web-harness"$/, where: 'projects.json' },
    { what: 'projects.json registers 3 projects: repos-hq, vivim-ui, vivim-web-harness', where: 'projects.json' },
  ],
  run: async () => {
    const findings = [];

    // hq project list: name -> absolute path.
    const list = runHq(['project', 'list']);
    if (list.exit !== 0) throw new Error(`project list failed: exit=${list.exit} stderr=${list.stderr}`);
    const rows = list.stdout.split('\n').filter(Boolean).map((l) => l.split('\t'));
    for (const p of PROJECTS) {
      const row = rows.find((r) => r[0] === p.name);
      if (!row) throw new Error(`missing project ${p.name} in project list output`);
      if (row[1] !== p.path) throw new Error(`${p.name} path drift: ${row[1]}`);
      findings.push(finding(`${p.name} maps to ${row[1]}`, 'hq/bin/hq.mjs project list'));
    }

    // projects.json: the stored path field per project.
    const pj = JSON.parse(readFileSync('projects.json', 'utf8'));
    const stored = new Map(pj.projects.map((p) => [p.name, p.path]));
    const expectedStored = {
      'repos-hq': '.',
      'vivim-ui': 'C:\\0-BlackBoxProject-0\\vivim-ui',
      'vivim-web-harness': 'C:\\0-BlackBoxProject-0\\vivim-web-harness',
    };
    for (const [name, path] of Object.entries(expectedStored)) {
      if (stored.get(name) !== path) throw new Error(`projects.json path drift for ${name}: ${JSON.stringify(stored.get(name))}`);
      findings.push(finding(`projects.json path field ${name}=${JSON.stringify(path)}`, 'projects.json'));
    }

    const names = pj.projects.map((p) => p.name);
    if (names.join(', ') !== 'repos-hq, vivim-ui, vivim-web-harness') throw new Error(`unexpected project names: ${names.join(', ')}`);
    findings.push(finding(`projects.json registers ${names.length} projects: ${names.join(', ')}`, 'projects.json'));

    return findings;
  },
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
