# File: hq/aii/fixtures/HQ-041-superseded-decisions.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-041-superseded-decisions.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7822 B |
| Lines | 118 |
| Hash | 71c51602d1d4 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 30 | no | const ROOT = join(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| findings | const | 44 | no | const findings = []; |
| db | const | 46 | no | const db = openDb(join(ROOT, &#39;.hq&#39;, &#39;index.db&#39;)); |
| superseded | const | 48 | no | const superseded = decisionRegister(db, { status: &#39;superseded&#39; }); |
| all | const | 54 | no | const all = decisionRegister(db, {}); |
| statuses | const | 55 | no | const statuses = [...new Set(all.map((d) =&gt; d.status))].sort(); |
| cli | const | 65 | no | const cli = runHq([&#39;decisions&#39;, &#39;--status&#39;, &#39;superseded&#39;], { cwd: ROOT }); |
| text | const | 67 | no | const text = cli.stdout.trim(); |
| mem | const | 74 | no | const mem = openMemoryDb(); |
| now | const | 76 | no | const now = &#39;2026-11-11T00:00:00.000Z&#39;; |
| pid | const | 78 | no | const pid = Number(mem.prepare(&#39;SELECT id FROM projects WHERE name = ?&#39;).get(&#39;demo&#39;).id); |
| insert | const | 79 | no | const insert = mem.prepare( `INSERT INTO decisions(id, project_id, source_path, title, status, authority, date, rationale, consequences, alternatives, supersedes, evidence, hash, valid_from, recorded… |
| old | const | 87 | no | const old = decisionRegister(mem, { query: &#39;OLD-DECISION&#39; })[0]; |
| refused | variable | 90 | no | let refused = null; |
| result | const | 101 | no | const result = supersedeDecision(mem, { id: old.id, by: &#39;dec_seeded_new&#39;, ownerConfirmed: true }); |
| after | const | 102 | no | const after = decisionRegister(mem, {}); |
| oldRow | const | 103 | no | const oldRow = after.find((d) =&gt; d.title === &#39;OLD-DECISION&#39;); |
| newRow | const | 104 | no | const newRow = after.find((d) =&gt; d.title === &#39;NEW-DECISION&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 24 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/schema.mjs | import | 25 | [hq/lib/schema.mjs](../../lib/schema.mjs.md) |
| ../../lib/canon.mjs | import | 26 | [hq/lib/canon.mjs](../../lib/canon.mjs.md) |
| node:path | import | 27 | external |
| node:url | import | 28 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-041-superseded-decisions.mjs
// AII build lane "p1-existing-surface-fixtures". Scenario HQ-041 (group E):
// "Which architectural decisions have been superseded?"
//
// Ground truth LOCKED 2026-11-11 from live output on branch main:
//   bun hq/bin/hq.mjs decisions --status superseded
//     -> "No decisions." (exit 0) — the superseded set is EMPTY.
//   bun hq/bin/hq.mjs decisions
//     -> 50 rows: 1 proposed + 49 observed. The proposed one is
//        DEC-2026-11-05-ONE-VERTICAL-SLICE (authority architecture,
//        date 2026-11-05, source_path
//        docs/decisions/DEC-2026-11-05-ONE-VERTICAL-SLICE.md).
//   decisionRegister(db, { status: 'superseded' }) (hq/lib/canon.mjs:1752)
//     -> [] on the live index: zero decisions carry status 'superseded'.
//   supersedeDecision(db, { id, by, ownerConfirmed }) (hq/lib/canon.mjs:1820)
//     -> without ownerConfirmed it refuses with
//        "OWNER_CONFIRMATION_REQUIRED: the owner must confirm this promotion
//        explicitly"; with ownerConfirmed it records the supersession by
//        closing the old row (valid_to) and keeping both rows.
//
// The question is "which decisions have been superseded", so the live answer —
// NONE — is the pinned ground truth, and the mechanism that would produce one
// is proven on a seeded in-memory database (read-only w.r.t. the workspace).
import { defineFixture, finding, runHq } from './harness.mjs';
import { openDb, openMemoryDb } from '../../lib/schema.mjs';
import { decisionRegister, supersedeDecision } from '../../lib/canon.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export default defineFixture({
  id: 'HQ-041',
  provenance: 'Locked 2026-11-11 on branch main from live output: bun hq/bin/hq.mjs decisions --status superseded printed "No decisions." and exited 0 — the live superseded set is EMPTY. bun hq/bin/hq.mjs decisions printed 50 rows, 1 proposed (DEC-2026-11-05-ONE-VERTICAL-SLICE, authority architecture, date 2026-11-05, source_path docs/decisions/DEC-2026-11-05-ONE-VERTICAL-SLICE.md) and 49 observed. decisionRegister(db, { status: "superseded" }) (hq/lib/canon.mjs:1752) returned [] against the live index, so zero decisions carry status superseded. supersedeDecision() (hq/lib/canon.mjs:1820) was then exercised on a seeded IN-MEMORY database: without ownerConfirmed it refuses with "OWNER_CONFIRMATION_REQUIRED: the owner must confirm this promotion explicitly", and with ownerConfirmed it records the supersession while keeping both rows (the old row closed with valid_to, the new row carrying status superseded). The live empty supersession set is the pinned ground truth; the mechanism is proven on seeded data so the workspace index is never written.',
  expected: [
    { what: 'no decision in the live register is superseded', where: 'hq/lib/canon.mjs decisionRegister' },
    { what: 'the superseded decision set is empty', where: 'hq/bin/hq.mjs decisions --status superseded' },
    { what: 'the decision register holds proposed and observed decisions', where: 'hq/lib/canon.mjs decisionRegister' },
    { what: /^\d+ decisions in the live register$/, where: 'hq/lib/canon.mjs decisionRegister' },
    { what: 'supersedeDecision refuses without owner confirmation', where: 'hq/lib/canon.mjs supersedeDecision' },
    { what: 'supersedeDecision records the supersession and keeps both rows', where: 'hq/lib/canon.mjs supersedeDecision' },
  ],
  run: async () => {
    const findings = [];

    const db = openDb(join(ROOT, '.hq', 'index.db'));
    try {
      const superseded = decisionRegister(db, { status: 'superseded' });
      if (superseded.length !== 0) {
        throw new Error(`expected 0 superseded decisions, got ${superseded.length}`);
      }
      findings.push(finding('no decision in the live register is superseded', 'hq/lib/canon.mjs decisionRegister'));

      const all = decisionRegister(db, {});
      const statuses = [...new Set(all.map((d) => d.status))].sort();
      if (statuses.join(', ') !== 'observed, proposed') {
        throw new Error(`unexpected decision statuses: ${statuses.join(', ')}`);
      }
      findings.push(finding('the decision register holds proposed and observed decisions', 'hq/lib/canon.mjs decisionRegister'));
      findings.push(finding(`${all.length} decisions in the live register`, 'hq/lib/canon.mjs decisionRegister'));
    } finally {
      db.close();
    }

    const cli = runHq(['decisions', '--status', 'superseded'], { cwd: ROOT });
    if (cli.exit !== 0) throw new Error(`hq decisions --status superseded failed: exit=${cli.exit} stderr=${cli.stderr}`);
    const text = cli.stdout.trim();
    if (text !== 'No decisions.') {
      throw new Error(`unexpected CLI output: ${JSON.stringify(text)}`);
    }
    findings.push(finding('the superseded decision set is empty', 'hq/bin/hq.mjs decisions --status superseded'));

    // Seeded in-memory database: the mechanism that produces a supersession.
    const mem = openMemoryDb();
    try {
      const now = '2026-11-11T00:00:00.000Z';
      mem.prepare('INSERT INTO projects(name, path, added_at) VALUES (?, ?, ?)').run('demo', '/tmp/hq041-demo', now);
      const pid = Number(mem.prepare('SELECT id FROM projects WHERE name = ?').get('demo').id);
      const insert = mem.prepare(
        `INSERT INTO decisions(id, project_id, source_path, title, status, authority, date, rationale,
```

_First 80 of 119 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
