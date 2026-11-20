# File: hq/aii/fixtures/HQ-001-repositories.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-001-repositories.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5171 B |
| Lines | 64 |
| Hash | f09ced08958d |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| PROJECTS | const | 19 | no | const PROJECTS = [ |
| findings | const | 37 | no | const findings = []; |
| list | const | 39 | no | const list = runHq([&#39;project&#39;, &#39;list&#39;]); |
| rows | const | 41 | no | const rows = list.stdout.split(&#39;\\n&#39;).filter(Boolean).map((l) =&gt; l.split(&#39;\\t&#39;)); |
| row | const | 45 | no | const row = rows.find((r) =&gt; r[0] === p.name); |
| files | const | 48 | no | const files = /^(\\d+) files$/.exec(row[3] ?? &#39;&#39;); |
| symbols | const | 49 | no | const symbols = /^(\\d+) symbols$/.exec(row[4] ?? &#39;&#39;); |
| status | const | 54 | no | const status = runHq([&#39;status&#39;, &#39;--json&#39;]); |
| sj | const | 56 | no | const sj = JSON.parse(status.stdout); |
| t | const | 59 | no | const t = sj.totals ?? {}; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 17 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-001-repositories.mjs — AII benchmark fixture (PRD HQ-PRD-AII-001).
// Scenario HQ-001 (group A): "What repositories make up this project?"
// Ground truth locked from live outputs 2026-11-11 (session state: 3 indexed projects):
//   bun hq/bin/hq.mjs project list -> 3 registered projects, one line each:
//     repos-hq              C:\0-BlackBoxProject-0\repos_hq                  main  files/symbols re-derived live
//     vivim-ui              C:\0-BlackBoxProject-0\vivim-ui                  main  ditto
//     vivim-web-harness     C:\0-BlackBoxProject-0\vivim-web-harness        main  ditto
//   bun hq/bin/hq.mjs status --json -> 3 indexed projects.
// OWNER RULING 2026-11-11: platform source = repos-hq + vivim-web-harness + vivim-ui ONLY;
// vivim-labs (and its nested openmausbot clone) is never an HQ index source. The earlier
// 4-project ground truth (openmausbot registered 2026-11-10T23:28 by another session) was
// removed via `hq project remove openmausbot` — cascade verified (0 orphan rows), clone
// preserved on disk.
// The per-project file/symbol counts drift as concurrent lanes reindex the workspace, so they are
// re-derived live and pinned by shape; the project NAMES, PATHS and the "3 projects" fact are the
// stable ground truth.
import { defineFixture, finding, runHq } from './harness.mjs';

const PROJECTS = [
  { name: 'repos-hq', path: 'C:\\0-BlackBoxProject-0\\repos_hq' },
  { name: 'vivim-ui', path: 'C:\\0-BlackBoxProject-0\\vivim-ui' },
  { name: 'vivim-web-harness', path: 'C:\\0-BlackBoxProject-0\\vivim-web-harness' },
];

export default defineFixture({
  id: 'HQ-001',
  provenance: 'Locked at authoring time 2026-11-11 from live command output: bun hq/bin/hq.mjs project list (3 registered projects repos-hq, vivim-ui, vivim-web-harness with their absolute paths) and bun hq/bin/hq.mjs status --json (3 indexed projects). REFRESH 2026-11-11: the owner ruled vivim-labs is never an HQ index source, so the foreign openmausbot registration (another session, 2026-11-10T23:28) was removed via `hq project remove openmausbot` (cascade verified: 0 orphan file rows; clone preserved on disk) — the ground truth moved from 4 projects to 3 and the expected set now excludes openmausbot by ruling, not by drift. Re-derived at run time by re-running both commands; file/symbol/totals counts are re-derived live because concurrent lanes reindex the shared workspace.',
  expected: [
    { what: 'project list prints 3 registered projects: repos-hq, vivim-ui, vivim-web-harness', where: 'hq/bin/hq.mjs project list' },
    { what: /^repos-hq path C:\\0-BlackBoxProject-0\\repos_hq branch main files \d+ symbols \d+$/, where: 'hq/bin/hq.mjs project list' },
    { what: /^vivim-ui path C:\\0-BlackBoxProject-0\\vivim-ui branch main files \d+ symbols \d+$/, where: 'hq/bin/hq.mjs project list' },
    { what: /^vivim-web-harness path C:\\0-BlackBoxProject-0\\vivim-web-harness branch main files \d+ symbols \d+$/, where: 'hq/bin/hq.mjs project list' },
    { what: 'status --json reports 3 indexed projects', where: 'hq/bin/hq.mjs status --json' },
    { what: /^status --json totals projects \d+ files \d+ symbols \d+ imports \d+$/, where: 'hq/bin/hq.mjs status --json' },
  ],
  run: async () => {
    const findings = [];

    const list = runHq(['project', 'list']);
    if (list.exit !== 0) throw new Error(`project list failed: exit=${list.exit} stderr=${list.stderr}`);
    const rows = list.stdout.split('\n').filter(Boolean).map((l) => l.split('\t'));
    if (rows.length !== 3) throw new Error(`expected 3 project rows, got ${rows.length}`);
    findings.push(finding(`project list prints ${rows.length} registered projects: ${rows.map((r) => r[0]).join(', ')}`, 'hq/bin/hq.mjs project list'));
    for (const p of PROJECTS) {
      const row = rows.find((r) => r[0] === p.name);
      if (!row) throw new Error(`missing project ${p.name} in project list output`);
      if (row[1] !== p.path) throw new Error(`${p.name} path drift: ${row[1]}`);
      const files = /^(\d+) files$/.exec(row[3] ?? '');
      const symbols = /^(\d+) symbols$/.exec(row[4] ?? '');
      if (!files || !symbols) throw new Error(`unexpected files/symbols cells for ${p.name}: ${JSON.stringify(row.slice(3))}`);
      findings.push(finding(`${p.name} path ${row[1]} branch ${row[2]} files ${files[1]} symbols ${symbols[1]}`, 'hq/bin/hq.mjs project list'));
    }

    const status = runHq(['status', '--json']);
    if (status.exit !== 0) throw new Error(`status --json failed: exit=${status.exit} stderr=${status.stderr}`);
    const sj = JSON.parse(status.stdout);
    if (!Array.isArray(sj.projects) || sj.projects.length !== 3) throw new Error(`status --json reports ${sj.projects?.length} projects`);
    findings.push(finding(`status --json reports ${sj.projects.length} indexed projects`, 'hq/bin/hq.mjs status --json'));
    const t = sj.totals ?? {};
    findings.push(finding(`status --json totals projects ${t.projects} files ${t.files} symbols ${t.symbols} imports ${t.imports}`, 'hq/bin/hq.mjs status --json'));

    return findings;
  },
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
