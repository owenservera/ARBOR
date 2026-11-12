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
    findings.push(finding('strength order: joined test receipt > source anchor > doc claim > session prose', 'hq/lib/evidence-join.mjs joinEvidence'));
    if (ranked[ranked.length - 1].kind !== 'session-prose' || ranked[ranked.length - 1].strength >= ranked[0].strength) {
      throw new Error(`prose rank wrong: ${JSON.stringify(ranked)}`);
    }
    findings.push(finding('session prose is never the strongest evidence for an architectural conclusion', 'hq/lib/evidence-join.mjs joinEvidence'));

    const unjoined = rankEvidence(
      [{ kind: 'test-receipt', ref: 'rcpt_seed_unjoined', requestId: 'req-404', strength: 0 }, ARTIFACTS[1]],
      joinedIds,
    );
    if (unjoined[0].kind !== 'source-anchor') throw new Error(`unjoined receipt outranked an anchor: ${JSON.stringify(unjoined)}`);
    findings.push(finding('a receipt with no outcome for its requestId joins nothing and cannot outrank an anchor', 'hq/lib/evidence-join.mjs joinEvidence'));
    return findings;
  },
});
