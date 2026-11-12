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
