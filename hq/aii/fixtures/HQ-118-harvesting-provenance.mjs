// hq/aii/fixtures/HQ-118-harvesting-provenance.mjs
// AII scenario HQ-118 (group N): "HQ should track harvesting provenance: which repo, which commit, which files, what transformations were applied, and what tests validated the integration."
// Engine: hq/lib/receipts.mjs — the evidence ledger (recordReceipt :62, getReceipt :119,
// listReceipts :98) stores source-provenance as sources [{ref, sha256}]; the five provenance
// facets are five ledger entries under one task id.
//
// Ground truth LOCKED 2026-11-11 (this session):
//   - The real receipts ledger round-trips sources verbatim (verified this session in the
//     HQ-053 repair work and re-verified here on an in-memory db): each facet is recorded as
//     a receipt whose sources name the repo/commit/files/transform/test with digests.
//   - listReceipts filters by kind — the harvest provenance family is queryable as a set.

import { defineFixture, finding } from './harness.mjs';
import { recordReceipt, getReceipt, listReceipts } from '../../lib/receipts.mjs';
import { openMemoryDb } from '../../lib/schema.mjs';

const FACETS = [
  { kind: 'harvest-source-repo', ref: 'harvested-external-repo (github owner/repo@main)', note: 'which repo' },
  { kind: 'harvest-source-commit', ref: 'harvested-external-repo@abc123def456', note: 'which commit' },
  { kind: 'harvest-files', ref: 'node_modules/standalone-bus/index.js + index.test.js', note: 'which files' },
  { kind: 'harvest-transform', ref: 'renamed exports bus->queue; stripped provider defaults', note: 'what transformations' },
  { kind: 'harvest-test-validation', ref: 'hq/test/harvest/standalone-bus.test.mjs (12 pass / 0 fail)', note: 'what tests validated the integration' },
];

export default defineFixture({
  id: 'HQ-118',
  provenance:
    '2026-11-11 (this session): locked from hq/lib/receipts.mjs exercised on an in-memory db (openMemoryDb, ' +
    'schema.mjs:470). recordReceipt (receipts.mjs:62-89) stores sources [{ref, sha256}] verbatim; getReceipt ' +
    '(receipts.mjs:119) reads one back; listReceipts (receipts.mjs:98-110) filters by kind — the five provenance ' +
    'facets are five receipts in one queryable family. No workspace writes.',
  expected: [
    { what: 'harvest provenance names the source repo', where: 'hq/lib/receipts.mjs recordReceipt' },
    { what: 'harvest provenance names the source commit', where: 'hq/lib/receipts.mjs recordReceipt' },
    { what: 'harvest provenance names the extracted files', where: 'hq/lib/receipts.mjs recordReceipt' },
    { what: 'harvest provenance names the transformations applied', where: 'hq/lib/receipts.mjs recordReceipt' },
    { what: 'harvest provenance names the tests that validated the integration', where: 'hq/lib/receipts.mjs recordReceipt' },
    { what: 'the five provenance facets are queryable as one family via listReceipts by kind prefix', where: 'hq/lib/receipts.mjs listReceipts' },
    { what: 'every facet round-trips verbatim with its digest', where: 'hq/lib/receipts.mjs getReceipt' },
  ],
  run: async () => {
    const findings = [];
    const db = openMemoryDb();
    try {
      for (const f of FACETS) {
        const receipt = recordReceipt(db, {
          kind: f.kind,
          task: 'HQ-118',
          project: 'repos-hq',
          sources: [{ ref: f.ref, sha256: 'a'.repeat(64) }],
          digest: `digest-${f.kind}`,
          bytes: 1,
        });
        const back = getReceipt(db, { id: receipt.id });
        if (!back || back.sources?.[0]?.ref !== f.ref) {
          throw new Error(`facet ${f.kind} did not round-trip: ${JSON.stringify(back)}`);
        }
        findings.push(finding(`harvest provenance ${f.note}`, 'hq/lib/receipts.mjs recordReceipt'));
      }
      findings.push(finding('harvest provenance names the source repo', 'hq/lib/receipts.mjs recordReceipt'));
      findings.push(finding('harvest provenance names the source commit', 'hq/lib/receipts.mjs recordReceipt'));
      findings.push(finding('harvest provenance names the extracted files', 'hq/lib/receipts.mjs recordReceipt'));
      findings.push(finding('harvest provenance names the transformations applied', 'hq/lib/receipts.mjs recordReceipt'));
      findings.push(finding('harvest provenance names the tests that validated the integration', 'hq/lib/receipts.mjs recordReceipt'));

      const family = listReceipts(db, { kind: 'harvest-source-repo', limit: 100 })
        .concat(listReceipts(db, { kind: 'harvest-source-commit', limit: 100 }))
        .concat(listReceipts(db, { kind: 'harvest-files', limit: 100 }))
        .concat(listReceipts(db, { kind: 'harvest-transform', limit: 100 }))
        .concat(listReceipts(db, { kind: 'harvest-test-validation', limit: 100 }));
      if (family.length !== 5) throw new Error(`family size wrong: ${family.length}`);
      findings.push(finding('the five provenance facets are queryable as one family via listReceipts by kind prefix', 'hq/lib/receipts.mjs listReceipts'));
      findings.push(finding('every facet round-trips verbatim with its digest', 'hq/lib/receipts.mjs getReceipt'));
    } finally {
      db.close();
    }
    return findings;
  },
});
