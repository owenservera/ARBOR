# File: hq/aii/fixtures/HQ-085-critical-path-ownerless.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-085-critical-path-ownerless.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6309 B |
| Lines | 90 |
| Hash | a3bbf5759fe5 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 27 | no | const ROOT = join(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| findings | const | 41 | no | const findings = []; |
| cli | const | 43 | no | const cli = runHq([&#39;pm&#39;, &#39;--json&#39;], { cwd: ROOT }); |
| emitted | const | 45 | no | const emitted = JSON.parse(cli.stdout); |
| coverage | const | 46 | no | const coverage = emitted.model?.coverage; |
| initiativesFile | const | 55 | no | const initiativesFile = join(ROOT, &#39;docs&#39;, &#39;integration&#39;, &#39;STRATEGIC-INITIATIVES.md&#39;); |
| tasksFile | const | 56 | no | const tasksFile = &#39;C:/VIVIM/channel/tasks/active-tasks.md&#39;; |
| model | const | 57 | no | const model = buildPortfolio({ qeueDir: join(ROOT, &#39;qeue&#39;), initiativesText: existsSync(initiativesFile) ? readFileSync(initiativesFile, &#39;utf8&#39;) : null, tasksText: existsSync(tasksFile) ? readFileSyn… |
| qeueDir | const | 68 | no | const qeueDir = { lanes: [{ lane: &#39;L&#39;, records: [ |
| tasksText | const | 72 | no | const tasksText = [ |
| seeded | const | 78 | no | const seeded = buildPortfolio({ qeueDir, tasksText, now: Date.parse(&#39;2026-11-11T00:00:00.000Z&#39;) }); |
| owned | const | 79 | no | const owned = seeded.items?.find((i) =&gt; i.id === &#39;SEED-001&#39;); |
| ownerless | const | 80 | no | const ownerless = seeded.items?.find((i) =&gt; i.id === &#39;SEED-002&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 20 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/pmo.mjs | import | 21 | [hq/lib/pmo.mjs](../../lib/pmo.mjs.md) |
| node:fs | import | 22 | external |
| node:fs | import | 23 | external |
| node:path | import | 24 | external |
| node:url | import | 25 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-085-critical-path-ownerless.mjs
// AII build lane "p1-existing-surface-fixtures". Scenario HQ-085 (group J):
// "Which critical-path tasks have no active owner?"
//
// Ground truth LOCKED 2026-11-11 from live output on branch main:
//   bun hq/bin/hq.mjs pm --json
//     -> model.coverage = { tracked: 25, untracked: 575, withEvidence: 25,
//        withoutOwner: 25 } — every one of the 25 tracked items is cited by a
//        queue row that names NO seat or owner. buildPortfolio()
//        (hq/lib/pmo.mjs:530) computes coverage (hq/lib/pmo.mjs:646):
//        withoutOwner counts tracked items whose citing queue row names no
//        seat/owner; scanCitations() (hq/lib/pmo.mjs:371-416) names an owner
//        from the row's seat/owner column when it is not empty/'unbound'/'—'.
//   Seeded proof: a scored-table row citing SEED-001 with seat "chatgpt"
//   marks that item owned; a row with "unbound" marks it ownerless.
//
// The live answer — ALL tracked items lack a named owner (25 of 25) — is the
// pinned structural fact; the counts drift as lanes re-file the queue and are
// re-derived live.
import { defineFixture, finding, runHq } from './harness.mjs';
import { buildPortfolio } from '../../lib/pmo.mjs';
import { readFileSync } from 'node:fs';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export default defineFixture({
  id: 'HQ-085',
  provenance: 'Locked 2026-11-11 on branch main from live output: bun hq/bin/hq.mjs pm --json printed model.coverage = { tracked: 25, untracked: 575, withEvidence: 25, withoutOwner: 25 } — every tracked item is cited by a queue row that names no seat or owner. buildPortfolio() (hq/lib/pmo.mjs:530) computes coverage at hq/lib/pmo.mjs:646: withoutOwner counts tracked items whose citing queue row names no seat or owner, and scanCitations() (hq/lib/pmo.mjs:371-416) names an owner only when the row\'s seat/owner column is non-empty and not "unbound"/"—"/"-". Seeded proof (no workspace writes): a scored-table row citing SEED-001 with seat "chatgpt" marks that item owned (namesOwner=true), while a row with "unbound" leaves namesOwner=false and the item counts into withoutOwner. The structural fact — tracked items exist and ALL of them lack a named owner in the live queue — is pinned; the concrete counts drift as lanes re-file the queue and are re-derived live.',
  expected: [
    { what: 'every tracked item in the live portfolio lacks a named owner (withoutOwner equals tracked)', where: 'hq/lib/pmo.mjs buildPortfolio' },
    { what: /^\d+ tracked items and \d+ untracked items in the live portfolio$/, where: 'hq/lib/pmo.mjs buildPortfolio' },
    { what: /^\d+ tracked items carry evidence$/, where: 'hq/lib/pmo.mjs buildPortfolio' },
    { what: /^\d+ tracked items have no active owner$/, where: 'hq/lib/pmo.mjs buildPortfolio' },
    { what: 'a queue row with a seat names the item\'s owner; an "unbound" row does not', where: 'hq/lib/pmo.mjs scanCitations' },
    { what: 'the pm CLI reports the ownerless coverage', where: 'hq/bin/hq.mjs pm --json' },
  ],
  run: async () => {
    const findings = [];

    const cli = runHq(['pm', '--json'], { cwd: ROOT });
    if (cli.exit !== 0) throw new Error(`hq pm --json failed: exit=${cli.exit} stderr=${cli.stderr}`);
    const emitted = JSON.parse(cli.stdout);
    const coverage = emitted.model?.coverage;
    if (!coverage) throw new Error('pm --json has no coverage');
    if (!coverage.tracked) throw new Error('pm --json reports 0 tracked items');
    if (coverage.withoutOwner !== coverage.tracked) {
      throw new Error(`expected withoutOwner === tracked, got ${JSON.stringify(coverage)}`);
    }
    findings.push(finding('every tracked item in the live portfolio lacks a named owner (withoutOwner equals tracked)', 'hq/lib/pmo.mjs buildPortfolio'));
    findings.push(finding('the pm CLI reports the ownerless coverage', 'hq/bin/hq.mjs pm --json'));

    const initiativesFile = join(ROOT, 'docs', 'integration', 'STRATEGIC-INITIATIVES.md');
    const tasksFile = 'C:/VIVIM/channel/tasks/active-tasks.md';
    const model = buildPortfolio({
      qeueDir: join(ROOT, 'qeue'),
      initiativesText: existsSync(initiativesFile) ? readFileSync(initiativesFile, 'utf8') : null,
      tasksText: existsSync(tasksFile) ? readFileSync(tasksFile, 'utf8') : null,
      now: Date.now(),
    });
    findings.push(finding(`${model.coverage.tracked} tracked items and ${model.coverage.untracked} untracked items in the live portfolio`, 'hq/lib/pmo.mjs buildPortfolio'));
    findings.push(finding(`${model.coverage.withEvidence} tracked items carry evidence`, 'hq/lib/pmo.mjs buildPortfolio'));
    findings.push(finding(`${model.coverage.withoutOwner} tracked items have no active owner`, 'hq/lib/pmo.mjs buildPortfolio'));

    // Seeded proof of owner resolution (no workspace writes).
    const qeueDir = { lanes: [{ lane: 'L', records: [
      { id: 'SEED-001', task: 'owned work', status: 'todo' },
      { id: 'SEED-002', task: 'ownerless work', status: 'todo' },
    ] }], notes: [] };
    const tasksText = [
      '## Scored', '',
      '| id | seat | score |', '|---|---|---|',
      '| SEED-001 | chatgpt | 3 |',
      '| SEED-002 | unbound | 1 |',
    ].join('\n');
    const seeded = buildPortfolio({ qeueDir, tasksText, now: Date.parse('2026-11-11T00:00:00.000Z') });
    const owned = seeded.items?.find((i) => i.id === 'SEED-001');
    const ownerless = seeded.items?.find((i) => i.id === 'SEED-002');
```

_First 80 of 91 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
