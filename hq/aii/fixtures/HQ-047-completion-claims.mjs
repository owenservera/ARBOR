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
