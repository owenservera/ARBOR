# File: hq/aii/fixtures/HQ-055-strongest-evidence.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-055-strongest-evidence.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6088 B |
| Lines | 95 |
| Hash | 8cc1cf685ba1 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CONCLUSION | const | 18 | no | const CONCLUSION = { |
| ARTIFACTS | const | 22 | no | const ARTIFACTS = [ |
| TIER | const | 30 | no | const TIER = { &#39;test-receipt&#39;: 4, &#39;source-anchor&#39;: 3, &#39;doc-claim&#39;: 2, &#39;session-prose&#39;: 1 }; |
| rankEvidence | function | 31 | no | function rankEvidence(artifacts, joinedReceiptIds) { |
| findings | const | 59 | no | const findings = []; |
| joined | const | 60 | no | const joined = joinEvidence({ receipts: [ { receiptId: ARTIFACTS[0].ref, requestId: ARTIFACTS[0].requestId, effect: &#39;OK&#39; }, { receiptId: &#39;rcpt_seed_unjoined&#39;, requestId: &#39;req-404&#39;, effect: &#39;OK&#39; }, ], |
| joinedIds | const | 75 | no | const joinedIds = new Set(joined.records.filter((r) =&gt; r.joinable).map((r) =&gt; r.receiptId)); |
| ranked | const | 76 | no | const ranked = rankEvidence(ARTIFACTS, joinedIds); |
| unjoined | const | 87 | no | const unjoined = rankEvidence( [{ kind: &#39;test-receipt&#39;, ref: &#39;rcpt_seed_unjoined&#39;, requestId: &#39;req-404&#39;, strength: 0 }, ARTIFACTS[1]], joinedIds, ); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 14 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/evidence-join.mjs | import | 15 | [hq/lib/evidence-join.mjs](../../lib/evidence-join.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-055-strongest-evidence.mjs
// AII scenario HQ-055 (group F): "What is the strongest evidence supporting this architectural conclusion?"
// Engine: hq/lib/evidence-join.mjs joinEvidence (evidence-join.mjs:70) — the join the gap
// slice names — plus the strength ranking the gap defines.
//
// Ground truth LOCKED 2026-11-11 (this session):
//   - joinEvidence({receipts, outcomes, decisions, registry}) (evidence-join.mjs:70-134)
//     joins receipts→outcomes by requestId and reports {records, summary} with
//     joinable/stored/named/unknown counts. Exercised this session on seeded rows.
//   - Strength ordering (from the gap capability): a receipt whose outcome is JOINED with
//     observed evidence state outranks an indexed source anchor, which outranks a doc
//     claim, which outranks session prose. Prose is never the strongest evidence.

import { defineFixture, finding } from './harness.mjs';
import { joinEvidence } from '../../lib/evidence-join.mjs';

// Seeded conclusions and candidate evidence artifacts, graded per the gap capability.
const CONCLUSION = {
  id: 'dec-arch-001',
  statement: 'the agent bus is the delivery layer; file inboxes never wake a seat',
};
const ARTIFACTS = [
  { kind: 'test-receipt', ref: 'rcpt_seed_joined_outcome', receiptId: 'rcpt_seed_joined_outcome', requestId: 'req-201', outcome: { effect: 'OK', evidenceState: 'observed' }, strength: 4 },
  { kind: 'source-anchor', ref: 'docs/AGENT-BUS.md', strength: 3 },
  { kind: 'doc-claim', ref: 'docs/AGENT-BUS.md#delivery-is-not-movement', strength: 2 },
  { kind: 'session-prose', ref: 'session note: "probably the bus wakes them"', strength: 1 },
];

// Strength ranking: the join decides for receipts; the tier order decides the rest.
const TIER = { 'test-receipt': 4, 'source-anchor': 3, 'doc-claim': 2, 'session-prose': 1 };
function rankEvidence(artifacts, joinedReceiptIds) {
  return [...artifacts]
    .map((a) => ({
      ...a,
      strength: a.kind === 'test-receipt'
        ? (joinedReceiptIds.has(a.receiptId) && a.outcome?.evidenceState === 'observed' ? 4 : 0)
        : TIER[a.kind],
    }))
    .sort((x, y) => y.strength - x.strength);
}

export default defineFixture({
  id: 'HQ-055',
  provenance:
    '2026-11-11 (this session): locked from the engine named by hq/aii/assessments/lane-6.json HQ-055 gap.engine ' +
    '(hq/lib/evidence-join.mjs). joinEvidence (evidence-join.mjs:70-134) was exercised on seeded receipts/outcomes: a ' +
    'receipt joins its outcome by requestId (the only join key, evidence-join.mjs:75-83) and summary reports ' +
    'joinable/stored/named/unknown. The strength ordering — joined receipt with observed state > indexed source anchor > ' +
    'doc claim > session prose — is the gap capability definition (lane-6.json HQ-055 gap.capability) and is pinned as ' +
    'the fixture\'s ranking. No workspace writes.',
  expected: [
    { what: 'a receipt joined to an observed outcome is the strongest evidence for the conclusion', where: 'hq/lib/evidence-join.mjs joinEvidence' },
    { what: 'strength order: joined test receipt > source anchor > doc claim > session prose', where: 'hq/lib/evidence-join.mjs joinEvidence' },
    { what: 'session prose is never the strongest evidence for an architectural conclusion', where: 'hq/lib/evidence-join.mjs joinEvidence' },
    { what: 'joinEvidence joins receipts to outcomes by requestId only (evidence-join.mjs:75-83)', where: 'hq/lib/evidence-join.mjs joinEvidence' },
    { what: 'a receipt with no outcome for its requestId joins nothing and cannot outrank an anchor', where: 'hq/lib/evidence-join.mjs joinEvidence' },
  ],
  run: async () => {
    const findings = [];
    const joined = joinEvidence({
      receipts: [
        { receiptId: ARTIFACTS[0].ref, requestId: ARTIFACTS[0].requestId, effect: 'OK' },
        { receiptId: 'rcpt_seed_unjoined', requestId: 'req-404', effect: 'OK' },
      ],
      outcomes: [
        ARTIFACTS[0].outcome && { requestId: ARTIFACTS[0].requestId, effect: 'OK', evidenceState: 'observed' },
      ].filter(Boolean),
      decisions: [{ decisionId: CONCLUSION.id, effect: CONCLUSION.statement, kind: 'architecture' }],
    });
    if (joined.summary.joinable !== 1 || joined.summary.receipts !== 2) {
      throw new Error(`unexpected join summary: ${JSON.stringify(joined.summary)}`);
    }
    findings.push(finding('joinEvidence joins receipts to outcomes by requestId only (evidence-join.mjs:75-83)', 'hq/lib/evidence-join.mjs joinEvidence'));

    const joinedIds = new Set(joined.records.filter((r) => r.joinable).map((r) => r.receiptId));
    const ranked = rankEvidence(ARTIFACTS, joinedIds);
    if (ranked[0].kind !== 'test-receipt' || ranked[0].ref !== ARTIFACTS[0].ref) {
      throw new Error(`unexpected strongest: ${JSON.stringify(ranked[0])}`);
    }
    findings.push(finding('a receipt joined to an observed outcome is the strongest evidence for the conclusion', 'hq/lib/evidence-join.mjs joinEvidence'));
```

_First 80 of 96 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
