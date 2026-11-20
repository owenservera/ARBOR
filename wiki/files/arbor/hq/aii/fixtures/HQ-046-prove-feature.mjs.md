# File: hq/aii/fixtures/HQ-046-prove-feature.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-046-prove-feature.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2468 B |
| Lines | 41 |
| Hash | d937a745e158 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 11 | no | const ROOT = join(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| PROVENANCE | const | 13 | no | const PROVENANCE = `Locked 2026-11-11 by running the real engine modules against the live index (.hq/index.db, lastIndexed 2026-11-10T23:33:38): |
| findings | const | 31 | no | const findings = []; |
| ev | const | 32 | no | const ev = featureTestEvidence(&#39;AGENTS-003&#39;); |
| db | const | 35 | no | const db = openDb(join(ROOT, &#39;.hq&#39;, &#39;index.db&#39;)); |
| receipts | const | 36 | no | const receipts = listReceipts(db); |
| testOutcome | const | 37 | no | const testOutcome = receipts.filter((r) =&gt; String(r.kind).toLowerCase() === &#39;test-outcome&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 4 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/dogfood.mjs | import | 5 | [hq/lib/dogfood.mjs](../../lib/dogfood.mjs.md) |
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
// hq/aii/fixtures/HQ-046-prove-feature.mjs
// Scenario HQ-046 (group F): "Prove that this feature actually works."
// Ground truth locked 2026-11-11 from live current outputs; rerun() re-derives live.
import { defineFixture, finding } from './harness.mjs';
import { featureTestEvidence } from '../../lib/dogfood.mjs';
import { listReceipts } from '../../lib/receipts.mjs';
import { openDb } from '../../lib/schema.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const PROVENANCE = `Locked 2026-11-11 by running the real engine modules against the live index (.hq/index.db, lastIndexed 2026-11-10T23:33:38):
- bun hq/bin/hq.mjs receipts -> 3 receipts, all kind=context (no test-outcome receipts).
- capability_evidence count = 0; no schema table records per-feature pass/fail evidence.
- dogfood/recon has exactly one proven row (INTELLIGENCE-012); AGENTS-003 is status='blocked' (proven=false).
- featureTestEvidence('AGENTS-003') -> proven=false, recon.status='blocked', sources cite hq/lib/approvals.mjs:32 etc.
Refresh 2026-11-11: the RECEIPT COUNT grows during this campaign (aii-fixture receipts are recorded as lanes verify), so the total was de-hardcoded — the invariant asserted is that NO test-outcome receipt exists, not how many receipts there are in total.
Rerun this fixture to re-derive the findings live.`;


export default defineFixture({
  id: 'HQ-046',
  provenance: PROVENANCE,
  expected: [
    finding('AGENTS-003 proven=false', 'featureTestEvidence / dogfood.mjs'),
    finding('AGENTS-003 recon status=blocked', 'dogfood/recon/AGENTS-003.json'),
    finding('test-outcome receipts=0', 'receipts kind=context only'),
  ],
  run: async () => {
    const findings = [];
    const ev = featureTestEvidence('AGENTS-003');
    findings.push(finding(`${ev.featureId} proven=${ev.proven}`, 'featureTestEvidence / dogfood.mjs'));
    findings.push(finding(`${ev.featureId} recon status=${ev.recon ? ev.recon.status : 'none'}`, 'dogfood/recon/AGENTS-003.json'));
    const db = openDb(join(ROOT, '.hq', 'index.db'));
    const receipts = listReceipts(db);
    const testOutcome = receipts.filter((r) => String(r.kind).toLowerCase() === 'test-outcome');
    findings.push(finding(`test-outcome receipts=${testOutcome.length}`, 'receipts kind=context only'));
    return findings;
  },
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
