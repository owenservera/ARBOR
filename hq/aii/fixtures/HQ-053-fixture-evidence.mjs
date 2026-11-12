// hq/aii/fixtures/HQ-053-fixture-evidence.mjs
// AII scenario HQ-053 (group F): "Which test fixtures incorrectly resemble production evidence?"
// Engine: hq/lib/receipts.mjs (recordReceipt receipts.mjs:62, getReceipt receipts.mjs:119) —
// the evidence ledger the gap slice names as the engine to extend.
//
// Ground truth LOCKED 2026-11-11 (this session):
//   - recordReceipt accepts any sources [{ref, sha256}] with no fixture-vs-production check
//     (receipts.mjs:62-89) — verified this session by storing seeded receipts with test-dir
//     refs carrying production-shaped payloads (rcpt_* ids, 64-hex sha256, hq/lib paths).
//   - The classifier is exercised in the fixture over refs seeded into the REAL receipts
//     ledger (in-memory db): a ref under hq/test/ or *.test.* / *.bak* is a test artifact;
//     production-resembling = test artifact whose payload carries production-evidence shape
//     (rcpt_ id pattern, 64-hex digest, or a hq/lib source path).

import { defineFixture, finding } from './harness.mjs';
import { recordReceipt, getReceipt } from '../../lib/receipts.mjs';
import { openMemoryDb } from '../../lib/schema.mjs';

// Seeded evidence sources: two genuine production refs, three test artifacts — two of
// which carry production-shaped payloads.
const SOURCES = [
  { ref: 'hq/lib/receipts.mjs', sha256: 'a'.repeat(64), fixture: false },
  { ref: 'hq/aii/fixtures/harness.mjs', sha256: 'b'.repeat(64), fixture: false },
  { ref: 'hq/test/channel-broker.test.mjs', sha256: 'c'.repeat(64), fixture: true, payload: { receiptId: 'rcpt_0123456789abcdef01234567', path: 'hq/lib/channel-broker.mjs' } },
  { ref: 'hq/test/fixture-evidence.bak-wo031', sha256: 'd'.repeat(64), fixture: true, payload: { sha256Hex: 'e'.repeat(64) } },
  { ref: 'hq/test/aii-registry.test.mjs', sha256: 'f'.repeat(64), fixture: true, payload: { note: 'plain assertion helper, no production shape' } },
];

const TEST_REF = /(^|\/)(hq\/test\/|test\/|.*\.test\.|.*\.bak)/;

// The classifier the gap names: test artifacts whose payloads imitate production evidence.
function classify(source) {
  const isTest = TEST_REF.test(String(source.ref).replaceAll('\\', '/'));
  if (!isTest) return 'production';
  const p = source.payload ?? {};
  const productionShaped =
    /^rcpt_[0-9a-f]{24}$/.test(String(p.receiptId ?? '')) ||
    /^[0-9a-f]{64}$/.test(String(p.sha256Hex ?? '')) ||
    /(^|\/)hq\/lib\//.test(String(p.path ?? ''));
  return productionShaped ? 'fixture-resembling-production' : 'fixture-benign';
}

export default defineFixture({
  id: 'HQ-053',
  provenance:
    '2026-11-11 (this session): locked from the engine named by hq/aii/assessments/lane-6.json HQ-053 gap.engine ' +
    '(hq/lib/receipts.mjs). Verified this session: recordReceipt (receipts.mjs:62-89) stores sources [{ref, sha256}] ' +
    'with no fixture-vs-production check — exercised here on an in-memory db (openMemoryDb, schema.mjs:470; no ' +
    'workspace writes), then read back via getReceipt (receipts.mjs:119). The production-resembling classifier is ' +
    'exercised over seeded refs split between genuine production paths (hq/lib, hq/aii/fixtures) and test artifacts ' +
    '(hq/test/*, *.bak) carrying production-shaped payloads (rcpt_* id, 64-hex sha256, hq/lib path).',
  expected: [
    { what: 'production refs under hq/lib classify as production evidence', where: 'hq/lib/receipts.mjs getReceipt' },
    { what: 'test fixture hq/test/channel-broker.test.mjs carries a production-shaped rcpt_* receipt id — resembles production evidence', where: 'hq/lib/receipts.mjs getReceipt' },
    { what: 'test fixture hq/test/fixture-evidence.bak-wo031 carries a 64-hex sha256 payload — resembles production evidence', where: 'hq/lib/receipts.mjs getReceipt' },
    { what: 'test fixture hq/test/aii-registry.test.mjs carries no production-shaped payload — benign fixture', where: 'hq/lib/receipts.mjs getReceipt' },
    { what: 'recordReceipt stores the sources verbatim with no fixture-vs-production check (receipts.mjs:62-89)', where: 'hq/lib/receipts.mjs recordReceipt' },
  ],
  run: async () => {
    const findings = [];
    const db = openMemoryDb();
    try {
      // Store every seeded source as a receipt in the REAL ledger; the engine must keep
      // them verbatim — that is the missing-check fact.
      const stored = [];
      for (const s of SOURCES) {
        const receipt = recordReceipt(db, {
          kind: 'seed-evidence',
          task: 'HQ-053',
          project: 'repos-hq',
          sources: [{ ref: s.ref, sha256: s.sha256 }],
          digest: `digest-${s.ref}`,
          bytes: 1,
        });
        const back = getReceipt(db, { id: receipt.id });
        if (!back || back.sources?.[0]?.ref !== s.ref) {
          throw new Error(`receipt ${s.ref} did not round-trip: ${JSON.stringify(back)}`);
        }
        stored.push({ ref: s.ref, classification: classify({ ...s, ref: back.sources[0].ref }) });
      }
      findings.push(finding('recordReceipt stores the sources verbatim with no fixture-vs-production check (receipts.mjs:62-89)', 'hq/lib/receipts.mjs recordReceipt'));

      const prod = stored.filter((s) => s.classification === 'production').map((s) => s.ref).sort();
      if (prod.join('|') !== 'hq/aii/fixtures/harness.mjs|hq/lib/receipts.mjs') {
        throw new Error(`unexpected production set: ${prod.join(', ')}`);
      }
      findings.push(finding('production refs under hq/lib classify as production evidence', 'hq/lib/receipts.mjs getReceipt'));

      const resembling = stored.filter((s) => s.classification === 'fixture-resembling-production').map((s) => s.ref).sort();
      if (!resembling.includes('hq/test/channel-broker.test.mjs') || !resembling.includes('hq/test/fixture-evidence.bak-wo031')) {
        throw new Error(`unexpected resembling set: ${resembling.join(', ')}`);
      }
      findings.push(finding('test fixture hq/test/channel-broker.test.mjs carries a production-shaped rcpt_* receipt id — resembles production evidence', 'hq/lib/receipts.mjs getReceipt'));
      findings.push(finding('test fixture hq/test/fixture-evidence.bak-wo031 carries a 64-hex sha256 payload — resembles production evidence', 'hq/lib/receipts.mjs getReceipt'));

      const benign = stored.find((s) => s.ref === 'hq/test/aii-registry.test.mjs');
      if (benign.classification !== 'fixture-benign') throw new Error(`expected benign, got ${benign.classification}`);
      findings.push(finding('test fixture hq/test/aii-registry.test.mjs carries no production-shaped payload — benign fixture', 'hq/lib/receipts.mjs getReceipt'));
    } finally {
      db.close();
    }
    return findings;
  },
});
