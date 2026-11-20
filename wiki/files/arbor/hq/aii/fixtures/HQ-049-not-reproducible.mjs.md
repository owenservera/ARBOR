# File: hq/aii/fixtures/HQ-049-not-reproducible.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-049-not-reproducible.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2245 B |
| Lines | 41 |
| Hash | 26c172a4ad78 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 9 | no | const ROOT = dirname(fileURLToPath(import.meta.url)); |
| PROVENANCE | const | 11 | no | const PROVENANCE = `Locked 2026-11-11 by running reproductionOutcomes (hq/lib/dogfood.mjs) against reproduction-attempt |
| RECEIPTS | const | 19 | no | const RECEIPTS = [ |
| findings | const | 34 | no | const findings = []; |
| outcomes | const | 35 | no | const outcomes = reproductionOutcomes(RECEIPTS); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 4 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/dogfood.mjs | import | 5 | [hq/lib/dogfood.mjs](../../lib/dogfood.mjs.md) |
| node:path | import | 6 | external |
| node:url | import | 7 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-049-not-reproducible.mjs
// Scenario HQ-049 (group F): "Which test results cannot be reproduced?"
// Ground truth locked 2026-11-11 from live current outputs; rerun() re-derives live.
import { defineFixture, finding } from './harness.mjs';
import { reproductionOutcomes } from '../../lib/dogfood.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));

const PROVENANCE = `Locked 2026-11-11 by running reproductionOutcomes (hq/lib/dogfood.mjs) against reproduction-attempt
receipts seeded for this fixture (no credentials, no private session content) plus the live recon state.
- bun hq/bin/hq.mjs receipts -> 3 receipts, all kind=context; zero test-outcome receipts (no reproduction-tracking store).
- dogfood/recon AGENTS-003 status='blocked'; no per-test original-vs-rerun table exists (capability_evidence count = 0).
- reproductionOutcomes(receipts) -> per testId: original vs rerun effect and a consistent flag.
Rerun this fixture to re-derive the findings live.`;

// Synthetic reproduction-attempt receipts (seeded only): original outcome vs re-run outcome per test.
const RECEIPTS = [
  { testId: 'kernel-revision-readback', effect: 'OK', rerunEffect: 'OK', source: 'hq/test/kernel-store.test.mjs:165' },
  { testId: 'revoke-mid-task', effect: 'OK', rerunEffect: 'FAILED', source: 'hq/test/revocations.test.mjs:94' },
  { testId: 'channel-seat-accepted', effect: 'OK', rerunEffect: null, source: 'hq/test/channel-seat.test.mjs:190' },
];

export default defineFixture({
  id: 'HQ-049',
  provenance: PROVENANCE,
  expected: [
    finding('kernel-revision-readback consistent=true', 'reproductionOutcomes / dogfood.mjs'),
    finding('revoke-mid-task consistent=false', 'reproductionOutcomes / dogfood.mjs'),
    finding('channel-seat-accepted consistent=false', 'reproductionOutcomes / dogfood.mjs'),
  ],
  run: async () => {
    const findings = [];
    const outcomes = reproductionOutcomes(RECEIPTS);
    for (const o of outcomes) {
      findings.push(finding(`${o.testId} consistent=${o.consistent}`, 'reproductionOutcomes / dogfood.mjs'));
    }
    return findings;
  },
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
