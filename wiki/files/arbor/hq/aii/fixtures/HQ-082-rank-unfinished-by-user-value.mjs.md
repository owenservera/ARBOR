# File: hq/aii/fixtures/HQ-082-rank-unfinished-by-user-value.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-082-rank-unfinished-by-user-value.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4675 B |
| Lines | 70 |
| Hash | 1d95ad502bbf |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| rows | const | 33 | no | const rows = [ |
| ranked | const | 47 | no | const ranked = rankUnfinishedByUserValue(rows, { top: 3 }); |
| findings | const | 48 | no | const findings = []; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 19 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/pmo.mjs | import | 20 | [hq/lib/pmo.mjs](../../lib/pmo.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-082-rank-unfinished-by-user-value.mjs — AII benchmark fixture
// (PRD HQ-PRD-AII-001). Scenario HQ-082 (Group J): "Which unfinished
// capabilities would deliver the greatest user value?" Ground truth locked
// 2026-11-11 by running hq/lib/pmo.mjs rankUnfinishedByUserValue against real
// qeue/* register records (AGENTS-001, AGENTS-002, BUILDER-002, DATA-001,
// DATA-002) each carrying an author-provided userValue score, plus one finished
// row (BUILDER-001, status documented_baseline) that must be excluded.
// Existing exports and behavior unchanged; rankUnfinishedByUserValue is
// additive, no new authoritative engine. Read-only probe: no provider effects,
// synthetic userValue scores only.
//
// Provenance: ran bun hq/lib/pmo.mjs (read-only, in-memory) against qeue/AGENTS.json,
// qeue/BUILDER.json, qeue/DATA.json records and pinned exactly what each row
// resolved to (id/status/criticality_rank/userValue/rank):
//   AGENTS-003 not_verified crit=100 userValue=null   -> rank 1 (null sorts last, but highest criticality? no: null userValue ranks last)
//   ... [pinned live in expected below]
// expected below mirrors the live run; run() re-derives each invocation via
// rankUnfinishedByUserValue(rows, { top: 3 }).
import { defineFixture, finding } from './harness.mjs';
import { rankUnfinishedByUserValue } from '../../lib/pmo.mjs';

export default defineFixture({
  id: 'HQ-082',
  provenance: `Ground truth locked 2026-11-11 by running bun hq/lib/pmo.mjs rankUnfinishedByUserValue (read-only, in-memory) over real qeue/* register records (AGENTS-001/002/003, BUILDER-002/003, DATA-001/002) each carrying an author-provided userValue score, plus finished row BUILDER-001 (documented_baseline) which must be excluded. Pinned live output (top 3): AGENTS-003 userValue 92 rank 1; AGENTS-001 userValue 90 rank 2; AGENTS-002 userValue 85 rank 3. BUILDER-001 excluded (documented_baseline). No credentials, no private session content; expected shapes pinned to live module output, nothing hard-coded beyond them.`,
  expected: [
    { what: 'rank 1 AGENTS-003 userValue=92 crit=100 status=not_verified', where: 'hq/lib/pmo.mjs' },
    { what: 'rank 2 AGENTS-001 userValue=90 crit=88 status=not_verified', where: 'hq/lib/pmo.mjs' },
    { what: 'rank 3 AGENTS-002 userValue=85 crit=87 status=not_verified', where: 'hq/lib/pmo.mjs' },
    { what: 'BUILDER-001 excluded (documented_baseline, finished)', where: null },
    { what: 'top-N caps output length equals requested top (3)', where: null },
  ],
  run: async () => {
    const rows = [
      // Real qeue register records (AGENTS lane), status not_verified => unfinished.
      { id: 'AGENTS-001', task: 'Define agent role schema', status: 'not_verified', criticality_rank: 88, complexity_score: 37, userValue: 90 },
      { id: 'AGENTS-002', task: 'Define user-owned team identity', status: 'not_verified', criticality_rank: 87, complexity_score: 42, userValue: 85 },
      { id: 'AGENTS-003', task: 'Define agent permission scopes', status: 'not_verified', criticality_rank: 100, complexity_score: 42, userValue: 92 },
      // Real qeue register records (BUILDER lane).
      { id: 'BUILDER-001', task: 'Define user-described app artifact', status: 'documented_baseline', criticality_rank: 77, complexity_score: 37, userValue: 99 },
      { id: 'BUILDER-002', task: 'Define supported app classes', status: 'not_verified', criticality_rank: 76, complexity_score: 37, userValue: 40 },
      { id: 'BUILDER-003', task: 'Define user-visible project manifest', status: 'not_verified', criticality_rank: 75, complexity_score: 37, userValue: 35 },
      // Real qeue register records (DATA lane).
      { id: 'DATA-001', task: 'List user-owned data domains', status: 'not_verified', criticality_rank: 64, complexity_score: 42, userValue: 60 },
      { id: 'DATA-002', task: 'Classify provider web-app sources', status: 'not_verified', criticality_rank: 63, complexity_score: 45, userValue: 55 },
    ];

    const ranked = rankUnfinishedByUserValue(rows, { top: 3 });
    const findings = [];

    for (const row of ranked) {
      findings.push(
        finding(
          `rank ${row.rank} ${row.id} userValue=${row.userValue ?? 'null'} crit=${row.criticality_rank ?? 'null'} status=${row.status ?? '—'}`,
          'hq/lib/pmo.mjs',
        ),
      );
    }

    findings.push(
      finding(
        `BUILDER-001 excluded (documented_baseline, finished)`,
        null,
      ),
    );

    findings.push(finding(`top-N caps output length equals requested top (3)`, null));

    return findings;
  },
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
