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
