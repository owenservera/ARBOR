# File: hq/aii/fixtures/HQ-042-decision-provenance.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-042-decision-provenance.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6498 B |
| Lines | 96 |
| Hash | d9863fa96896 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 29 | no | const ROOT = join(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| DECISION_TITLE | const | 31 | no | const DECISION_TITLE = &#39;DEC-2026-11-05-ONE-VERTICAL-SLICE&#39;; |
| DECISION_PATH | const | 32 | no | const DECISION_PATH = &#39;docs/decisions/DEC-2026-11-05-ONE-VERTICAL-SLICE.md&#39;; |
| findings | const | 47 | no | const findings = []; |
| db | const | 49 | no | const db = openDb(join(ROOT, &#39;.hq&#39;, &#39;index.db&#39;)); |
| rows | const | 51 | no | const rows = decisionRegister(db, {}); |
| decision | const | 52 | no | const decision = rows.find((d) =&gt; d.title === DECISION_TITLE); |
| evidence | const | 67 | no | const evidence = decision.evidence ?? []; |
| anchor | const | 68 | no | const anchor = evidence.find((e) =&gt; e.ref === DECISION_PATH); |
| cli | const | 87 | no | const cli = runHq([&#39;decisions&#39;], { cwd: ROOT }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 23 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/schema.mjs | import | 24 | [hq/lib/schema.mjs](../../lib/schema.mjs.md) |
| ../../lib/canon.mjs | import | 25 | [hq/lib/canon.mjs](../../lib/canon.mjs.md) |
| node:path | import | 26 | external |
| node:url | import | 27 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-042-decision-provenance.mjs
// AII build lane "p1-existing-surface-fixtures". Scenario HQ-042 (group E):
// "Where did this design decision originally come from?"
//
// Ground truth LOCKED 2026-11-11 from live output on branch main:
//   bun hq/bin/hq.mjs decisions
//     -> rows including: proposed  architecture  2026-11-05
//        DEC-2026-11-05-ONE-VERTICAL-SLICE
//        docs/decisions/DEC-2026-11-05-ONE-VERTICAL-SLICE.md
//   decisionRegister(db, {}) (hq/lib/canon.mjs:1752) returns each row with the
//   provenance fields decisionRow() maps (hq/lib/canon.mjs:1693-1714):
//   source_path, title, status, authority, date, rationale, evidence[] (JSON
//   with ref/sha256/claimed/form/line), hash, valid_from, valid_to.
//   Live: DEC-2026-11-05-ONE-VERTICAL-SLICE carries
//   source_path docs/decisions/DEC-2026-11-05-ONE-VERTICAL-SLICE.md,
//   status proposed, authority architecture, date 2026-11-05, and evidence[0]
//   = { ref: docs/decisions/DEC-2026-11-05-ONE-VERTICAL-SLICE.md, claimed:
//   'accepted', form: 'heading', line: 5 }.
//
// The source_path/evidence anchor of that decision is stable, so it is pinned
// exactly; the full-row count drifts as lanes index more decisions, so it is
// re-derived live.
import { defineFixture, finding, runHq } from './harness.mjs';
import { openDb } from '../../lib/schema.mjs';
import { decisionRegister } from '../../lib/canon.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const DECISION_TITLE = 'DEC-2026-11-05-ONE-VERTICAL-SLICE';
const DECISION_PATH = 'docs/decisions/DEC-2026-11-05-ONE-VERTICAL-SLICE.md';

export default defineFixture({
  id: 'HQ-042',
  provenance: 'Locked 2026-11-11 on branch main from live output: bun hq/bin/hq.mjs decisions printed a row "proposed  architecture  2026-11-05  DEC-2026-11-05-ONE-VERTICAL-SLICE  docs/decisions/DEC-2026-11-05-ONE-VERTICAL-SLICE.md". decisionRegister(db, {}) (hq/lib/canon.mjs:1752, mapped by decisionRow at hq/lib/canon.mjs:1693-1714) returned that row with source_path docs/decisions/DEC-2026-11-05-ONE-VERTICAL-SLICE.md, status proposed, authority architecture, date 2026-11-05, a non-empty rationale, and evidence[0] = { ref: docs/decisions/DEC-2026-11-05-ONE-VERTICAL-SLICE.md, sha256: 31aace5fc79e8709be4bb48e9ac9e36bf2373612c477f09b72edda2c2f23b0ee, claimed: "accepted", form: "heading", line: 5 }. The source_path/evidence anchor of that decision is stable, so it is pinned exactly; the full-row count drifts as concurrent lanes index more decisions, so it is re-derived live.',
  expected: [
    { what: `decision ${DECISION_TITLE} originates from ${DECISION_PATH}`, where: 'hq/lib/canon.mjs decisionRegister' },
    { what: `decision ${DECISION_TITLE} carries status proposed and authority architecture`, where: 'hq/lib/canon.mjs decisionRegister' },
    { what: `decision ${DECISION_TITLE} carries date 2026-11-05 and a rationale`, where: 'hq/lib/canon.mjs decisionRegister' },
    { what: `decision ${DECISION_TITLE} cites evidence ${DECISION_PATH} at line 5`, where: 'hq/lib/canon.mjs decisionRegister' },
    { what: 'every decision row carries a source_path and the validity-window fields', where: 'hq/lib/canon.mjs decisionRegister' },
    { what: /^\d+ decisions in the live register with provenance fields$/, where: 'hq/lib/canon.mjs decisionRegister' },
    { what: `the decisions CLI lists ${DECISION_TITLE} with its source path`, where: 'hq/bin/hq.mjs decisions' },
  ],
  run: async () => {
    const findings = [];

    const db = openDb(join(ROOT, '.hq', 'index.db'));
    try {
      const rows = decisionRegister(db, {});
      const decision = rows.find((d) => d.title === DECISION_TITLE);
      if (!decision) throw new Error(`${DECISION_TITLE} not in the live decision register`);
      if (decision.source_path !== DECISION_PATH) {
        throw new Error(`unexpected source_path: ${decision.source_path}`);
      }
      findings.push(finding(`decision ${DECISION_TITLE} originates from ${decision.source_path}`, 'hq/lib/canon.mjs decisionRegister'));
      if (decision.status !== 'proposed' || decision.authority !== 'architecture') {
        throw new Error(`unexpected status/authority: ${decision.status}/${decision.authority}`);
      }
      findings.push(finding(`decision ${DECISION_TITLE} carries status ${decision.status} and authority ${decision.authority}`, 'hq/lib/canon.mjs decisionRegister'));
      if (decision.date !== '2026-11-05' || !decision.rationale) {
        throw new Error(`unexpected date/rationale: ${decision.date}/${Boolean(decision.rationale)}`);
      }
      findings.push(finding(`decision ${DECISION_TITLE} carries date ${decision.date} and a rationale`, 'hq/lib/canon.mjs decisionRegister'));

      const evidence = decision.evidence ?? [];
      const anchor = evidence.find((e) => e.ref === DECISION_PATH);
      if (!anchor) throw new Error(`no evidence anchor for ${DECISION_PATH}`);
      if (anchor.line !== 5) throw new Error(`unexpected evidence line: ${anchor.line}`);
      findings.push(finding(`decision ${DECISION_TITLE} cites evidence ${DECISION_PATH} at line ${anchor.line}`, 'hq/lib/canon.mjs decisionRegister'));

      for (const row of rows) {
        if (!row.source_path) {
          throw new Error(`decision ${row.title} is missing source_path`);
        }
        if (!('valid_from' in row) || !('valid_to' in row)) {
          throw new Error(`decision ${row.title} is missing the validity-window fields`);
        }
      }
```

_First 80 of 97 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
