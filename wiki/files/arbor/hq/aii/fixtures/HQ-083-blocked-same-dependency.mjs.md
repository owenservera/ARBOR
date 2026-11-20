# File: hq/aii/fixtures/HQ-083-blocked-same-dependency.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-083-blocked-same-dependency.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6209 B |
| Lines | 92 |
| Hash | 4d2e73612618 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 27 | no | const ROOT = join(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| TOP_SIGNATURE | const | 29 | no | const TOP_SIGNATURE = &#39;receipt touched a placeholder thread (chatgpt-live-tab)&#39;; |
| findings | const | 43 | no | const findings = []; |
| cli | const | 45 | no | const cli = runHq([&#39;pm&#39;, &#39;--json&#39;], { cwd: ROOT }); |
| emitted | const | 47 | no | const emitted = JSON.parse(cli.stdout); |
| groups | const | 48 | no | const groups = emitted.model?.blockedGroups; |
| top | const | 51 | no | const top = groups[0]; |
| sorted | const | 62 | no | const sorted = [...groups].sort((a, b) =&gt; b.count - a.count); |
| qeueDir | const | 73 | no | const qeueDir = { lanes: [{ lane: &#39;L&#39;, records: [ |
| tasksText | const | 77 | no | const tasksText = [ |
| seeded | const | 83 | no | const seeded = buildPortfolio({ qeueDir, tasksText, now: Date.parse(&#39;2026-11-11T00:00:00.000Z&#39;) }); |
| seededGroups | const | 84 | no | const seededGroups = seeded.blockedGroups ?? []; |

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
// hq/aii/fixtures/HQ-083-blocked-same-dependency.mjs
// AII build lane "p1-existing-surface-fixtures". Scenario HQ-083 (group J):
// "Which tasks are blocked by the same underlying dependency?"
//
// Ground truth LOCKED 2026-11-11 from live output on branch main:
//   bun hq/bin/hq.mjs pm --json
//     -> model.blockedGroups[0] = { count: 20, signature:
//        "receipt touched a placeholder thread (chatgpt-live-tab)" } — twenty
//        rows in the active-tasks ## Blocked table share one underlying
//        blocker; smaller clusters follow (2, 1, 1, ...).
//   buildPortfolio() (hq/lib/pmo.mjs:530) over the real registers produced the
//   same model. groupBlocked() (hq/lib/pmo.mjs:441) normalizes each blocker
//   (strips "Unblock: "/"Verify receipt: " prefixes, collapses whitespace),
//   groups rows by signature (case-insensitive) and sorts largest first.
//
// The largest cluster (20 rows, the placeholder-thread receipt signature) is
// the pinned answer; the smaller clusters drift as lanes re-file blockers, so
// the group COUNT is re-derived live. The grouping mechanism itself is proven
// on seeded data.
import { defineFixture, finding, runHq } from './harness.mjs';
import { buildPortfolio } from '../../lib/pmo.mjs';
import { readFileSync } from 'node:fs';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const TOP_SIGNATURE = 'receipt touched a placeholder thread (chatgpt-live-tab)';

export default defineFixture({
  id: 'HQ-083',
  provenance: 'Locked 2026-11-11 on branch main from live output: bun hq/bin/hq.mjs pm --json printed model.blockedGroups[0] = { count: 20, signature: "receipt touched a placeholder thread (chatgpt-live-tab)" } with smaller clusters after it (count 2, then singles). buildPortfolio() (hq/lib/pmo.mjs:530) over the real registers (qeue/, docs/integration/STRATEGIC-INITIATIVES.md, C:/VIVIM/channel/tasks/active-tasks.md) produced the same blockedGroups. groupBlocked() (hq/lib/pmo.mjs:441) normalizes each blocker — strips "Unblock: "/"Verify receipt: " prefixes via normaliseSignature, collapses whitespace — then groups by lowercased signature and sorts largest first. The largest cluster (20 rows sharing the placeholder-thread signature) is the pinned answer; the smaller clusters and the total group count drift as lanes re-file blockers and are re-derived live. The grouping mechanism is additionally proven on seeded data: two rows sharing one blocker collapse into a single group of count 2, largest-first ordering verified.',
  expected: [
    { what: '20 blocked rows share one underlying blocker: "receipt touched a placeholder thread (chatgpt-live-tab)"', where: 'hq/lib/pmo.mjs buildPortfolio' },
    { what: 'the largest blocked group is the first entry (largest-first ordering)', where: 'hq/lib/pmo.mjs groupBlocked' },
    { what: /^\d+ distinct blocker signatures across the blocked rows$/, where: 'hq/lib/pmo.mjs groupBlocked' },
    { what: 'every blocked group carries a signature and a row count', where: 'hq/lib/pmo.mjs groupBlocked' },
    { what: 'seeded rows sharing one blocker group into one entry with count 2', where: 'hq/lib/pmo.mjs groupBlocked' },
    { what: /^the pm CLI reports \d+ blocked row\(s\) in the largest cluster$/, where: 'hq/bin/hq.mjs pm --json' },
  ],
  run: async () => {
    const findings = [];

    const cli = runHq(['pm', '--json'], { cwd: ROOT });
    if (cli.exit !== 0) throw new Error(`hq pm --json failed: exit=${cli.exit} stderr=${cli.stderr}`);
    const emitted = JSON.parse(cli.stdout);
    const groups = emitted.model?.blockedGroups;
    if (!Array.isArray(groups) || !groups.length) throw new Error('pm --json has no blockedGroups');

    const top = groups[0];
    if (top.signature !== TOP_SIGNATURE) {
      throw new Error(`unexpected top signature: ${JSON.stringify(top.signature)}`);
    }
    if (top.count !== 20) {
      throw new Error(`expected 20 rows in the top cluster, got ${top.count}`);
    }
    findings.push(finding(`${top.count} blocked rows share one underlying blocker: "${top.signature}"`, 'hq/lib/pmo.mjs buildPortfolio'));
    findings.push(finding(`the pm CLI reports ${top.count} blocked row(s) in the largest cluster`, 'hq/bin/hq.mjs pm --json'));
    findings.push(finding('the largest blocked group is the first entry (largest-first ordering)', 'hq/lib/pmo.mjs groupBlocked'));

    const sorted = [...groups].sort((a, b) => b.count - a.count);
    if (sorted[0] !== groups[0]) throw new Error('blockedGroups are not sorted largest-first');
    for (const group of groups) {
      if (typeof group.signature !== 'string' || !Number.isFinite(group.count)) {
        throw new Error(`malformed blocked group: ${JSON.stringify(group)}`);
      }
    }
    findings.push(finding('every blocked group carries a signature and a row count', 'hq/lib/pmo.mjs groupBlocked'));
    findings.push(finding(`${groups.length} distinct blocker signatures across the blocked rows`, 'hq/lib/pmo.mjs groupBlocked'));

    // Seeded proof of the grouping mechanism (no workspace writes).
    const qeueDir = { lanes: [{ lane: 'L', records: [
      { id: 'SEED-001', task: 'a', status: 'todo' },
      { id: 'SEED-002', task: 'b', status: 'todo' },
    ] }], notes: [] };
    const tasksText = [
      '## Blocked', '',
      '| id | blocker |', '|---|---|',
      '| SEED-001 | Unblock: shared dependency X |',
```

_First 80 of 93 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
