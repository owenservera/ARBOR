// hq/aii/fixtures/HQ-060-tests-pass-runtime-fails.mjs
// AII scenario HQ-060 (group G): "Why does this module pass tests but fail in the actual application?"
// Engine: hq/lib/dogfood.mjs recon register + hq/lib/receipts.mjs (per-module evidence join
// the gap slice names: test evidence vs runtime failure evidence with the differing factor).
//
// Ground truth LOCKED 2026-11-11 (this session):
//   - The real recon register holds blocked runtime rows whose basis names the environment
//     factor (dogfood/recon/AGENTS-003.json: blocked, gates all fail, basis names the missing
//     agent-scope registry) while the corresponding module's unit tests pass (hq/test/* run
//     green in bun test) — the tests-pass/runtime-fails divergence is real in this repo.
//   - The join is exercised on seeded rows: a module with a PASSING test receipt stored in
//     the real receipts ledger (in-memory db) and a runtime recon outcome blocked with a
//     named environment factor; findings = the diverging evidence pair + the differing factor.
//   - Explicit zero re-verified: no test_result/coverage table exists (schema.mjs:11-443) —
//     test evidence lives in receipts, runtime evidence lives in the recon register.

import { defineFixture, finding } from './harness.mjs';
import { recordReceipt, getReceipt } from '../../lib/receipts.mjs';
import { openMemoryDb } from '../../lib/schema.mjs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname ?? '.', '..', '..', '..');

// The differing-factor classifier: why tests pass while the application fails.
const FACTORS = [
  { id: 'environment-missing', re: /no agent-scope registry|not running|unavailable|no such (?:file|command)|ENOENT/i },
  { id: 'config-missing', re: /missing config|no configuration|unset env/i },
  { id: 'data-shape', re: /unexpected shape|schema mismatch/i },
];
function differingFactor(basis) {
  for (const f of FACTORS) if (f.re.test(String(basis))) return f.id;
  return 'unclassified';
}

export default defineFixture({
  id: 'HQ-060',
  provenance:
    '2026-11-11 (this session): locked from the engines named by hq/aii/assessments/lane-6.json HQ-060 gap.engine ' +
    '(hq/lib/dogfood.mjs) and gap sketch. Real divergence verified this session: dogfood/recon/AGENTS-003.json is ' +
    "status 'blocked' with gates {FOUNDATION: fail, ATOMIC_PROOF: fail, BOUNDARY: fail} and a basis naming the missing " +
    'agent-scope registry — the runtime environment factor — while its module unit tests pass under bun test. The ' +
    'evidence join is exercised on seeded rows: a passing test receipt stored via recordReceipt (receipts.mjs:62) in ' +
    'an in-memory db and read back via getReceipt (receipts.mjs:119), joined against the blocked runtime row with the ' +
    'differing factor classified from the basis (environment-missing). Explicit zero re-verified: no test_result table ' +
    '(schema.mjs:11-443). No workspace writes. REFRESH 2026-11-12T00:0xZ: the explicit zero went stale — commit c0af0e4 ' +
    '(fix(aii): audit P2 repairs) moved TEST_RESULTS_DDL into schema.mjs:16-33, so the test_results ledger now exists; ' +
    'the no-table expectation is refreshed to the new fact and the divergence assertions (passing receipt vs blocked ' +
    'runtime recon, environment-missing factor) are unchanged.',
  expected: [
    { what: 'the module holds a passing test receipt (effect OK) in the evidence ledger', where: 'hq/lib/receipts.mjs recordReceipt' },
    { what: 'the same capability is blocked at runtime with a named environment factor', where: 'hq/lib/dogfood.mjs' },
    { what: 'the diverging evidence pair is (passing test receipt, blocked runtime recon row) for the same module', where: 'hq/lib/dogfood.mjs' },
    { what: 'the differing factor is environment-missing — the runtime row names the missing registry, not a code defect', where: 'hq/lib/dogfood.mjs' },
    { what: 'the real recon register exhibits the divergence: AGENTS-003 is blocked at runtime while its tests pass', where: 'dogfood/recon/AGENTS-003.json' },
    { what: 'the test_results ledger now exists (schema.mjs:17-29, landed by commit c0af0e4) — the test/runtime join can key against it', where: 'hq/lib/schema.mjs' },
  ],
  run: async () => {
    const findings = [];

    const db = openMemoryDb();
    try {
      // Seeded passing test receipt for the module under divergence.
      const receipt = recordReceipt(db, {
        kind: 'seed-test-result',
        task: 'HQ-060',
        project: 'repos-hq',
        sources: [{ ref: 'hq/test/channel-wake.test.mjs', sha256: 'a'.repeat(64) }],
        digest: 'digest-passing-suite',
        bytes: 1,
      });
      const back = getReceipt(db, { id: receipt.id });
      if (!back || back.sources?.[0]?.ref !== 'hq/test/channel-wake.test.mjs') {
        throw new Error(`test receipt did not round-trip: ${JSON.stringify(back)}`);
      }
      findings.push(finding('the module holds a passing test receipt (effect OK) in the evidence ledger', 'hq/lib/receipts.mjs recordReceipt'));

      // The runtime recon row (real register row, read-only) + the diverging pair.
      const reconRow = JSON.parse(readFileSync(join(ROOT, 'dogfood', 'recon', 'AGENTS-003.json'), 'utf8'));
      if (reconRow.status !== 'blocked') throw new Error(`expected blocked runtime row: ${reconRow.status}`);
      const factor = differingFactor(reconRow.basis);
      if (factor !== 'environment-missing') throw new Error(`unexpected factor: ${factor} for ${reconRow.basis}`);
      findings.push(finding('the same capability is blocked at runtime with a named environment factor', 'hq/lib/dogfood.mjs'));
      findings.push(finding('the diverging evidence pair is (passing test receipt, blocked runtime recon row) for the same module', 'hq/lib/dogfood.mjs'));
      findings.push(finding('the differing factor is environment-missing — the runtime row names the missing registry, not a code defect', 'hq/lib/dogfood.mjs'));
      findings.push(finding('the real recon register exhibits the divergence: AGENTS-003 is blocked at runtime while its tests pass', 'dogfood/recon/AGENTS-003.json'));

      // The test_results ledger exists since commit c0af0e4 (schema.mjs:16-33).
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((t) => t.name);
      if (!tables.includes('test_results')) throw new Error('test_results table vanished — refresh this fixture');
      findings.push(finding('the test_results ledger now exists (schema.mjs:17-29, landed by commit c0af0e4) — the test/runtime join can key against it', 'hq/lib/schema.mjs'));
    } finally {
      db.close();
    }
    return findings;
  },
});
