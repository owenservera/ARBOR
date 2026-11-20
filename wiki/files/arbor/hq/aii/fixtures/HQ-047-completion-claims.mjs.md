# File: hq/aii/fixtures/HQ-047-completion-claims.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-047-completion-claims.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3155 B |
| Lines | 49 |
| Hash | 7eb6a9c88e20 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 11 | no | const ROOT = join(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| PROVENANCE | const | 13 | no | const PROVENANCE = `Locked 2026-11-11 by running joinCompletionClaims (hq/lib/evidence-join.mjs) against live completion claims |
| CLAIMS | const | 22 | no | const CLAIMS = [ |
| findings | const | 38 | no | const findings = []; |
| db | const | 39 | no | const db = openDb(join(ROOT, &#39;.hq&#39;, &#39;index.db&#39;)); |
| receipts | const | 40 | no | const receipts = listReceipts(db); |
| testOutcome | const | 41 | no | const testOutcome = receipts.filter((r) =&gt; String(r.kind).toLowerCase() === &#39;test-outcome&#39;); |
| joined | const | 42 | no | const joined = joinCompletionClaims(CLAIMS, testOutcome); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 4 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/evidence-join.mjs | import | 5 | [hq/lib/evidence-join.mjs](../../lib/evidence-join.mjs.md) |
| ../../lib/receipts.mjs | import | 6 | [hq/lib/receipts.mjs](../../lib/receipts.mjs.md) |
| ../../lib/schema.mjs | import | 7 | [hq/lib/schema.mjs](../../lib/schema.mjs.md) |
| node:path | import | 8 | external |
| node:url | import | 9 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-047-completion-claims.mjs
// Scenario HQ-047 (group F): "Which completion claims are unsupported by test evidence?"
// Ground truth locked 2026-11-11 from live current outputs; rerun() re-derives live.
import { defineFixture, finding } from './harness.mjs';
import { joinCompletionClaims } from '../../lib/evidence-join.mjs';
import { listReceipts } from '../../lib/receipts.mjs';
import { openDb } from '../../lib/schema.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const PROVENANCE = `Locked 2026-11-11 by running joinCompletionClaims (hq/lib/evidence-join.mjs) against live completion claims
derived from dogfood/workorders-101.json order pass criteria, joined against test-outcome receipts in .hq/index.db.
- bun hq/bin/hq.mjs receipts -> 3 receipts, all kind=context; zero test-outcome receipts.
- capability_evidence count = 0; no schema table records per-feature pass/fail evidence.
- With zero test-outcome receipts, every completion claim is unsupported (supported=0, unsupported=N).
- dogfood/recon AGENTS-003 status='blocked'; INTELLIGENCE-012 status='proven' (kernel revision readback).
Rerun this fixture to re-derive the findings live.`;

// Completion claims taken from real work order task + pass criterion pairs.
const CLAIMS = [
  { claimId: 'AGENTS-003', source: 'dogfood/workorders-101.json:10 (Define agent permission scopes)', claim: 'Create/edit/revoke agent and inspect effect scope' },
  { claimId: 'BUILDER-005', source: 'dogfood/workorders-101.json:49 (Define application acceptance criteria)', claim: 'Define one executable booking-app user journey' },
  { claimId: 'DATA-003', source: 'dogfood/workorders-101.json:132 (Define per-user source identity)', claim: 'Prove grant, trace, revoke, restore on one account' },
  { claimId: 'EXPERIENCE-009', source: 'dogfood/workorders-101.json:142 (Define cross-device navigation rules)', claim: 'Ordinary user completes a task unaided' },
];

export default defineFixture({
  id: 'HQ-047',
  provenance: PROVENANCE,
  expected: [
    finding('supported=0 unsupported=4', 'joinCompletionClaims summary / evidence-join.mjs'),
    finding('AGENTS-003 unsupported=true', 'joinCompletionClaims record / evidence-join.mjs'),
    finding('BUILDER-005 unsupported=true', 'joinCompletionClaims record / evidence-join.mjs'),
  ],
  run: async () => {
    const findings = [];
    const db = openDb(join(ROOT, '.hq', 'index.db'));
    const receipts = listReceipts(db);
    const testOutcome = receipts.filter((r) => String(r.kind).toLowerCase() === 'test-outcome');
    const joined = joinCompletionClaims(CLAIMS, testOutcome);
    findings.push(finding(`supported=${joined.summary.supported} unsupported=${joined.summary.unsupported}`, 'joinCompletionClaims summary / evidence-join.mjs'));
    for (const rec of joined.records) {
      findings.push(finding(`${rec.claimId} unsupported=${rec.unsupported}`, 'joinCompletionClaims record / evidence-join.mjs'));
    }
    return findings;
  },
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
